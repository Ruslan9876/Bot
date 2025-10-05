// Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// API URL
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Глобальные переменные
let currentUser = null;
let userId = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Приложение запускается...');
  
  // Получаем данные пользователя Telegram
  const telegramUser = tg.initDataUnsafe?.user;
  
  if (telegramUser) {
    console.log('Telegram пользователь:', telegramUser);
    
    // Автоматически заполняем телефон если доступен
    if (telegramUser.phone_number) {
      document.getElementById('phone').value = telegramUser.phone_number;
    }
    
    // Проверяем регистрацию
    await checkUserRegistration(telegramUser.id);
  } else {
    console.warn('Telegram данные недоступны. Используем тестовый режим.');
    // Для тестирования вне Telegram
    await checkUserRegistration(123456789);
  }
});

// Проверка регистрации пользователя
async function checkUserRegistration(telegramId) {
  try {
    const response = await fetch(`${API_URL}/users/${telegramId}`);
    
    if (response.ok) {
      currentUser = await response.json();
      userId = currentUser.id;
      document.getElementById('user-name').textContent = currentUser.full_name;
      showScreen('home');
    } else {
      showScreen('registration');
    }
  } catch (error) {
    console.error('Ошибка проверки регистрации:', error);
    showScreen('registration');
  }
}

// Показать экран
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  document.getElementById(screenId).classList.add('active');
  
  // Специальные действия при открытии экранов
  if (screenId === 'doctor') {
    loadDoctorMessages();
  } else if (screenId === 'pressure') {
    loadRecentPressure();
    setupPressurePreview();
  } else if (screenId === 'pulse') {
    loadRecentPulse();
    setupPulseIndicator();
  } else if (screenId === 'weight') {
    loadRecentWeight();
  }
  
  // Автозаполнение текущей даты и времени
  autoFillDateTime(screenId);
}

// Автозаполнение даты и времени
function autoFillDateTime(screenId) {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5);
  const datetime = now.toISOString().slice(0, 16);
  
  const dateInputs = document.querySelectorAll(`#${screenId} input[type="date"]`);
  const timeInputs = document.querySelectorAll(`#${screenId} input[type="time"]`);
  const datetimeInputs = document.querySelectorAll(`#${screenId} input[type="datetime-local"]`);
  
  dateInputs.forEach(input => {
    if (!input.value) input.value = date;
  });
  
  timeInputs.forEach(input => {
    if (!input.value) input.value = time;
  });
  
  datetimeInputs.forEach(input => {
    if (!input.value) input.value = datetime;
  });
}

// Показать уведомление
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Регистрация пользователя
document.getElementById('registration-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const telegramUser = tg.initDataUnsafe?.user || { id: 123456789 };
  
  const formData = {
    telegram_id: telegramUser.id,
    full_name: document.getElementById('full_name').value,
    location: document.getElementById('location').value,
    has_diabetes: parseInt(document.getElementById('has_diabetes').value),
    age: parseInt(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    phone: document.getElementById('phone').value
  };
  
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      userId = data.user_id;
      currentUser = formData;
      currentUser.id = userId;
      document.getElementById('user-name').textContent = formData.full_name;
      showToast('Регистрация успешна!', 'success');
      showScreen('home');
    } else {
      showToast(data.error || 'Ошибка регистрации', 'error');
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    showToast('Ошибка соединения с сервером', 'error');
  }
});

// Форма записи глюкозы
document.getElementById('glucose-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    date: document.getElementById('glucose_date').value,
    time: document.getElementById('glucose_time').value,
    glucose_level: parseFloat(document.getElementById('glucose_level').value)
  };
  
  await saveRecord('/records/glucose', formData, 'glucose-form');
});

// Форма записи приема пищи
document.getElementById('meal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    date: document.getElementById('meal_date').value,
    meal_time: document.getElementById('meal_time').value,
    dish_name: document.getElementById('dish_name').value,
    carbs: parseFloat(document.getElementById('carbs').value) || null
  };
  
  await saveRecord('/records/meal', formData, 'meal-form');
});

// Форма записи лекарств
document.getElementById('medication-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    medication_name: document.getElementById('medication_name').value,
    dose: document.getElementById('dose').value,
    administration_time: document.getElementById('administration_time').value
  };
  
  await saveRecord('/records/medication', formData, 'medication-form');
});

// Форма физической активности
document.getElementById('activity-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    date: document.getElementById('activity_date').value,
    activity_type: document.getElementById('activity_type').value,
    duration: parseInt(document.getElementById('duration').value),
    intensity: document.getElementById('intensity').value
  };
  
  await saveRecord('/records/activity', formData, 'activity-form');
});

// Форма самочувствия
document.getElementById('health-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    date: document.getElementById('health_date').value,
    time: document.getElementById('health_time').value,
    general_state: document.getElementById('general_state').value,
    symptoms: document.getElementById('symptoms').value,
    blood_pressure: document.getElementById('blood_pressure').value,
    pulse: parseInt(document.getElementById('pulse').value) || null,
    weight: parseFloat(document.getElementById('weight').value) || null,
    special_circumstances: document.getElementById('special_circumstances').value
  };
  
  await saveRecord('/records/health', formData, 'health-form');
});

// Форма давления
document.getElementById('pressure-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const systolic = document.getElementById('systolic').value;
  const diastolic = document.getElementById('diastolic').value;
  
  const formData = {
    user_id: userId,
    date: document.getElementById('pressure_date').value,
    time: document.getElementById('pressure_time').value,
    blood_pressure: `${systolic}/${diastolic}`
  };
  
  await saveRecord('/records/pressure', formData, 'pressure-form');
  loadRecentPressure();
});

// Форма пульса
document.getElementById('pulse-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    date: document.getElementById('pulse_date').value,
    time: document.getElementById('pulse_time').value,
    pulse: parseInt(document.getElementById('pulse_value').value)
  };
  
  await saveRecord('/records/pulse', formData, 'pulse-form');
  loadRecentPulse();
});

// Форма веса
document.getElementById('weight-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    user_id: userId,
    date: document.getElementById('weight_date').value,
    weight: parseFloat(document.getElementById('weight_value').value)
  };
  
  await saveRecord('/records/weight', formData, 'weight-form');
  loadRecentWeight();
});

// Универсальная функция сохранения записи
async function saveRecord(endpoint, data, formId) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('Запись сохранена!', 'success');
      document.getElementById(formId).reset();
      setTimeout(() => showScreen('home'), 1500);
    } else {
      showToast(result.error || 'Ошибка сохранения', 'error');
    }
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showToast('Ошибка соединения с сервером', 'error');
  }
}

// Форма сообщения врачу
document.getElementById('doctor-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const message = document.getElementById('doctor_message').value;
  
  try {
    const response = await fetch(`${API_URL}/doctor/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, message })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showToast('Сообщение отправлено врачу!', 'success');
      document.getElementById('doctor_message').value = '';
      loadDoctorMessages();
    } else {
      showToast(result.error || 'Ошибка отправки', 'error');
    }
  } catch (error) {
    console.error('Ошибка отправки:', error);
    showToast('Ошибка соединения с сервером', 'error');
  }
});

// Загрузка сообщений врачу
async function loadDoctorMessages() {
  try {
    const response = await fetch(`${API_URL}/doctor/messages/${userId}`);
    const messages = await response.json();
    
    const messagesList = document.getElementById('messages-list');
    
    if (messages.length === 0) {
      messagesList.innerHTML = '<p class="text-muted">Сообщений пока нет</p>';
      return;
    }
    
    messagesList.innerHTML = messages.map(msg => `
      <div class="message-item ${msg.is_read ? 'read' : ''}">
        <div class="message-date">${new Date(msg.sent_at).toLocaleString('ru-RU')}</div>
        <div class="message-text">${msg.message}</div>
        ${msg.is_read ? '<div class="message-status">✓ Прочитано</div>' : '<div class="message-status">Отправлено</div>'}
      </div>
    `).join('');
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);
  }
}

// Загрузка истории
async function loadHistory() {
  const startDate = document.getElementById('history_start').value;
  const endDate = document.getElementById('history_end').value;
  
  if (!startDate || !endDate) {
    showToast('Выберите период', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/records/${userId}?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();
    
    const historyContent = document.getElementById('history-content');
    
    let html = '';
    
    // Глюкоза
    if (data.glucose && data.glucose.length > 0) {
      html += `
        <div class="history-section">
          <h3>🩸 Уровень глюкозы</h3>
          <table class="history-table">
            <tr><th>Дата</th><th>Время</th><th>Уровень</th></tr>
            ${data.glucose.map(r => `
              <tr><td>${r.date}</td><td>${r.time}</td><td>${r.glucose_level} ммоль/л</td></tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    // Прием пищи
    if (data.meals && data.meals.length > 0) {
      html += `
        <div class="history-section">
          <h3>🍽️ Прием пищи</h3>
          <table class="history-table">
            <tr><th>Дата</th><th>Время</th><th>Блюдо</th><th>Углеводы</th></tr>
            ${data.meals.map(r => `
              <tr><td>${r.date}</td><td>${r.meal_time}</td><td>${r.dish_name}</td><td>${r.carbs || '-'} г</td></tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    // Лекарства
    if (data.medications && data.medications.length > 0) {
      html += `
        <div class="history-section">
          <h3>💊 Лекарства</h3>
          <table class="history-table">
            <tr><th>Название</th><th>Доза</th><th>Время</th></tr>
            ${data.medications.map(r => `
              <tr><td>${r.medication_name}</td><td>${r.dose}</td><td>${new Date(r.administration_time).toLocaleString('ru-RU')}</td></tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    // Давление
    if (data.pressure && data.pressure.length > 0) {
      html += `
        <div class="history-section">
          <h3>🩺 Артериальное давление</h3>
          <table class="history-table">
            <tr><th>Дата</th><th>Время</th><th>АД</th></tr>
            ${data.pressure.map(r => `
              <tr><td>${r.date}</td><td>${r.time}</td><td>${r.blood_pressure} мм рт. ст.</td></tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    // Пульс
    if (data.pulse && data.pulse.length > 0) {
      html += `
        <div class="history-section">
          <h3>💓 Пульс</h3>
          <table class="history-table">
            <tr><th>Дата</th><th>Время</th><th>Пульс</th></tr>
            ${data.pulse.map(r => `
              <tr><td>${r.date}</td><td>${r.time}</td><td>${r.pulse} уд/мин</td></tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    // Вес
    if (data.weight && data.weight.length > 0) {
      html += `
        <div class="history-section">
          <h3>⚖️ Вес</h3>
          <table class="history-table">
            <tr><th>Дата</th><th>Вес</th></tr>
            ${data.weight.map(r => `
              <tr><td>${r.date}</td><td>${r.weight} кг</td></tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    if (html === '') {
      html = '<p class="text-muted">За выбранный период записей не найдено</p>';
    }
    
    historyContent.innerHTML = html;
  } catch (error) {
    console.error('Ошибка загрузки истории:', error);
    showToast('Ошибка загрузки данных', 'error');
  }
}

// Построение графика
let glucoseChart = null;

async function loadChart() {
  const days = document.getElementById('chart_days').value;
  
  try {
    const response = await fetch(`${API_URL}/export/chart/${userId}?days=${days}`);
    const data = await response.json();
    
    const ctx = document.getElementById('glucoseChart').getContext('2d');
    
    if (glucoseChart) {
      glucoseChart.destroy();
    }
    
    glucoseChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Средний уровень глюкозы',
            data: data.datasets[0].data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Минимум',
            data: data.datasets[1].data,
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Максимум',
            data: data.datasets[2].data,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Динамика уровня глюкозы'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Уровень глюкозы (ммоль/л)'
            }
          }
        }
      }
    });
    
    showToast('График построен', 'success');
  } catch (error) {
    console.error('Ошибка построения графика:', error);
    showToast('Ошибка загрузки данных', 'error');
  }
}

// Экспорт в Excel
function exportToExcel() {
  const startDate = document.getElementById('export_start').value;
  const endDate = document.getElementById('export_end').value;
  
  let url = `${API_URL}/export/excel/${userId}`;
  
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  
  window.open(url, '_blank');
  showToast('Скачивание начато...', 'success');
}

// Предпросмотр давления
function setupPressurePreview() {
  const systolicInput = document.getElementById('systolic');
  const diastolicInput = document.getElementById('diastolic');
  const display = document.getElementById('pressure-display');
  
  function updateDisplay() {
    const sys = systolicInput.value || '--';
    const dia = diastolicInput.value || '--';
    display.textContent = `${sys}/${dia}`;
  }
  
  systolicInput.addEventListener('input', updateDisplay);
  diastolicInput.addEventListener('input', updateDisplay);
}

// Индикатор пульса
function setupPulseIndicator() {
  const pulseInput = document.getElementById('pulse_value');
  const statusDiv = document.getElementById('pulse-status');
  
  pulseInput.addEventListener('input', () => {
    const value = parseInt(pulseInput.value);
    
    if (!value) {
      statusDiv.className = 'pulse-status';
      statusDiv.innerHTML = '<p class="text-muted">Введите значение</p>';
      return;
    }
    
    let status = '';
    let className = 'pulse-status ';
    
    if (value < 60) {
      status = '⚠️ Низкий пульс (брадикардия)';
      className += 'low';
    } else if (value >= 60 && value <= 100) {
      status = '✅ Нормальный пульс';
      className += 'normal';
    } else if (value > 100 && value <= 120) {
      status = '⚠️ Повышенный пульс (тахикардия)';
      className += 'high';
    } else {
      status = '🚨 Критически высокий пульс';
      className += 'critical';
    }
    
    statusDiv.className = className;
    statusDiv.innerHTML = `<p>${status}</p>`;
  });
}

// Загрузка последних записей давления
async function loadRecentPressure() {
  try {
    const response = await fetch(`${API_URL}/records/pressure/${userId}?limit=5`);
    const data = await response.json();
    
    const container = document.getElementById('pressure-recent');
    
    if (!data || data.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = `
      <h3>📋 Последние записи</h3>
      ${data.map(r => `
        <div class="record-item">
          <div>
            <div class="record-date">${r.date} ${r.time}</div>
          </div>
          <div class="record-value">${r.blood_pressure} мм рт. ст.</div>
        </div>
      `).join('')}
    `;
  } catch (error) {
    console.error('Ошибка загрузки записей давления:', error);
  }
}

// Загрузка последних записей пульса
async function loadRecentPulse() {
  try {
    const response = await fetch(`${API_URL}/records/pulse/${userId}?limit=5`);
    const data = await response.json();
    
    const container = document.getElementById('pulse-recent');
    
    if (!data || data.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = `
      <h3>📋 Последние записи</h3>
      ${data.map(r => `
        <div class="record-item">
          <div>
            <div class="record-date">${r.date} ${r.time}</div>
          </div>
          <div class="record-value">${r.pulse} уд/мин</div>
        </div>
      `).join('')}
    `;
  } catch (error) {
    console.error('Ошибка загрузки записей пульса:', error);
  }
}

// Загрузка последних записей веса
async function loadRecentWeight() {
  try {
    const response = await fetch(`${API_URL}/records/weight/${userId}?limit=10`);
    const data = await response.json();
    
    const container = document.getElementById('weight-recent');
    const changeDisplay = document.getElementById('weight-change');
    
    if (!data || data.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    // Показать динамику веса
    if (data.length >= 2) {
      const latest = parseFloat(data[0].weight);
      const previous = parseFloat(data[1].weight);
      const diff = latest - previous;
      const diffText = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
      
      if (diff > 0) {
        changeDisplay.className = 'text-muted positive';
        changeDisplay.textContent = `📈 ${diffText} кг с последнего измерения`;
      } else if (diff < 0) {
        changeDisplay.className = 'text-muted negative';
        changeDisplay.textContent = `📉 ${diffText} кг с последнего измерения`;
      } else {
        changeDisplay.className = 'text-muted';
        changeDisplay.textContent = '➡️ Вес не изменился';
      }
    }
    
    container.innerHTML = `
      <h3>📋 История веса</h3>
      ${data.map(r => `
        <div class="record-item">
          <div>
            <div class="record-date">${r.date}</div>
          </div>
          <div class="record-value">${r.weight} кг</div>
        </div>
      `).join('')}
    `;
  } catch (error) {
    console.error('Ошибка загрузки записей веса:', error);
  }
}

// Функция переключения категорий рекомендаций
function toggleCategory(categoryId) {
  const content = document.getElementById(categoryId);
  const header = content.previousElementSibling;
  
  if (content.classList.contains('expanded')) {
    content.classList.remove('expanded');
    header.classList.remove('active');
  } else {
    content.classList.add('expanded');
    header.classList.add('active');
  }
}

// Настройка цветовой схемы Telegram
tg.ready();
tg.MainButton.hide();

// Применяем цвета темы Telegram
if (tg.themeParams) {
  document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
  document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
  document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
  document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
  document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
}
