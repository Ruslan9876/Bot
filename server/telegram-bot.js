const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN не установлен. Бот не будет запущен.');
  module.exports = null;
} else {
  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
      bot.sendMessage(chatId, 
        'Добро пожаловать в приложение для управления диабетом! 🏥\n\n' +
        'Нажмите на кнопку меню, чтобы открыть Web App.',
        {
          reply_markup: {
            keyboard: [
              [{
                text: '📱 Открыть приложение',
                web_app: { url: process.env.WEB_APP_URL || 'https://your-webapp-url.com' }
              }]
            ],
            resize_keyboard: true
          }
        }
      );
    }
  });

  console.log('✅ Telegram бот запущен');
  module.exports = bot;
}
