const express = require('express');
const router = express.Router();
const { db } = require('../database');
const ExcelJS = require('exceljs');

// Экспорт данных в Excel
router.get('/excel/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Создаем новую книгу Excel
    const workbook = new ExcelJS.Workbook();
    
    // Получаем данные пользователя
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    let dateFilter = '';
    const params = [user_id];
    if (startDate && endDate) {
      dateFilter = ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Лист 1: Уровень глюкозы
    const glucoseSheet = workbook.addWorksheet('Уровень глюкозы');
    glucoseSheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Время', key: 'time', width: 10 },
      { header: 'Уровень глюкозы (ммоль/л)', key: 'glucose_level', width: 25 }
    ];

    const glucoseData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM glucose_records WHERE user_id = ?${dateFilter} ORDER BY date, time`, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    glucoseData.forEach(row => glucoseSheet.addRow(row));

    // Лист 2: Прием пищи
    const mealSheet = workbook.addWorksheet('Прием пищи');
    mealSheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Время', key: 'meal_time', width: 10 },
      { header: 'Блюдо', key: 'dish_name', width: 30 },
      { header: 'Углеводы (г)', key: 'carbs', width: 15 }
    ];

    const mealData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM meal_records WHERE user_id = ?${dateFilter} ORDER BY date, meal_time`, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    mealData.forEach(row => mealSheet.addRow(row));

    // Лист 3: Лекарства
    const medSheet = workbook.addWorksheet('Лекарства');
    medSheet.columns = [
      { header: 'Название', key: 'medication_name', width: 25 },
      { header: 'Доза', key: 'dose', width: 15 },
      { header: 'Время введения', key: 'administration_time', width: 20 }
    ];

    const medData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM medication_records WHERE user_id = ? ORDER BY administration_time DESC`, [user_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    medData.forEach(row => medSheet.addRow(row));

    // Лист 4: Физическая активность
    const activitySheet = workbook.addWorksheet('Физическая активность');
    activitySheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Вид активности', key: 'activity_type', width: 25 },
      { header: 'Длительность (мин)', key: 'duration', width: 20 },
      { header: 'Интенсивность', key: 'intensity', width: 15 }
    ];

    const activityData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM activity_records WHERE user_id = ?${dateFilter} ORDER BY date`, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    activityData.forEach(row => activitySheet.addRow(row));

    // Лист 5: Самочувствие
    const healthSheet = workbook.addWorksheet('Самочувствие');
    healthSheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Время', key: 'time', width: 10 },
      { header: 'Состояние', key: 'general_state', width: 20 },
      { header: 'Симптомы', key: 'symptoms', width: 25 },
      { header: 'АД', key: 'blood_pressure', width: 12 },
      { header: 'Пульс', key: 'pulse', width: 10 },
      { header: 'Вес (кг)', key: 'weight', width: 10 },
      { header: 'Особые обстоятельства', key: 'special_circumstances', width: 30 }
    ];

    const healthData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM health_records WHERE user_id = ?${dateFilter} ORDER BY date, time`, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    healthData.forEach(row => healthSheet.addRow(row));

    // Лист 6: Давление
    const pressureSheet = workbook.addWorksheet('Давление');
    pressureSheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Время', key: 'time', width: 10 },
      { header: 'АД (мм рт. ст.)', key: 'blood_pressure', width: 20 }
    ];

    const pressureData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM pressure_records WHERE user_id = ?${dateFilter} ORDER BY date, time`, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    pressureData.forEach(row => pressureSheet.addRow(row));

    // Лист 7: Пульс
    const pulseSheet = workbook.addWorksheet('Пульс');
    pulseSheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Время', key: 'time', width: 10 },
      { header: 'Пульс (уд/мин)', key: 'pulse', width: 20 }
    ];

    const pulseData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM pulse_records WHERE user_id = ?${dateFilter} ORDER BY date, time`, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    pulseData.forEach(row => pulseSheet.addRow(row));

    // Лист 8: Вес
    const weightSheet = workbook.addWorksheet('Вес');
    weightSheet.columns = [
      { header: 'Дата', key: 'date', width: 15 },
      { header: 'Вес (кг)', key: 'weight', width: 15 }
    ];

    const weightData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM weight_records WHERE user_id = ? ORDER BY date DESC`, [user_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    weightData.forEach(row => weightSheet.addRow(row));

    // Лист 9: Информация о пациенте
    const infoSheet = workbook.addWorksheet('Информация о пациенте');
    infoSheet.addRow(['ФИО:', user.full_name]);
    infoSheet.addRow(['Возраст:', user.age]);
    infoSheet.addRow(['Пол:', user.gender]);
    infoSheet.addRow(['Место жительства:', user.location]);
    infoSheet.addRow(['Сахарный диабет:', user.has_diabetes ? 'Да' : 'Нет']);
    infoSheet.addRow(['Телефон:', user.phone]);
    infoSheet.addRow(['Дата регистрации:', user.registered_at]);

    // Устанавливаем заголовки для скачивания файла
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=patient_${user_id}_data.xlsx`);

    // Отправляем файл
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Ошибка при экспорте:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получение данных для графиков
router.get('/chart/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { days = 30 } = req.query;

  const sql = `
    SELECT 
      date,
      AVG(glucose_level) as avg_glucose,
      MIN(glucose_level) as min_glucose,
      MAX(glucose_level) as max_glucose,
      COUNT(*) as measurements
    FROM glucose_records
    WHERE user_id = ? 
      AND date >= date('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date
  `;

  db.all(sql, [user_id, days], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      labels: rows.map(r => r.date),
      datasets: [{
        label: 'Средний уровень',
        data: rows.map(r => r.avg_glucose)
      }, {
        label: 'Минимум',
        data: rows.map(r => r.min_glucose)
      }, {
        label: 'Максимум',
        data: rows.map(r => r.max_glucose)
      }]
    });
  });
});

module.exports = router;
