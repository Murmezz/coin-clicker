// Импорт Firebase SDK v9
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Конфигурация Firebase (ваши данные)
const firebaseConfig = {
  apiKey: "AIzaSyBlB5mKpyKi2MVp2ZYqbE3kBc0VdmXr3Ik",
  authDomain: "fastcoin-7db18.firebaseapp.com",
  databaseURL: "https://fastcoin-7db18-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fastcoin-7db18",
  storageBucket: "fastcoin-7db18.appspot.com",
  messagingSenderId: "1024804439259",
  appId: "1:1024804439259:web:351a470a824712c494f8fe"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app); // Теперь это должно работать

// Загрузка данных пользователя
async function loadUserData() {
  return new Promise((resolve, reject) => {
    const userRef = ref(db, `users/${USER_ID}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        coins = data.balance || 0; // Начальный баланс 0
        highscore = data.highscore || 0;

        // Преобразуем transferHistory в массив, если это объект
        if (data.transfers && typeof data.transfers === 'object') {
          transferHistory = Object.values(data.transfers);
        } else {
          transferHistory = [];
        }

        console.log('User data loaded:', data);
      } else {
        createNewUser();
      }
      updateDisplays();
      resolve();
    }, (error) => {
      console.error('Error loading data:', error);
      reject(error);
    });
  });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
  await authenticateUser(); // Аутентифицируем пользователя
  initTelegramUser();
  await loadUserData();
  initEventListeners();
  console.log('Initialization complete');
});


// Глобальные переменные
let USER_ID = '';
let currentUsername = '';
let coins = 0;
let highscore = 0;
let transferHistory = [];

// Элементы интерфейса
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');
const coinContainer = document.getElementById('coin');
const coinElement = document.querySelector('.coin-button');
const pagesContainer = document.getElementById('pages-container');

// Сохранение страниц для повторного использования
const transferPage = document.getElementById('transfer-page');
const defaultPage = document.getElementById('default-page');

// Сохранение данных пользователя
async function saveUserData() {
  try {
    await db.ref(`users/${USER_ID}`).update({
      balance: coins,
      highscore: highscore,
      transfers: transferHistory
    });
    console.log('Data saved');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Инициализация пользователя
function initTelegramUser() {
  if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe?.user) {
    const tgUser = Telegram.WebApp.initDataUnsafe.user;
    USER_ID = `tg_${tgUser.id}`;
    currentUsername = tgUser.username ? `@${tgUser.username}` : `@user${tgUser.id.slice(-4)}`;
    console.log('Telegram user detected:', USER_ID, currentUsername);
  } else {
    // Режим тестирования вне Telegram
    USER_ID = `dev_${Math.random().toString(36).substr(2, 9)}`;
    currentUsername = `@dev_${Math.random().toString(36).substr(2, 5)}`;
    console.log('Test user created:', USER_ID, currentUsername);
  }
}

// Загрузка данных пользователя
async function loadUserData() {
  return new Promise((resolve, reject) => {
    db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.val();
        coins = data.balance || 0; // Начальный баланс 0
        highscore = data.highscore || 0;

        // Преобразуем transferHistory в массив, если это объект
        if (data.transfers && typeof data.transfers === 'object') {
          transferHistory = Object.values(data.transfers);
        } else {
          transferHistory = [];
        }

        console.log('User data loaded:', data);
      } else {
        createNewUser();
      }
      updateDisplays();
      resolve();
    }, (error) => {
      console.error('Error loading data:', error);
      reject(error);
    });
  });
}
;

// Создание нового пользователя
async function createNewUser() {
  const userData = {
    balance: 0, // Начальный баланс 0
    highscore: 0,
    transfers: [],
    username: currentUsername,
    created_at: firebase.database.ServerValue.TIMESTAMP
  };
  await db.ref(`users/${USER_ID}`).set(userData);
  console.log('New user created:', userData);
}

// Обновление интерфейса
function updateDisplays() {
  coinsDisplay.textContent = coins;
  highscoreDisplay.textContent = highscore;
}

// Инициализация обработчиков событий
function initEventListeners() {
  // Клик по монете
  if (coinElement) {
    coinElement.addEventListener('click', () => {
      coins++;
      if (coins > highscore) highscore = coins;
      updateDisplays();
      saveUserData();
      console.log('Coin clicked! Balance:', coins);
    });
  } else {
    console.error('Coin button not found');
  }

  // Навигация
  const navButtons = document.querySelectorAll('.nav-button');
  if (navButtons) {
    navButtons.forEach(button => {
      button.addEventListener('click', () => handleNavButtonClick(button));
    });
  } else {
    console.error('Navigation buttons not found');
  }
}

// Обработка нажатия на кнопки навигации
function handleNavButtonClick(button) {
  const pageName = button.getAttribute('data-page');
  switch (pageName) {
    case 'top':
      showDefaultPage('Топ игроков');
      break;
    case 'shop':
      showDefaultPage('Магазин');
      break;
    case 'games':
      showDefaultPage('Игры');
      break;
    case 'transfer':
      showTransferPage();
      break;
    case 'referrals':
      showDefaultPage('Рефералы');
      break;
    default:
      showDefaultPage(button.textContent);
  }
}

// Показать стандартную страницу
function showDefaultPage(title) {
  pagesContainer.innerHTML = '';
  const page = defaultPage.cloneNode(true);
  page.querySelector('.page-title').textContent = title;
  pagesContainer.appendChild(page);
  pagesContainer.style.display = 'block';

  // Кнопка "Назад"
  page.querySelector('.back-button').addEventListener('click', hidePages);
}

// Показать страницу перевода
function showTransferPage() {
  pagesContainer.innerHTML = '';
  const page = transferPage.cloneNode(true);
  pagesContainer.appendChild(page);
  pagesContainer.style.display = 'block';

  // Инициализация формы перевода
  const sendButton = page.querySelector('#send-coins');
  const usernameInput = page.querySelector('#username');
  const amountInput = page.querySelector('#amount');
  const messageDiv = page.querySelector('#transfer-message');
  const historyList = page.querySelector('#history-list');

  sendButton.addEventListener('click', async () => {
    const recipient = usernameInput.value.trim();
    const amount = parseInt(amountInput.value);

    if (!recipient || !recipient.startsWith('@')) {
      showMessage('Введите корректный @username', 'error', messageDiv);
      return;
    }

    if (isNaN(amount) || amount < 1) {
      showMessage('Введите сумму больше 0', 'error', messageDiv);
      return;
    }

    if (amount > coins) {
      showMessage('Недостаточно коинов', 'error', messageDiv);
      return;
    }

    try {
      sendButton.disabled = true;
      showMessage('Отправка...', 'info', messageDiv);

      const response = await transferCoins(recipient, amount);

      if (response.success) {
        coins -= amount;
        updateDisplays();
        showMessage(`Успешно отправлено ${amount} коинов`, 'success', messageDiv);
        renderTransferHistory(historyList); // Обновляем историю переводов
      } else {
        showMessage(response.message || 'Ошибка перевода', 'error', messageDiv);
      }
    } catch (error) {
      showMessage('Ошибка сети', 'error', messageDiv);
      console.error('Transfer error:', error);
    } finally {
      sendButton.disabled = false;
    }
  });

  // Кнопка "Назад"
  page.querySelector('.back-button').addEventListener('click', hidePages);

  // Показ истории переводов
  renderTransferHistory(historyList);
}

// Перевод коинов другому пользователю
async function transferCoins(recipientUsername, amount) {
  try {
    // Поиск получателя по username
    const recipientSnapshot = await db.ref('users').orderByChild('username').equalTo(recipientUsername).once('value');

    if (!recipientSnapshot.exists()) {
      return { success: false, message: 'Пользователь не найден' };
    }

    // Получаем данные получателя
    const recipientData = recipientSnapshot.val();
    const recipientId = Object.keys(recipientData)[0]; // ID получателя
    const recipientBalance = recipientData[recipientId].balance || 0;

    // Обновляем баланс получателя
    await db.ref(`users/${recipientId}`).update({
      balance: recipientBalance + amount
    });

    // Обновляем баланс отправителя
    await db.ref(`users/${USER_ID}`).update({
      balance: coins - amount
    });

    // Добавляем запись в историю переводов
    const transferRecord = {
      type: 'outgoing',
      username: recipientUsername,
      amount: amount,
      date: new Date().toISOString()
    };

    // Убедимся, что transferHistory — это массив
    if (!Array.isArray(transferHistory)) {
      transferHistory = [];
    }

    await db.ref(`users/${USER_ID}/transfers`).push(transferRecord);

    return { success: true };
  } catch (error) {
    console.error('Transfer error:', error);
    return { success: false, message: 'Ошибка сети' };
  }
}


// Скрыть все страницы
function hidePages() {
  pagesContainer.style.display = 'none';
}

// Показ сообщения
function showMessage(text, type, element) {
  element.textContent = text;
  element.className = `transfer-message ${type}-message`;
}

// Рендер истории переводов
function renderTransferHistory(historyContainer) {
  if (!historyContainer) return;

  historyContainer.innerHTML = '';

  // Проверяем, что transferHistory — это массив
  if (!Array.isArray(transferHistory) || transferHistory.length === 0) {
    historyContainer.innerHTML = '<p>Нет истории переводов</p>';
    return;
  }

  // Ограничиваем количество записей до 10
  transferHistory.slice(0, 10).forEach(transfer => {
    const item = document.createElement('div');
    item.className = `history-item ${transfer.type}`;

    const amountPrefix = transfer.type === 'outgoing' ? '-' : '+';
    const amountClass = transfer.type === 'outgoing' ? 'history-amount outgoing' : 'history-amount incoming';

    item.innerHTML = `
      <div>
        <span class="history-username">${transfer.username}</span>
        <span class="history-date">${formatDate(transfer.date)}</span>
      </div>
      <span class="${amountClass}">${amountPrefix}${transfer.amount}</span>
    `;

    historyContainer.appendChild(item);
  });
}


// Форматирование даты
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
  initTelegramUser();
  await loadUserData();
  initEventListeners();
  console.log('Initialization complete');
});
