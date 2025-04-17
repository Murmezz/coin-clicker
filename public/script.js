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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Глобальные переменные
let USER_ID = '';
let currentUsername = '';
let coins = 0;
let highscore = 0;
let transferHistory = [];

// Элементы интерфейса
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');
const coinElement = document.querySelector('.coin-button');
const pagesContainer = document.getElementById('pages-container');

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
  localStorage.setItem('user_id', USER_ID);
}

// Загрузка данных пользователя
async function loadUserData() {
  return new Promise((resolve, reject) => {
    db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        coins = data.balance || 100;
        highscore = data.highscore || 0;
        transferHistory = data.transfers || [];
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

// Создание нового пользователя
async function createNewUser() {
  const userData = {
    balance: 100,
    highscore: 0,
    transfers: [],
    username: currentUsername,
    created_at: firebase.database.ServerValue.TIMESTAMP
  };
  await db.ref(`users/${USER_ID}`).set(userData);
  console.log('New user created:', userData);
}

// Сохранение данных
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

// Обновление интерфейса
function updateDisplays() {
  coinsDisplay.textContent = coins;
  highscoreDisplay.textContent = highscore;
  console.log('UI updated:', coins, highscore);
}

// Инициализация обработчиков событий
function initEventListeners() {
  // Клик по монете
  coinElement.addEventListener('click', () => {
    coins++;
    if (coins > highscore) highscore = coins;
    updateDisplays();
    saveUserData();
    console.log('Coin clicked! Balance:', coins);
  });

  // Навигация
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', handleNavButtonClick);
  });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
  initTelegramUser();
  await loadUserData();
  initEventListeners();
  console.log('Initialization complete');
});

// ========================
// ОСНОВНЫЕ ФУНКЦИИ ИГРЫ
// ========================

function updateDisplays() {
  coinsDisplay.textContent = coins;
  highscoreDisplay.textContent = highscore;
}

function initEventListeners() {
  // Клик по монете
  coinContainer.addEventListener('mousedown', handleCoinPress);
  coinContainer.addEventListener('touchstart', handleTouchStart);
  coinContainer.addEventListener('mouseup', handleCoinRelease);
  coinContainer.addEventListener('touchend', handleTouchEnd);

  // Навигация
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', function() {
      const pageName = this.getAttribute('data-page');
      if (pageName === 'transfer') showTransferPage();
      else showDefaultPage(this.textContent);
    });
  });
}

function handleCoinPress(e) {
  e.preventDefault();
  const clientX = e.clientX || e.touches[0].clientX;
  const clientY = e.clientY || e.touches[0].clientY;

  const rect = coinContainer.getBoundingClientRect();
  const clickX = clientX - rect.left;
  const clickY = clientY - rect.top;

  const coinButton = coinContainer.querySelector('.coin-button');
  const tiltAngle = 12;
  const relX = (rect.width/2 - clickX) / (rect.width/2);
  const relY = (rect.height/2 - clickY) / (rect.height/2);

  coinButton.style.transform = `
    perspective(500px) 
    rotateX(${relY * tiltAngle}deg) 
    rotateY(${-relX * tiltAngle}deg) 
    scale(0.95)
  `;
}

function handleCoinRelease(e) {
  const clientX = e.clientX || e.changedTouches[0].clientX;
  const clientY = e.clientY || e.changedTouches[0].clientY;

  const coinButton = coinContainer.querySelector('.coin-button');
  coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';

  coins++;
  if (coins > highscore) {
    highscore = coins;
  }

  updateDisplays();
  createFloatingNumber(clientX, clientY);
  saveUserData();
}

function handleTouchStart(e) {
  e.preventDefault();
  handleCoinPress(e.touches[0]);
}

function handleTouchEnd(e) {
  e.preventDefault();
  handleCoinRelease(e.changedTouches[0]);
}

function createFloatingNumber(startX, startY) {
  const numberElement = document.createElement('div');
  numberElement.className = 'floating-number';
  numberElement.textContent = '+1';

  const balanceRect = document.querySelector('.balance').getBoundingClientRect();
  const targetX = balanceRect.left + balanceRect.width/2 - startX;
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

// ========================
// СИСТЕМА ПЕРЕВОДОВ
// ========================

function showTransferPage() {
  pagesContainer.innerHTML = '';
  pagesContainer.appendChild(transferPage.cloneNode(true));
  pagesContainer.style.display = 'block';

  initTransferForm();
  document.querySelector('.back-button').addEventListener('click', hidePages);
}

function initTransferForm() {
  const usernameInput = document.getElementById('username');
  const amountInput = document.getElementById('amount');
  const sendButton = document.getElementById('send-coins');
  const messageDiv = document.getElementById('transfer-message');

  sendButton.addEventListener('click', async function() {
    const recipient = usernameInput.value.trim();
    const amount = parseInt(amountInput.value);

    // Валидация
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
      showMessage('Отправка...', 'info', messageDiv);
      sendButton.disabled = true;

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
}

function renderTransferHistory() {
  historyList.innerHTML = '';

  if (transferHistory.length === 0) {
    historyList.innerHTML = '<p>Нет истории переводов</p>';
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

    historyList.appendChild(item);
  });
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

// ========================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================

function showDefaultPage(title) {
  const newPage = defaultPage.cloneNode(true);
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
  element.textContent = text;
  element.className = `transfer-message ${type}-message`;
}
