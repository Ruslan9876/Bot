const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Регистрация пользователя
router.post('/register', (req, res) => {
  const { telegram_id, full_name, location, has_diabetes, age, gender, phone } = req.body;

  const sql = `
    INSERT INTO users (telegram_id, full_name, location, has_diabetes, age, gender, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [telegram_id, full_name, location, has_diabetes, age, gender, phone], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Пользователь уже зарегистрирован' });
      }
      return res.status(500).json({ error: err.message });
    }

    res.json({
      success: true,
      user_id: this.lastID,
      message: 'Регистрация успешна'
    });
  });
});

// Получение данных пользователя
router.get('/:telegram_id', (req, res) => {
  const { telegram_id } = req.params;

  const sql = 'SELECT * FROM users WHERE telegram_id = ?';

  db.get(sql, [telegram_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(row);
  });
});

// Обновление данных пользователя
router.put('/:telegram_id', (req, res) => {
  const { telegram_id } = req.params;
  const { full_name, location, has_diabetes, age, gender, phone } = req.body;

  const sql = `
    UPDATE users 
    SET full_name = ?, location = ?, has_diabetes = ?, age = ?, gender = ?, phone = ?
    WHERE telegram_id = ?
  `;

  db.run(sql, [full_name, location, has_diabetes, age, gender, phone, telegram_id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ success: true, message: 'Данные обновлены' });
  });
});

module.exports = router;
