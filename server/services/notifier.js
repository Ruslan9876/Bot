/**
 * Сервис уведомлений через Telegram Bot API
 * Отправляет уведомления пользователям о состоянии здоровья
 */

const db = require('../database');

/**
 * Отправить обычное информационное уведомление
 * @param {number} userId - ID пользователя в базе данных
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления (info/warning/critical)
 */
async function sendNotification(userId, message, type = 'info') {
    try {
        // Получаем telegram_id пользователя
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT telegram_id, full_name FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user || !user.telegram_id) {
            console.log(`⚠️ Пользователь ${userId} не найден или не имеет telegram_id`);
            return false;
        }

        const telegramId = user.telegram_id;
        
        // Формируем сообщение с эмодзи в зависимости от типа
        let emoji = '📊';
        if (type === 'warning') emoji = '⚠️';
        if (type === 'critical') emoji = '🚨';

        const fullMessage = `${emoji} ${message}`;

        // TODO: Здесь должна быть интеграция с реальным Telegram Bot API
        // Для разработки просто логируем
        console.log(`📤 Отправка уведомления пользователю ${user.full_name} (${telegramId}):`);
        console.log(`   Тип: ${type}`);
        console.log(`   Сообщение: ${fullMessage}`);

        // Сохраняем уведомление в базу данных
        await saveNotification(userId, type, message);

        return true;
    } catch (error) {
        console.error('❌ Ошибка при отправке уведомления:', error);
        return false;
    }
}

/**
 * Отправить обычное информационное уведомление
 */
async function sendNormalNotification(userId, message) {
    return sendNotification(userId, message, 'info');
}

/**
 * Отправить предупреждающее уведомление
 */
async function sendWarningNotification(userId, message) {
    return sendNotification(userId, message, 'warning');
}

/**
 * Отправить критическое уведомление
 */
async function sendCriticalAlert(userId, message) {
    return sendNotification(userId, message, 'critical');
}

/**
 * Отправить напоминание об измерении
 */
async function sendReminder(userId, message) {
    try {
        // Проверяем, включены ли напоминания для пользователя
        const settings = await new Promise((resolve, reject) => {
            db.get('SELECT reminders_enabled FROM reminders WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Если настроек нет или напоминания включены
        if (!settings || settings.reminders_enabled === 1) {
            return sendNotification(userId, `⏰ ${message}`, 'info');
        }

        return false;
    } catch (error) {
        console.error('❌ Ошибка при отправке напоминания:', error);
        return false;
    }
}

/**
 * Отправить отчёт врачу
 */
async function sendReportToDoctor(userId, report) {
    try {
        // Получаем контакт врача
        const doctor = await new Promise((resolve, reject) => {
            db.get('SELECT doctor_telegram_id, doctor_name FROM doctor_contacts WHERE user_id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!doctor || !doctor.doctor_telegram_id) {
            console.log(`⚠️ У пользователя ${userId} не указан контакт врача`);
            return false;
        }

        const message = `📋 **ЕЖЕНЕДЕЛЬНЫЙ ОТЧЁТ**\n\n${report}`;

        // TODO: Здесь должна быть интеграция с реальным Telegram Bot API
        console.log(`📤 Отправка отчёта врачу ${doctor.doctor_name} (${doctor.doctor_telegram_id}):`);
        console.log(message);

        // Сохраняем в историю
        await saveNotification(userId, 'report', `Отчёт отправлен врачу: ${doctor.doctor_name}`);

        return true;
    } catch (error) {
        console.error('❌ Ошибка при отправке отчёта врачу:', error);
        return false;
    }
}

/**
 * Сохранить уведомление в базу данных
 */
async function saveNotification(userId, type, message) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO notifications (user_id, type, message, created_at)
            VALUES (?, ?, ?, datetime('now'))
        `;
        db.run(query, [userId, type, message], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Получить историю уведомлений пользователя
 */
async function getNotificationHistory(userId, limit = 50) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        db.all(query, [userId, limit], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

/**
 * Инициализация Telegram бота (будет реализовано позже)
 */
function initializeTelegramBot(botToken) {
    // TODO: Инициализация node-telegram-bot-api
    console.log('🤖 Telegram Bot API будет инициализирован с токеном:', botToken ? '***' : 'не указан');
    console.log('💡 Для полноценной работы необходимо:');
    console.log('   1. Создать бота через @BotFather');
    console.log('   2. Получить токен');
    console.log('   3. Добавить токен в .env файл (TELEGRAM_BOT_TOKEN)');
    console.log('   4. Пользователи должны написать боту /start для связи');
}

module.exports = {
    sendNotification,
    sendNormalNotification,
    sendWarningNotification,
    sendCriticalAlert,
    sendReminder,
    sendReportToDoctor,
    getNotificationHistory,
    initializeTelegramBot
};
