// Конфигурация Firebase
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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Получение элементов DOM
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');
const coinContainer = document.getElementById('coin');
const pagesContainer = document.getElementById('pages-container');

const tg = window.Telegram.WebApp;
let USER_ID = '';
let currentUsername = '';

let coins = 0;
let highscore = 0;
let transferHistory = [];

// Получение данных из Telegram
function initTelegramUser() {
  if (tg.initDataUnsafe?.user) {
    const tgUser = tg.initDataUnsafe.user;
    USER_ID = `tg_${tgUser.id}`;
    currentUsername = tgUser.username ? `@${tgUser.username}` : `@user_${tgUser.id.slice(0, 5)}`;
  } else {
    USER_ID = 'test_' + Math.random().toString(36).substr(2, 9);
    currentUsername = `@test_${Math.random().toString(36).substr(2, 5)}`;
    console.warn("Не работает в Telegram, используем тестовый режим");
  }
  localStorage.setItem('user_id', USER_ID);
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', async () => {
  initTelegramUser();
  await loadUserData();
  initEventListeners();
  console.log("Инициализация завершена");
});

// ============= Firebase функции =============

async function loadUserData() {
  try {
    const snapshot = await db.ref(`users/${USER_ID}`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      coins = data.balance !== undefined ? data.balance : 100;
      highscore = data.highscore || 0;
      transferHistory = data.transfers || [];
    } else {
      await createNewUser();
    }
    updateDisplays();
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    coins = 100;
    updateDisplays();
  }
}

async function createNewUser() {
  const userData = {
    balance: 100,
    highscore: 0,
    transfers: [],
    username: currentUsername,
    created_at: firebase.database.ServerValue.TIMESTAMP
  };
  await db.ref(`users/${USER_ID}`).set(userData);
  console.log("Создан новый пользователь:", userData);
}

async function saveUserData() {
  try {
    await db.ref(`users/${USER_ID}`).update({
      balance: coins,
      highscore: highscore,
      transfers: transferHistory.slice(0, 50)
    });
    console.log("Данные сохранены");
  } catch (error) {
    console.error("Ошибка сохранения данных:", error);
  }
}

// Обновление отображения
function updateDisplays() {
  if (coinsDisplay) coinsDisplay.textContent = coins;
  if (highscoreDisplay) highscoreDisplay.textContent = highscore;
}

// =================== Обработка событий ===================

function initEventListeners() {
  // Клик по монете
  if (coinContainer) {
    coinContainer.addEventListener('mousedown', handleCoinPress);
    coinContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    coinContainer.addEventListener('mouseup', handleCoinRelease);
    coinContainer.addEventListener('touchend', handleTouchEnd);
    coinContainer.addEventListener('click', handleCoinClick);
  }

  // Навигация
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.addEventListener('click', handleNavButtonClick);
  });
}

function handleCoinPress(e) {
  e.preventDefault();
  const coinButton = document.querySelector('.coin-button');
  if (coinButton) {
    coinButton.style.transform = 'scale(0.95)';
  }
}

function handleCoinRelease(e) {
  e.preventDefault();
  const coinButton = document.querySelector('.coin-button');
  if (coinButton) {
    coinButton.style.transform = 'scale(1)';
  }
}

function handleCoinClick(e) {
  coins++;
  if (coins > highscore) {
    highscore = coins;
  }
  updateDisplays();
  saveUserData();
  createFloatingNumber(e.clientX, e.clientY);
}

function handleTouchStart(e) {
  e.preventDefault();
  handleCoinPress(e.touches[0]);
}

function handleTouchEnd(e) {
  e.preventDefault();
  handleCoinRelease(e.changedTouches[0]);
  handleCoinClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
}

// ========================
// СИСТЕМА НАВИГАЦИИ
// ========================

function handleNavButtonClick() {
  const pageName = this.getAttribute('data-page');
  
  switch(pageName) {
    case 'transfer':
      showTransferPage();
      break;
    case 'shop':
      showDefaultPage('Магазин');
      break;
    case 'games':
      showDefaultPage('Игры');
      break;
    case 'referrals':
      showDefaultPage('Рефералы');
      break;
    case 'top':
      showDefaultPage('Топ игроков');
      break;
    default:
      showDefaultPage(this.textContent);
  }
}

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
        
        transferHistory.unshift({
          type: 'outgoing',
          username: recipient,
          amount: amount,
          date: new Date().toISOString()
        });

        renderTransferHistory();
        saveUserData();
        
        usernameInput.value = '';
        amountInput.value = '';
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

  // Кнопка "назад"
  page.querySelector('.back-button').addEventListener('click', hidePages);
  
  // Показ истории переводов
  renderTransferHistory();
}

function showDefaultPage(title) {
  pagesContainer.innerHTML = '';
  const page = defaultPage.cloneNode(true);
  page.querySelector('.page-title').textContent = title;
  pagesContainer.appendChild(page);
  pagesContainer.style.display = 'block';

  // Кнопка "назад"
  page.querySelector('.back-button').addEventListener('click', hidePages);
}

function hidePages() {
  pagesContainer.style.display = 'none';
}

function showMessage(text, type, element) {
  element.textContent = text;
  element.className = `transfer-message ${type}-message`;
}

function renderTransferHistory() {
  const historyContainer = document.querySelector('#history-list');
  if (!historyContainer) return;

  historyContainer.innerHTML = '';

  if (transferHistory.length === 0) {
    historyContainer.innerHTML = '<p>Нет истории переводов</p>';
    return;
  }

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

function showDefaultPage(title) {
  const newPage = document.querySelector('#default-page').cloneNode(true);
  newPage.querySelector('.page-title').textContent = title;

  pagesContainer.innerHTML = '';
  pagesContainer.appendChild(newPage);
  pagesContainer.style.display = 'block';

  newPage.querySelector('.back-button').addEventListener('click', hidePages);
}

function hidePages() {
  pagesContainer.style.display = 'none';
}

function showMessage(text, type, element) {
  if (!element) return;
  element.textContent = text;
  element.className = `transfer-message ${type}-message`;
}

// Создание всплывающего числа при клике
function createFloatingNumber(startX, startY) {
  const numberElement = document.createElement('div');
  numberElement.className = 'floating-number';
  numberElement.textContent = '+1';

  const balanceRect = document.querySelector('.balance').getBoundingClientRect();
  const targetX = balanceRect.left + balanceRect.width / 2 - startX;
  const targetY = balanceRect.top - startY;

  numberElement.style.left = `${startX}px`;
  numberElement.style.top = `${startY}px`;
  numberElement.style.setProperty('--target-x', `${targetX}px`);
  numberElement.style.setProperty('--target-y', `${targetY}px`);

  document.body.appendChild(numberElement);

  setTimeout(() => {
    numberElement.remove();
  }, 700);
}
