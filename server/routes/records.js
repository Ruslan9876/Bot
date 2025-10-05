const express = require('express');
const router = express.Router();
const { db } = require('../database');
const analyzer = require('../services/analyzer');
const notifier = require('../services/notifier');

// Добавление записи уровня глюкозы
router.post('/glucose', async (req, res) => {
  const { user_id, date, time, glucose_level, meal_type } = req.body;

  const sql = `
    INSERT INTO glucose_records (user_id, date, time, glucose_level)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [user_id, date, time, glucose_level], async function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // AI-анализ уровня глюкозы
    try {
      const analysis = analyzer.analyzeGlucose(glucose_level, meal_type || 'натощак');
      
      // Сохраняем критическое событие, если нужно
      if (analysis.status === 'critical') {
        await saveAlert(user_id, 'glucose_critical', 'glucose', glucose_level, 'critical');
      }

      // Отправляем уведомление, если есть отклонение
      if (analysis.status === 'critical') {
        await notifier.sendCriticalAlert(user_id, analysis.message + '\n\n' + analysis.recommendations.join('\n'));
      } else if (analysis.status === 'warning') {
        await notifier.sendWarningNotification(user_id, analysis.message + '\n\n' + analysis.recommendations.join('\n'));
      }

      res.json({ 
        success: true, 
        id: this.lastID,
        analysis: analysis
      });
    } catch (error) {
      console.error('Ошибка AI-анализа:', error);
      res.json({ success: true, id: this.lastID });
    }
  });
});

// Добавление записи о приеме пищи
router.post('/meal', (req, res) => {
  const { user_id, date, meal_time, dish_name, carbs } = req.body;

  const sql = `
    INSERT INTO meal_records (user_id, date, meal_time, dish_name, carbs)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [user_id, date, meal_time, dish_name, carbs], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Добавление записи о лекарствах
router.post('/medication', (req, res) => {
  const { user_id, medication_name, dose, administration_time } = req.body;

  const sql = `
    INSERT INTO medication_records (user_id, medication_name, dose, administration_time)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [user_id, medication_name, dose, administration_time], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Добавление записи о физической активности
router.post('/activity', (req, res) => {
  const { user_id, activity_type, duration, intensity, date } = req.body;

  const sql = `
    INSERT INTO activity_records (user_id, activity_type, duration, intensity, date)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [user_id, activity_type, duration, intensity, date], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Добавление записи о самочувствии
router.post('/health', (req, res) => {
  const { user_id, date, time, general_state, symptoms, blood_pressure, pulse, weight, special_circumstances } = req.body;

  const sql = `
    INSERT INTO health_records (user_id, date, time, general_state, symptoms, blood_pressure, pulse, weight, special_circumstances)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [user_id, date, time, general_state, symptoms, blood_pressure, pulse, weight, special_circumstances], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Добавление записи давления
router.post('/pressure', async (req, res) => {
  const { user_id, date, time, blood_pressure } = req.body;

  const sql = `
    INSERT INTO pressure_records (user_id, date, time, blood_pressure)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [user_id, date, time, blood_pressure], async function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // AI-анализ давления
    try {
      const [systolic, diastolic] = blood_pressure.split('/').map(Number);
      const analysis = analyzer.analyzeBloodPressure(systolic, diastolic);
      
      // Сохраняем критическое событие
      if (analysis.status === 'critical') {
        await saveAlert(user_id, 'pressure_critical', 'pressure', blood_pressure, 'critical');
      }

      // Отправляем уведомление
      if (analysis.status === 'critical') {
        await notifier.sendCriticalAlert(user_id, analysis.message + '\n\n' + analysis.recommendations.join('\n'));
      } else if (analysis.status === 'warning') {
        await notifier.sendWarningNotification(user_id, analysis.message + '\n\n' + analysis.recommendations.join('\n'));
      }

      res.json({ 
        success: true, 
        id: this.lastID,
        analysis: analysis
      });
    } catch (error) {
      console.error('Ошибка AI-анализа:', error);
      res.json({ success: true, id: this.lastID });
    }
  });
});

// Добавление записи пульса
router.post('/pulse', async (req, res) => {
  const { user_id, date, time, pulse } = req.body;

  const sql = `
    INSERT INTO pulse_records (user_id, date, time, pulse)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [user_id, date, time, pulse], async function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // AI-анализ пульса
    try {
      const analysis = analyzer.analyzePulse(pulse);
      
      // Сохраняем критическое событие
      if (analysis.status === 'critical') {
        await saveAlert(user_id, 'pulse_critical', 'pulse', pulse, 'critical');
      }

      // Отправляем уведомление
      if (analysis.status === 'critical') {
        await notifier.sendCriticalAlert(user_id, analysis.message + '\n\n' + analysis.recommendations.join('\n'));
      } else if (analysis.status === 'warning') {
        await notifier.sendWarningNotification(user_id, analysis.message + '\n\n' + analysis.recommendations.join('\n'));
      }

      res.json({ 
        success: true, 
        id: this.lastID,
        analysis: analysis
      });
    } catch (error) {
      console.error('Ошибка AI-анализа:', error);
      res.json({ success: true, id: this.lastID });
    }
  });
});

// Добавление записи веса
router.post('/weight', (req, res) => {
  const { user_id, date, weight } = req.body;

  const sql = `
    INSERT INTO weight_records (user_id, date, weight)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [user_id, date, weight], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// Получение записей давления
router.get('/pressure/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { limit = 5 } = req.query;

  const sql = `
    SELECT * FROM pressure_records 
    WHERE user_id = ? 
    ORDER BY date DESC, time DESC 
    LIMIT ?
  `;

  db.all(sql, [user_id, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Получение записей пульса
router.get('/pulse/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { limit = 5 } = req.query;

  const sql = `
    SELECT * FROM pulse_records 
    WHERE user_id = ? 
    ORDER BY date DESC, time DESC 
    LIMIT ?
  `;

  db.all(sql, [user_id, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Получение записей веса
router.get('/weight/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { limit = 10 } = req.query;

  const sql = `
    SELECT * FROM weight_records 
    WHERE user_id = ? 
    ORDER BY date DESC 
    LIMIT ?
  `;

  db.all(sql, [user_id, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Получение всех записей пользователя
router.get('/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { startDate, endDate } = req.query;

  let dateFilter = '';
  const params = [user_id];

  if (startDate && endDate) {
    dateFilter = ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  const queries = {
    glucose: `SELECT * FROM glucose_records WHERE user_id = ?${dateFilter} ORDER BY date DESC, time DESC`,
    meals: `SELECT * FROM meal_records WHERE user_id = ?${dateFilter} ORDER BY date DESC, meal_time DESC`,
    medications: `SELECT * FROM medication_records WHERE user_id = ?${dateFilter} ORDER BY administration_time DESC`,
    activities: `SELECT * FROM activity_records WHERE user_id = ?${dateFilter} ORDER BY date DESC`,
    health: `SELECT * FROM health_records WHERE user_id = ?${dateFilter} ORDER BY date DESC, time DESC`,
    pressure: `SELECT * FROM pressure_records WHERE user_id = ?${dateFilter} ORDER BY date DESC, time DESC`,
    pulse: `SELECT * FROM pulse_records WHERE user_id = ?${dateFilter} ORDER BY date DESC, time DESC`,
    weight: `SELECT * FROM weight_records WHERE user_id = ? ORDER BY date DESC`
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    // Для веса не используем dateFilter
    const queryParams = key === 'weight' ? [user_id] : params;
    
    db.all(query, queryParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      results[key] = rows;
      completed++;

      if (completed === total) {
        res.json(results);
      }
    });
  });
});

// Вспомогательная функция для сохранения критического события
async function saveAlert(userId, alertType, metricType, metricValue, severity) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO alerts (user_id, alert_type, metric_type, metric_value, severity, notified)
      VALUES (?, ?, ?, ?, ?, 1)
    `;
    db.run(sql, [userId, alertType, metricType, String(metricValue), severity], (err) => {
      if (err) {
        console.error('Ошибка сохранения алерта:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = router;
