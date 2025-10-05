/**
 * Планировщик задач и напоминаний
 * Использует node-cron для отправки напоминаний по расписанию
 */

const cron = require('node-cron');
const { db } = require('../database');
const notifier = require('./notifier');

/**
 * Отправить напоминания всем пользователям
 */
async function sendRemindersToAllUsers(timeOfDay) {
  return new Promise((resolve, reject) => {
    // Получаем всех пользователей с включенными напоминаниями
    const sql = `
      SELECT u.id, u.telegram_id, u.full_name, 
             COALESCE(r.reminders_enabled, 1) as reminders_enabled,
             r.morning_time, r.afternoon_time, r.evening_time
      FROM users u
      LEFT JOIN reminders r ON u.id = r.user_id
      WHERE COALESCE(r.reminders_enabled, 1) = 1
    `;

    db.all(sql, [], async (err, users) => {
      if (err) {
        console.error('Ошибка получения пользователей для напоминаний:', err);
        return reject(err);
      }

      console.log(`📅 Отправка напоминаний (${timeOfDay}) для ${users.length} пользователей`);

      let messages = {
        'morning': 'Доброе утро! Пора измерить уровень глюкозы натощак 🩸',
        'afternoon': 'Время обеда! Не забудьте измерить уровень глюкозы перед едой 🍽️',
        'evening': 'Добрый вечер! Время измерить уровень глюкозы перед ужином или сном 🌙'
      };

      for (const user of users) {
        try {
          await notifier.sendReminder(user.id, messages[timeOfDay]);
        } catch (error) {
          console.error(`Ошибка отправки напоминания пользователю ${user.id}:`, error);
        }
      }

      console.log(`✅ Напоминания (${timeOfDay}) отправлены`);
      resolve();
    });
  });
}

/**
 * Инициализировать все cron-задачи
 */
function initializeScheduler() {
  console.log('🕐 Инициализация планировщика задач...');

  // Утренние напоминания (8:00)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Запуск утренних напоминаний (08:00)');
    try {
      await sendRemindersToAllUsers('morning');
    } catch (error) {
      console.error('Ошибка в утренних напоминаниях:', error);
    }
  }, {
    timezone: "Europe/Moscow"
  });

  // Дневные напоминания (13:00)
  cron.schedule('0 13 * * *', async () => {
    console.log('⏰ Запуск дневных напоминаний (13:00)');
    try {
      await sendRemindersToAllUsers('afternoon');
    } catch (error) {
      console.error('Ошибка в дневных напоминаниях:', error);
    }
  }, {
    timezone: "Europe/Moscow"
  });

  // Вечерние напоминания (20:00)
  cron.schedule('0 20 * * *', async () => {
    console.log('⏰ Запуск вечерних напоминаний (20:00)');
    try {
      await sendRemindersToAllUsers('evening');
    } catch (error) {
      console.error('Ошибка в вечерних напоминаниях:', error);
    }
  }, {
    timezone: "Europe/Moscow"
  });

  // Еженедельная проверка и отчёты (каждое воскресенье в 21:00)
  cron.schedule('0 21 * * 0', async () => {
    console.log('📊 Запуск еженедельного анализа (воскресенье 21:00)');
    try {
      await generateWeeklyReports();
    } catch (error) {
      console.error('Ошибка в еженедельном анализе:', error);
    }
  }, {
    timezone: "Europe/Moscow"
  });

  console.log('✅ Планировщик задач запущен');
  console.log('   📅 Утренние напоминания: 08:00');
  console.log('   📅 Дневные напоминания: 13:00');
  console.log('   📅 Вечерние напоминания: 20:00');
  console.log('   📅 Еженедельные отчёты: воскресенье 21:00');
}

/**
 * Генерация и отправка еженедельных отчётов
 */
async function generateWeeklyReports() {
  return new Promise((resolve, reject) => {
    // Получаем всех пользователей
    db.all('SELECT id, full_name FROM users', [], async (err, users) => {
      if (err) {
        return reject(err);
      }

      console.log(`📊 Генерация еженедельных отчётов для ${users.length} пользователей`);

      for (const user of users) {
        try {
          await generateUserWeeklyReport(user.id, user.full_name);
        } catch (error) {
          console.error(`Ошибка генерации отчёта для пользователя ${user.id}:`, error);
        }
      }

      console.log('✅ Еженедельные отчёты обработаны');
      resolve();
    });
  });
}

/**
 * Генерация отчёта для конкретного пользователя
 */
async function generateUserWeeklyReport(userId, userName) {
  return new Promise((resolve, reject) => {
    // Получаем критические события за последние 7 дней
    const sql = `
      SELECT * FROM alerts 
      WHERE user_id = ? 
        AND severity = 'critical'
        AND created_at >= datetime('now', '-7 days')
      ORDER BY created_at DESC
    `;

    db.all(sql, [userId], async (err, alerts) => {
      if (err) {
        return reject(err);
      }

      // Если критических событий >= 3, отправляем отчёт врачу
      if (alerts.length >= 3) {
        console.log(`⚠️ У пользователя ${userName} обнаружено ${alerts.length} критических случаев за неделю`);

        const report = formatWeeklyReport(userName, alerts);
        
        try {
          await notifier.sendReportToDoctor(userId, report);
          console.log(`✅ Отчёт для пользователя ${userName} отправлен врачу`);
          
          // Уведомляем самого пользователя
          await notifier.sendWarningNotification(
            userId, 
            `📋 За прошедшую неделю у вас было ${alerts.length} критических случаев. Отчёт отправлен вашему врачу. Пожалуйста, свяжитесь с врачом для консультации.`
          );
        } catch (error) {
          console.error('Ошибка отправки отчёта:', error);
        }
      } else if (alerts.length > 0) {
        // Есть критические случаи, но меньше 3 - просто уведомляем пользователя
        await notifier.sendNormalNotification(
          userId,
          `📊 Еженедельная сводка: за неделю ${alerts.length} критических случаев. Следите за показателями здоровья.`
        );
      }

      resolve();
    });
  });
}

/**
 * Форматирование еженедельного отчёта
 */
function formatWeeklyReport(userName, alerts) {
  let report = `**Пациент:** ${userName}\n`;
  report += `**Период:** последние 7 дней\n`;
  report += `**Критических случаев:** ${alerts.length}\n\n`;
  report += `**Детали:**\n`;

  alerts.forEach((alert, index) => {
    const date = new Date(alert.created_at);
    const dateStr = date.toLocaleDateString('ru-RU');
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    report += `\n${index + 1}. ${dateStr} ${timeStr}\n`;
    report += `   Тип: ${translateMetricType(alert.metric_type)}\n`;
    report += `   Значение: ${alert.metric_value}\n`;
    report += `   Событие: ${translateAlertType(alert.alert_type)}\n`;
  });

  report += `\n\n**Рекомендация:** Требуется консультация и возможная корректировка лечения.`;

  return report;
}

/**
 * Перевод типа метрики
 */
function translateMetricType(type) {
  const translations = {
    'glucose': 'Уровень глюкозы',
    'pressure': 'Артериальное давление',
    'pulse': 'Пульс'
  };
  return translations[type] || type;
}

/**
 * Перевод типа алерта
 */
function translateAlertType(type) {
  const translations = {
    'glucose_critical': 'Критический уровень глюкозы',
    'pressure_critical': 'Критическое давление',
    'pulse_critical': 'Критический пульс'
  };
  return translations[type] || type;
}

/**
 * Тестовая отправка напоминания (для отладки)
 */
async function testReminder(userId) {
  try {
    await notifier.sendReminder(userId, 'Тестовое напоминание об измерении глюкозы 🩸');
    console.log('✅ Тестовое напоминание отправлено');
  } catch (error) {
    console.error('❌ Ошибка отправки тестового напоминания:', error);
  }
}

module.exports = {
  initializeScheduler,
  sendRemindersToAllUsers,
  generateWeeklyReports,
  testReminder
};
