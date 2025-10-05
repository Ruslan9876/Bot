const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
  } else {
    console.log('✅ База данных подключена');
  }
});

const initialize = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Таблица пользователей
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_id INTEGER UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          location TEXT,
          has_diabetes BOOLEAN NOT NULL,
          age INTEGER,
          gender TEXT,
          phone TEXT,
          registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Таблица записей уровня глюкозы
      db.run(`
        CREATE TABLE IF NOT EXISTS glucose_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          glucose_level REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица приема пищи
      db.run(`
        CREATE TABLE IF NOT EXISTS meal_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          meal_time TIME NOT NULL,
          dish_name TEXT NOT NULL,
          carbs REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица инсулина/лекарств
      db.run(`
        CREATE TABLE IF NOT EXISTS medication_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          medication_name TEXT NOT NULL,
          dose TEXT NOT NULL,
          administration_time DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица физической активности
      db.run(`
        CREATE TABLE IF NOT EXISTS activity_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          activity_type TEXT NOT NULL,
          duration INTEGER NOT NULL,
          intensity TEXT NOT NULL,
          date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица самочувствия
      db.run(`
        CREATE TABLE IF NOT EXISTS health_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          general_state TEXT,
          symptoms TEXT,
          blood_pressure TEXT,
          pulse INTEGER,
          weight REAL,
          special_circumstances TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица давления (отдельная для быстрого доступа)
      db.run(`
        CREATE TABLE IF NOT EXISTS pressure_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          blood_pressure TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица пульса (отдельная для быстрого доступа)
      db.run(`
        CREATE TABLE IF NOT EXISTS pulse_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          pulse INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица веса (отдельная для быстрого доступа)
      db.run(`
        CREATE TABLE IF NOT EXISTS weight_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          weight REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица сообщений врачу
      db.run(`
        CREATE TABLE IF NOT EXISTS doctor_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT 0,
          sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица уведомлений (для AI-помощника)
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица настроек напоминаний (для AI-помощника)
      db.run(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          reminders_enabled BOOLEAN DEFAULT 1,
          morning_time TEXT DEFAULT '08:00',
          afternoon_time TEXT DEFAULT '13:00',
          evening_time TEXT DEFAULT '20:00',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица контактов врачей (для AI-помощника)
      db.run(`
        CREATE TABLE IF NOT EXISTS doctor_contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          doctor_name TEXT,
          doctor_telegram_id INTEGER,
          doctor_phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Таблица критических событий (для AI-помощника)
      db.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          alert_type TEXT NOT NULL,
          metric_type TEXT NOT NULL,
          metric_value TEXT NOT NULL,
          severity TEXT NOT NULL,
          notified BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Все таблицы созданы (включая AI-помощник)');
          resolve();
        }
      });
    });
  });
};

module.exports = {
  db,
  initialize
};
