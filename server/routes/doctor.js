const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Отправка сообщения врачу
router.post('/message', (req, res) => {
  const { user_id, message } = req.body;

  const sql = `
    INSERT INTO doctor_messages (user_id, message)
    VALUES (?, ?)
  `;

  db.run(sql, [user_id, message], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      success: true,
      message_id: this.lastID,
      message: 'Сообщение отправлено врачу'
    });
  });
});

// Получение истории сообщений пользователя
router.get('/messages/:user_id', (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT * FROM doctor_messages 
    WHERE user_id = ? 
    ORDER BY sent_at DESC
  `;

  db.all(sql, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// Получение непрочитанных сообщений (для врачей)
router.get('/unread', (req, res) => {
  const sql = `
    SELECT dm.*, u.full_name, u.phone 
    FROM doctor_messages dm
    JOIN users u ON dm.user_id = u.id
    WHERE dm.is_read = 0
    ORDER BY dm.sent_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// Отметить сообщение как прочитанное
router.put('/message/:id/read', (req, res) => {
  const { id } = req.params;

  const sql = 'UPDATE doctor_messages SET is_read = 1 WHERE id = ?';

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ success: true });
  });
});

module.exports = router;
