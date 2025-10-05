# ⚡ Быстрая шпаргалка по развертыванию

## 📝 Пошаговый чек-лист

### 1️⃣ Telegram Bot (5 минут)

```
1. Открыть @BotFather в Telegram
2. /newbot
3. Имя: Diabetes Assistant
4. Username: diabetes_assistant_bot
5. СОХРАНИТЬ ТОКЕН!
6. /setcommands → вставить команды (см. ниже)
```

**Команды для бота:**
```
start - 🚀 Запустить приложение
help - ❓ Помощь
settings - ⚙️ Настройки
stats - 📊 Статистика
```

---

### 2️⃣ Yandex Cloud (10 минут)

```
1. Зайти на cloud.yandex.ru
2. Создать биллинг-аккаунт
3. Получить грант 4000₽
4. Создать папку "diabetes-app"
5. Compute Cloud → Создать ВМ:
   - Ubuntu 22.04
   - 2 vCPU, 2GB RAM
   - 10GB диск
   - Публичный IP
6. Скопировать IP адрес
```

---

### 3️⃣ Подключение к серверу

```bash
ssh yc-user@ВАШ_IP
```

---

### 4️⃣ Установка софта (10 минут)

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2, Git, Nginx, Certbot
sudo npm install -g pm2
sudo apt install -y git nginx certbot python3-certbot-nginx
```

---

### 5️⃣ Загрузка проекта

**Вариант A: Через Git**
```bash
cd /var/www
sudo git clone https://github.com/ваш-username/diabetes-app.git
sudo chown -R $USER:$USER diabetes-app
cd diabetes-app
npm install --production
```

**Вариант B: Через SCP (с локального ПК)**
```powershell
scp -r c:\Users\Ruslan\Desktop\mvp yc-user@ВАШ_IP:/tmp/
```
Потом на сервере:
```bash
sudo mv /tmp/mvp /var/www/diabetes-app
sudo chown -R $USER:$USER /var/www/diabetes-app
cd /var/www/diabetes-app
npm install --production
```

---

### 6️⃣ Настройка .env

```bash
nano /var/www/diabetes-app/.env
```

Вставить:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
PORT=3000
NODE_ENV=production
DB_PATH=/var/www/diabetes-app/database.db
WEB_APP_URL=https://ваш-домен.ru
```

`Ctrl+O`, `Enter`, `Ctrl+X` для сохранения

---

### 7️⃣ Сборка frontend

```bash
cd /var/www/diabetes-app/client
npx vite build
cd ..
```

---

### 8️⃣ Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/diabetes-app
```

Вставить:
```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    location / {
        root /var/www/diabetes-app/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активировать:
```bash
sudo ln -s /etc/nginx/sites-available/diabetes-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 9️⃣ Настройка домена (у регистратора)

```
A-запись:
Имя: @
Значение: ВАШ_IP_ВМ

A-запись:
Имя: www
Значение: ВАШ_IP_ВМ
```

**Подождать 5-30 минут**

---

### 🔟 SSL сертификат

```bash
sudo certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Ответить на вопросы:
- Email: ваш email
- Agree: Yes
- Redirect HTTP to HTTPS: Yes

---

### 1️⃣1️⃣ Запуск приложения

```bash
cd /var/www/diabetes-app
pm2 start server/index.js --name diabetes-app
pm2 startup
pm2 save
```

Проверка:
```bash
pm2 status
pm2 logs diabetes-app
```

---

### 1️⃣2️⃣ Обновить URL в боте

В @BotFather:
```
/mybots → выбрать бота → Bot Settings → Menu Button
→ Edit Menu Button URL
→ Ввести: https://ваш-домен.ru
```

---

### 1️⃣3️⃣ ТЕСТ! 🎉

1. Открыть Telegram
2. Найти своего бота
3. `/start`
4. Нажать "📱 Открыть приложение"
5. **Работает!**

---

## 🔧 Полезные команды

### PM2
```bash
pm2 status              # статус
pm2 logs diabetes-app   # логи
pm2 restart diabetes-app # перезапуск
pm2 monit               # мониторинг
```

### Обновление приложения
```bash
cd /var/www/diabetes-app
git pull                # если через Git
npm install --production
cd client && npx vite build && cd ..
pm2 restart diabetes-app
```

### Логи
```bash
pm2 logs diabetes-app
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 💰 Стоимость

- **ВМ:** ~500₽/мес
- **Диск:** ~80₽/мес  
- **IP:** ~250₽/мес
- **Итого:** ~830₽/мес

**Грант 4000₽ покроет ~5 месяцев!**

---

## 🆘 Проблемы?

**Бот не отвечает:**
```bash
pm2 logs diabetes-app | grep Telegram
nano .env  # проверить токен
pm2 restart diabetes-app
```

**Сайт не открывается:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo ufw status  # порт 80/443 открыт?
```

**Нет SSL:**
```bash
sudo certbot renew --dry-run
sudo certbot certificates
```

---

## 📄 Полная документация

См. **YANDEX_CLOUD_DEPLOY.md** для подробностей.

---

**Время развертывания: ~1 час**  
**Сложность: Средняя**  
**Стоимость: Бесплатно (с грантом)**

**Удачи! 🚀**
