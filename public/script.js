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

// Инициализация Firebase с аутентификацией
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth(); // Добавляем аутентификацию

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

// Сохранение страниц
const transferPage = document.getElementById('transfer-page');
const defaultPage = document.getElementById('default-page');

// Инициализация пользователя + аутентификация
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
      USER_ID = `anon_${user.uid.slice(-6)}`; // Используем UID из Firebase Auth
      currentUsername = `@anon_${Math.random().toString(36).substr(2, 5)}`;
    }
    console.log('User initialized:', USER_ID);
  } catch (error) {
    console.error('Auth error:', error);
    USER_ID = `dev_${Math.random().toString(36).substr(2, 9)}`; // Fallback
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

// Показ страницы
function showTransferPage() {
  pagesContainer.innerHTML = '';
  const page = transferPage.cloneNode(true);
  pagesContainer.appendChild(page);
  pagesContainer.style.display = 'block';

  // Кнопка "Назад" — теперь работает правильно
  page.querySelector('.back-button').addEventListener('click', () => {
    pagesContainer.style.display = 'none';
  });

  // Остальной код формы перевода...
}

// Скрытие всех страниц
function hidePages() {
  pagesContainer.style.display = 'none';
}

// Обновление интерфейса
function updateDisplays() {
  coinsDisplay.textContent = coins;
  highscoreDisplay.textContent = highscore;
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
  await initTelegramUser();
  await loadUserData();
  
  // Клик по монете
  coinElement?.addEventListener('click', () => {
    coins++;
    if (coins > highscore) highscore = coins;
    updateDisplays();
    saveUserData();
  });

  // Навигация
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;
      if (page === 'transfer') showTransferPage();
      else showDefaultPage(page);
    });
  });
});
