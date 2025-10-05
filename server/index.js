const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const telegramBot = require('./telegram-bot');
const scheduler = require('./services/scheduler');
const notifier = require('./services/notifier');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
const userRoutes = require('./routes/users');
const recordsRoutes = require('./routes/records');
const doctorRoutes = require('./routes/doctor');
const exportRoutes = require('./routes/export');
const assistantRoutes = require('./routes/assistant');

app.use('/api/users', userRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/assistant', assistantRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Initialize database and start server
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Web App доступен по адресу: http://localhost:${PORT}`);
    
    // Инициализация AI-помощника
    console.log('\n🤖 Запуск AI-помощника...');
    scheduler.initializeScheduler();
    notifier.initializeTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    console.log('✅ AI-помощник активирован\n');
  });
}).catch(err => {
  console.error('Ошибка инициализации базы данных:', err);
  process.exit(1);
});
