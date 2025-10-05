# 🚀 Развертывание в Yandex Cloud и запуск через Telegram Bot

## 📋 Содержание

1. [Подготовка Telegram бота](#1-подготовка-telegram-бота)
2. [Подготовка проекта](#2-подготовка-проекта)
3. [Настройка Yandex Cloud](#3-настройка-yandex-cloud)
4. [Развертывание на виртуальной машине](#4-развертывание-на-виртуальной-машине)
5. [Настройка домена и SSL](#5-настройка-домена-и-ssl)
6. [Запуск и проверка](#6-запуск-и-проверка)
7. [Обслуживание](#7-обслуживание)

---

## 1. Подготовка Telegram бота

### Шаг 1.1: Создайте бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду: `/newbot`
3. Введите имя: **Diabetes Assistant**
4. Введите username: **diabetes_assistant_bot** (должен заканчиваться на `_bot`)
5. **СОХРАНИТЕ ТОКЕН!**

**Пример токена:**
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

### Шаг 1.2: Настройте команды

Отправьте BotFather:
```
/setcommands
```
Выберите бота и вставьте:
```
start - 🚀 Запустить приложение
help - ❓ Помощь
settings - ⚙️ Настройки
stats - 📊 Статистика
```

### Шаг 1.3: Настройте описание

```
/setdescription
```
Вставьте:
```
Умный помощник для управления диабетом 🤖💙

✅ Автоматический анализ показателей
⏰ Напоминания об измерениях  
📊 Еженедельные отчёты врачу
💊 Контроль лекарств и питания
```

---

## 2. Подготовка проекта

### Шаг 2.1: Создайте .env файл

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=ваш_токен_здесь

# Server
PORT=3000
NODE_ENV=production

# Database  
DB_PATH=/var/www/diabetes-app/database.db

# Web App URL (обновите после деплоя)
WEB_APP_URL=https://ваш-домен.ru
```

### Шаг 2.2: Проверьте .gitignore

Убедитесь, что в `.gitignore` есть:
```
.env
node_modules/
database.db
*.log
```

### Шаг 2.3: Обновите package.json

Добавьте скрипт для production:
```json
{
  "scripts": {
    "start": "node server/index.js",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "node server/index.js",
    "pm2": "pm2 start server/index.js --name diabetes-app"
  }
}
```

### Шаг 2.4: Подготовьте проект к деплою

```powershell
# В локальной папке проекта
git init
git add .
git commit -m "Initial commit with AI assistant"
```

Или загрузите на GitHub:
```powershell
git remote add origin https://github.com/ваш-username/diabetes-app.git
git push -u origin main
```

---

## 3. Настройка Yandex Cloud

### Шаг 3.1: Создайте аккаунт

1. Перейдите на [cloud.yandex.ru](https://cloud.yandex.ru)
2. Нажмите **Начать** и войдите через Яндекс ID
3. Создайте **биллинг-аккаунт** (нужна карта, но есть бесплатный грант)
4. Получите **4000₽ на 60 дней** (бесплатный грант для новых пользователей)

### Шаг 3.2: Создайте каталог (Folder)

1. В консоли Yandex Cloud нажмите **Создать каталог**
2. Имя: `diabetes-app`
3. Описание: `Telegram Web App для диабета`
4. Нажмите **Создать**

### Шаг 3.3: Установите Yandex Cloud CLI (опционально)

Для Windows (PowerShell):
```powershell
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')
```

Инициализация:
```powershell
yc init
```

---

## 4. Развертывание на виртуальной машине

### Шаг 4.1: Создайте виртуальную машину

1. В консоли Yandex Cloud перейдите в **Compute Cloud**
2. Нажмите **Создать ВМ**

**Параметры:**
- **Имя:** `diabetes-app-vm`
- **Зона доступности:** `ru-central1-a`
- **Платформа:** Intel Ice Lake
- **Конфигурация:**
  - vCPU: 2
  - RAM: 2 ГБ
  - Гарантированная доля: 20%
  
**Стоимость:** ~500₽/месяц (покроется грантом)

**Операционная система:**
- **Образ:** Ubuntu 22.04 LTS
- **Диск:** 10 ГБ HDD (достаточно)

**Доступ:**
- ✅ Создайте SSH-ключ или используйте существующий
- ✅ Включите **Публичный IP адрес**

3. Нажмите **Создать ВМ**

### Шаг 4.2: Подключитесь к ВМ по SSH

**Windows (PowerShell):**
```powershell
ssh yc-user@<ПУБЛИЧНЫЙ_IP>
```

**Где взять IP:** В консоли Yandex Cloud → Compute Cloud → ваша ВМ

### Шаг 4.3: Установите необходимое ПО

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверьте версии
node --version  # должно быть v18.x
npm --version   # должно быть 9.x

# Установите PM2 (менеджер процессов)
sudo npm install -g pm2

# Установите Git
sudo apt install -y git

# Установите Nginx (веб-сервер)
sudo apt install -y nginx

# Установите Certbot (для SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Шаг 4.4: Клонируйте проект

**Вариант 1: Из GitHub (рекомендуется)**
```bash
cd /var/www
sudo git clone https://github.com/ваш-username/diabetes-app.git
sudo chown -R $USER:$USER diabetes-app
cd diabetes-app
```

**Вариант 2: Через SCP (если не используете Git)**
```powershell
# На локальном компьютере
scp -r c:\Users\Ruslan\Desktop\mvp yc-user@<IP>:/tmp/diabetes-app
```

Затем на сервере:
```bash
sudo mv /tmp/diabetes-app /var/www/
sudo chown -R $USER:$USER /var/www/diabetes-app
cd /var/www/diabetes-app
```

### Шаг 4.5: Настройте проект

```bash
# Установите зависимости
npm install --production

# Создайте .env файл
nano .env
```

Вставьте в .env:
```env
TELEGRAM_BOT_TOKEN=ваш_реальный_токен
PORT=3000
NODE_ENV=production
DB_PATH=/var/www/diabetes-app/database.db
WEB_APP_URL=https://ваш-домен.ru
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 4.6: Соберите frontend

```bash
# Перейдите в папку client
cd /var/www/diabetes-app/client

# Установите Vite локально (если нужно)
npm install

# Соберите статику
npx vite build

# Вернитесь в корень
cd /var/www/diabetes-app
```

После сборки статические файлы будут в `client/dist/`

### Шаг 4.7: Настройте Nginx

```bash
# Создайте конфиг для сайта
sudo nano /etc/nginx/sites-available/diabetes-app
```

Вставьте:
```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # Статические файлы (frontend)
    location / {
        root /var/www/diabetes-app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API (backend)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфиг:
```bash
sudo ln -s /etc/nginx/sites-available/diabetes-app /etc/nginx/sites-enabled/
sudo nginx -t  # проверка конфигурации
sudo systemctl restart nginx
```

---

## 5. Настройка домена и SSL

### Шаг 5.1: Настройте домен

1. Купите домен (например, на [reg.ru](https://www.reg.ru) или [nic.ru](https://www.nic.ru))
2. В панели управления доменом добавьте A-запись:
   ```
   Тип: A
   Имя: @
   Значение: <ПУБЛИЧНЫЙ_IP_ВАШЕЙ_ВМ>
   TTL: 3600
   ```
3. Добавьте запись для www:
   ```
   Тип: A
   Имя: www
   Значение: <ПУБЛИЧНЫЙ_IP_ВАШЕЙ_ВМ>
   TTL: 3600
   ```

**⏰ Подождите 5-30 минут** пока DNS обновится

### Шаг 5.2: Установите SSL сертификат (HTTPS)

```bash
# Замените ваш-домен.ru на реальный домен
sudo certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Certbot спросит:
- Email: введите ваш email
- Согласие с ToS: Yes
- Sharing email: No (или Yes, как хотите)
- Redirect HTTP to HTTPS: Yes (рекомендуется)

Certbot автоматически обновит конфиг Nginx и добавит SSL!

### Шаг 5.3: Автообновление сертификата

```bash
# Тест автообновления
sudo certbot renew --dry-run
```

Certbot автоматически добавит задачу в cron для обновления сертификата каждые 3 месяца.

---

## 6. Запуск и проверка

### Шаг 6.1: Запустите приложение через PM2

```bash
cd /var/www/diabetes-app

# Запуск
pm2 start server/index.js --name diabetes-app

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Проверка статуса
pm2 status
pm2 logs diabetes-app
```

### Шаг 6.2: Проверьте работу

1. Откройте браузер: `https://ваш-домен.ru`
2. Должна открыться страница приложения
3. Проверьте API: `https://ваш-домен.ru/api/` (должна быть ошибка 404, это нормально)

### Шаг 6.3: Обновите URL в .env и Telegram

**На сервере:**
```bash
nano /var/www/diabetes-app/.env
```

Измените:
```env
WEB_APP_URL=https://ваш-домен.ru
```

Перезапустите:
```bash
pm2 restart diabetes-app
```

**В Telegram:**
1. Откройте BotFather
2. `/mybots` → выберите бота → **Bot Settings** → **Menu Button**
3. **Edit Menu Button URL**
4. Введите: `https://ваш-домен.ru`

### Шаг 6.4: Первый тест!

1. Откройте Telegram
2. Найдите своего бота (по username)
3. Отправьте `/start`
4. Нажмите кнопку **📱 Открыть приложение**
5. Должно открыться ваше Web App!

**🎉 Если всё работает - ПОЗДРАВЛЯЮ! Приложение развёрнуто!**

---

## 7. Обслуживание

### Управление PM2

```bash
# Статус всех процессов
pm2 status

# Логи приложения
pm2 logs diabetes-app

# Логи только ошибок
pm2 logs diabetes-app --err

# Очистить логи
pm2 flush

# Перезапуск
pm2 restart diabetes-app

# Остановка
pm2 stop diabetes-app

# Удаление
pm2 delete diabetes-app
```

### Обновление приложения

```bash
cd /var/www/diabetes-app

# Если через Git
git pull origin main
npm install --production

# Пересоберите frontend (если были изменения)
cd client
npx vite build
cd ..

# Перезапустите
pm2 restart diabetes-app
```

### Мониторинг сервера

```bash
# Использование ресурсов
pm2 monit

# Использование диска
df -h

# Использование памяти
free -h

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Резервное копирование базы данных

```bash
# Создайте скрипт бэкапа
nano /var/www/diabetes-app/backup.sh
```

Вставьте:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
cp /var/www/diabetes-app/database.db /var/www/diabetes-app/backups/database_$DATE.db
# Удалить бэкапы старше 30 дней
find /var/www/diabetes-app/backups/ -name "*.db" -mtime +30 -delete
```

Сделайте исполняемым:
```bash
chmod +x /var/www/diabetes-app/backup.sh
mkdir -p /var/www/diabetes-app/backups
```

Добавьте в cron (ежедневно в 03:00):
```bash
crontab -e
```
Добавьте строку:
```
0 3 * * * /var/www/diabetes-app/backup.sh
```

### Безопасность

```bash
# Настройте firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Проверьте статус
sudo ufw status

# Обновляйте систему регулярно
sudo apt update && sudo apt upgrade -y
```

---

## 🎯 Чек-лист развертывания

- [ ] Создан Telegram бот, получен токен
- [ ] Настроены команды бота (/start, /help, etc.)
- [ ] Создана ВМ в Yandex Cloud
- [ ] Установлены Node.js, PM2, Nginx, Certbot
- [ ] Проект загружен на сервер
- [ ] Установлены npm зависимости
- [ ] Создан .env с токеном бота
- [ ] Собран frontend (vite build)
- [ ] Настроен Nginx
- [ ] Куплен и настроен домен
- [ ] Установлен SSL сертификат
- [ ] Запущено приложение через PM2
- [ ] Обновлён WEB_APP_URL в .env
- [ ] Настроена кнопка Menu в Telegram
- [ ] Протестирован запуск через /start
- [ ] Настроено автообновление SSL
- [ ] Настроен бэкап базы данных

---

## 💰 Стоимость

**При использовании гранта 4000₽:**

- ВМ (2 vCPU, 2GB RAM): ~500₽/мес
- Диск 10GB HDD: ~80₽/мес
- Публичный IP: ~250₽/мес
- **Итого:** ~830₽/мес

**Грант покроет ~4.8 месяцев работы!**

После окончания гранта можно:
- Уменьшить конфигурацию (1 vCPU, 1GB RAM) - ~300₽/мес
- Использовать прерываемую ВМ (дешевле на 50-70%)
- Перенести на shared хостинг

---

## 📚 Полезные ссылки

- [Документация Yandex Cloud](https://cloud.yandex.ru/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration](https://nginx.org/ru/docs/)
- [Certbot](https://certbot.eff.org/)

---

## 🆘 Помощь и поддержка

**Проблемы с развертыванием?**

1. Проверьте логи PM2: `pm2 logs diabetes-app`
2. Проверьте логи Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Проверьте, запущен ли процесс: `pm2 status`
4. Проверьте порт: `sudo netstat -tlnp | grep 3000`

**Telegram бот не отвечает?**

1. Проверьте токен в .env
2. Проверьте WEB_APP_URL в .env
3. Перезапустите приложение: `pm2 restart diabetes-app`
4. Проверьте логи бота: `pm2 logs diabetes-app | grep "Telegram"`

---

**Готово! Ваше приложение работает в облаке! 🚀☁️**

Пользователи могут открыть бота в Telegram, нажать /start и начать пользоваться!
