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
const coinContainer = document.getElementById('coin');
const coinElement = document.querySelector('.coin-button');
const pagesContainer = document.getElementById('pages-container');

// Сохранение страниц для повторного использования
const transferPage = document.getElementById('transfer-page');
const defaultPage = document.getElementById('default-page');

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
        coins = data.balance || 0; // Начальный баланс 0
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
    balance: 0, // Начальный баланс 0
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

 //Навигация
  const navButtons = document.querySelectorAll('.nav-button');
  if (navButtons) {
    navButtons.forEach(button => {
      button.addEventListener('click', handleNavButtonClick);
    });
  } else {
    console.error('Navigation buttons not found');
  }
}

// Функция для перевода коинов
async function transferCoins(recipientUsername, amount) {
  try {
    // Найти ID получателя по его username
    const recipientSnapshot = await db.ref('users').orderByChild('username').equalTo(recipientUsername).once('value');

    if (!recipientSnapshot.exists()) {
      return { success: false, message: 'Пользователь не найден' };
    }

    // Получить данные получателя
    const recipientData = recipientSnapshot.val();
    const recipientId = Object.keys(recipientData)[0];
    const recipientBalance = recipientData[recipientId].balance || 0;

    // Обновить баланс получателя
    await db.ref(`users/${recipientId}`).update({
      balance: recipientBalance + amount
    });

    // Обновить баланс отправителя
    await db.ref(`users/${USER_ID}`).update({
      balance: coins - amount
    });

    // Добавить запись в историю переводов
    const transferRecord = {
      type: 'outgoing',
      username: recipientUsername,
      amount: amount,
      date: new Date().toISOString()
    };

    await db.ref(`users/${USER_ID}/transfers`).push(transferRecord);

    return { success: true };
  } catch (error) {
    console.error('Transfer error:', error);
    return { success: false, message: 'Ошибка сети' };
  }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
  initTelegramUser();
  await loadUserData();
  initEventListeners();
  console.log('Initialization complete');
});
