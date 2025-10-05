const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Получить настройки напоминаний пользователя
router.get('/reminders/:user_id', (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT * FROM reminders WHERE user_id = ?
  `;

  db.get(sql, [user_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Если настроек нет, возвращаем значения по умолчанию
    if (!row) {
      return res.json({
        reminders_enabled: 1,
        morning_time: '08:00',
        afternoon_time: '13:00',
        evening_time: '20:00'
      });
    }
    
    res.json(row);
  });
});

// Сохранить/обновить настройки напоминаний
router.post('/reminders', (req, res) => {
  const { user_id, reminders_enabled, morning_time, afternoon_time, evening_time } = req.body;

  const sql = `
    INSERT INTO reminders (user_id, reminders_enabled, morning_time, afternoon_time, evening_time, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      reminders_enabled = excluded.reminders_enabled,
      morning_time = excluded.morning_time,
      afternoon_time = excluded.afternoon_time,
      evening_time = excluded.evening_time,
      updated_at = datetime('now')
  `;

  db.run(sql, [user_id, reminders_enabled, morning_time, afternoon_time, evening_time], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Настройки напоминаний сохранены' });
  });
});

// Получить контакт врача
router.get('/doctor-contact/:user_id', (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT * FROM doctor_contacts WHERE user_id = ?
  `;

  db.get(sql, [user_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row || {});
  });
});

// Сохранить/обновить контакт врача
router.post('/doctor-contact', (req, res) => {
  const { user_id, doctor_name, doctor_telegram_id, doctor_phone } = req.body;

  const sql = `
    INSERT INTO doctor_contacts (user_id, doctor_name, doctor_telegram_id, doctor_phone, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      doctor_name = excluded.doctor_name,
      doctor_telegram_id = excluded.doctor_telegram_id,
      doctor_phone = excluded.doctor_phone,
      updated_at = datetime('now')
  `;

  db.run(sql, [user_id, doctor_name, doctor_telegram_id, doctor_phone], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Контакт врача сохранён' });
  });
});

// Получить историю уведомлений
router.get('/notifications/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { limit = 20 } = req.query;

  const sql = `
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;

  db.all(sql, [user_id, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Отметить уведомление как прочитанное
router.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE notifications 
    SET is_read = 1 
    WHERE id = ?
  `;

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Получить критические события
router.get('/alerts/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { days = 7, limit = 50 } = req.query;

  const sql = `
    SELECT * FROM alerts 
    WHERE user_id = ? 
      AND created_at >= datetime('now', '-${days} days')
    ORDER BY created_at DESC 
    LIMIT ?
  `;

  db.all(sql, [user_id, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Статистика критических событий за период
router.get('/alerts-stats/:user_id', (req, res) => {
  const { user_id } = req.params;
  const { days = 7 } = req.query;

  const sql = `
    SELECT 
      metric_type,
      COUNT(*) as count,
      MAX(created_at) as last_occurrence
    FROM alerts 
    WHERE user_id = ? 
      AND severity = 'critical'
      AND created_at >= datetime('now', '-${days} days')
    GROUP BY metric_type
  `;

  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const stats = {
      total: rows.reduce((sum, row) => sum + row.count, 0),
      by_type: rows,
      period_days: days
    };
    
    res.json(stats);
  });
});

module.exports = router;
