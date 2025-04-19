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
 
 // Показ страницы перевода
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
   const historyList = page.querySelector('#history-list'); // Добавлено
 
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
 
 // Рендер истории переводов
 function renderTransferHistory(historyContainer) { // Добавлен аргумент
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
