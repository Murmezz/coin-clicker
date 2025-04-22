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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Глобальные переменные
let USER_ID = '';
let currentUsername = '';
let coins = 0;
let highscore = 0;
let transferHistory = [];
let currentPage = null;

// Элементы интерфейса
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');
const coinElement = document.querySelector('.coin-button');
const pagesContainer = document.getElementById('pages-container');

// Инициализация пользователя
async function initTelegramUser() {
  try {
    // Анонимная аутентификация
    await auth.signInAnonymously();
    const user = auth.currentUser;
    
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = Telegram.WebApp.initDataUnsafe.user;
      USER_ID = `tg_${tgUser.id}`;
      currentUsername = tgUser.username ? `@${tgUser.username}` : `@user${tgUser.id.slice(-4)}`;
    } else {
      USER_ID = `anon_${user.uid.slice(-6)}`;
      currentUsername = `@anon_${Math.random().toString(36).substr(2, 5)}`;
    }
    console.log('User initialized:', USER_ID);
  } catch (error) {
    console.error('Auth error:', error);
    USER_ID = `dev_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Загрузка данных пользователя
async function loadUserData() {
  return new Promise((resolve) => {
    db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        coins = data.balance || 0;
        highscore = data.highscore || 0;
        transferHistory = data.transfers || [];
      } else {
        createNewUser();
      }
      updateDisplays();
      resolve();
    });
  });
}

// Создание нового пользователя
function createNewUser() {
  db.ref(`users/${USER_ID}`).set({
    balance: 0,
    highscore: 0,
    transfers: []
  });
}

// Сохранение данных
async function saveUserData() {
  try {
    await db.ref(`users/${USER_ID}`).update({
      balance: coins,
      highscore: highscore,
      transfers: transferHistory
    });
  } catch (error) {
    console.error('Save error:', error);
  }
}

// Перевод монет
async function transferCoins(recipient, amount) {
  const transaction = {
    date: new Date().toISOString(),
    username: recipient,
    amount: amount,
    type: 'outgoing'
  };
  transferHistory.unshift(transaction);
  await saveUserData();
  return { success: true };
}

// Обновление интерфейса
function updateDisplays() {
  coinsDisplay.textContent = coins;
  highscoreDisplay.textContent = highscore;
}

// Показать страницу
function showPage(pageElement, title = '') {
  pagesContainer.innerHTML = '';
  const page = pageElement.cloneNode(true);
  pagesContainer.appendChild(page);
  pagesContainer.style.display = 'block';
  
  if (title) {
    page.querySelector('.page-title').textContent = title;
  }
  
  // Обработчик кнопки "Назад"
  page.querySelector('.back-button').addEventListener('click', hidePages);
  
  currentPage = page;
  return page;
}

// Скрыть страницы
function hidePages() {
  pagesContainer.style.display = 'none';
  currentPage = null;
}

// Показать страницу перевода
function showTransferPage() {
  const page = showPage(document.getElementById('transfer-page'), 'Перевод');
  
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
        renderTransferHistory(historyList);
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

  renderTransferHistory(historyList);
}

// Показать сообщение
function showMessage(text, type, container) {
  container.textContent = text;
  container.className = `transfer-message ${type}-message`;
}

// Показать дефолтную страницу
function showDefaultPage(title) {
  const page = showPage(document.getElementById('default-page'), title);
  page.querySelector('.page-content').textContent = `Страница "${title}" в разработке`;
}

// Рендер истории переводов
function renderTransferHistory(container) {
  if (!container) return;

  container.innerHTML = '';

  if (transferHistory.length === 0) {
    container.innerHTML = '<p>Нет истории переводов</p>';
    return;
  }

  transferHistory.slice(0, 10).forEach(transfer => {
    const item = document.createElement('div');
    item.className = `history-item ${transfer.type}`;
    item.innerHTML = `
      <div>
        <span class="history-username">${transfer.username}</span>
        <span class="history-date">${new Date(transfer.date).toLocaleString()}</span>
      </div>
      <span class="history-amount ${transfer.type}">${transfer.type === 'outgoing' ? '-' : '+'}${transfer.amount}</span>
    `;
    container.appendChild(item);
  });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  await initTelegramUser();
  await loadUserData();

  // Клик по монете
  coinElement.addEventListener('click', () => {
    coins++;
    if (coins > highscore) highscore = coins;
    updateDisplays();
    saveUserData();
  });

  // Навигация
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;
      if (page === 'transfer') {
        showTransferPage();
      } else {
        showDefaultPage(button.textContent);
      }
    });
  });
});
