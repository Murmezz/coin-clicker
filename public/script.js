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

// Функция для обновления интерфейса
function updateDisplays() {
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    
    if (coinsDisplay) coinsDisplay.textContent = coins;
    if (highscoreDisplay) highscoreDisplay.textContent = highscore;
}

// Инициализация пользователя
async function initTelegramUser() {
    try {
        await auth.signInAnonymously();
        const user = auth.currentUser;
        
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            USER_ID = `tg_${tgUser.id}`;
            currentUsername = tgUser.username ? `@${tgUser.username.toLowerCase()}` : `@user${tgUser.id.slice(-4)}`;
            
            // Проверяем/создаем запись пользователя
            const userRef = db.ref(`users/${USER_ID}`);
            const snapshot = await userRef.once('value');
            
            if (!snapshot.exists()) {
                await userRef.set({
                    username: currentUsername,
                    balance: 100, // Стартовый баланс
                    highscore: 0,
                    transfers: []
                });
            }
        } else {
            USER_ID = `anon_${user.uid.slice(-6)}`;
            currentUsername = `@anon_${Math.random().toString(36).substr(2, 5)}`;
        }
    } catch (error) {
        console.error('Auth error:', error);
        USER_ID = `dev_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Поиск пользователя в базе
async function findUserInDatabase(username) {
    if (!username.startsWith('@')) return null;
    
    const cleanUsername = username.toLowerCase();
    const snapshot = await db.ref('users').orderByChild('username').equalTo(cleanUsername).once('value');
    
    if (snapshot.exists()) {
        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        return { userId, ...userData[userId] };
    }
    return null;
}

// Перевод монет с проверками
async function transferCoins(recipientUsername, amount) {
    try {
        // Проверка ввода
        if (recipientUsername.toLowerCase() === currentUsername.toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        
        if (isNaN(amount) || amount < 1) {
            return { success: false, message: 'Некорректная сумма' };
        }
        
        if (amount > coins) {
            return { success: false, message: 'Недостаточно средств' };
        }

        // Поиск получателя
        const recipient = await findUserInDatabase(recipientUsername);
        if (!recipient) {
            return { success: false, message: 'Пользователь не найден в системе' };
        }

        // Подготовка транзакции
        const date = new Date().toISOString();
        const transaction = {
            date,
            from: currentUsername,
            to: recipientUsername,
            amount,
            status: 'completed'
        };

        // Атомарное обновление балансов
        const updates = {};
        updates[`users/${USER_ID}/balance`] = coins - amount;
        updates[`users/${USER_ID}/transfers`] = [...transferHistory, transaction];
        updates[`users/${recipient.userId}/balance`] = recipient.balance + amount;
        
        // Сохраняем историю получателя
        const recipientTransfers = recipient.transfers || [];
        updates[`users/${recipient.userId}/transfers`] = [...recipientTransfers, {
            ...transaction,
            from: currentUsername,
            to: recipientUsername
        }];

        // Выполняем обновление
        await db.ref().update(updates);

        // Обновляем локальные данные
        coins -= amount;
        transferHistory.push(transaction);
        updateDisplays();

        return { success: true, message: `Переведено ${amount} коинов пользователю ${recipientUsername}` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка при переводе' };
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
                updateDisplays();
            }
            resolve();
        });
    });
}

function getElement(id) {
    const el = document.getElementById(id);
    if (!el) console.error(`Element with id '${id}' not found`);
    return el;
}

// Показать страницу перевода
function showTransferPage() {
    const pagesContainer = getElement('pages-container');
    const transferPageTemplate = getElement('transfer-page');
    
    if (!pagesContainer || !transferPageTemplate) {
        console.error('Required elements for transfer page not found');
        return;
    }

    // Клонируем шаблон страницы
    const page = transferPageTemplate.cloneNode(true);
    pagesContainer.innerHTML = '';
    pagesContainer.appendChild(page);
    pagesContainer.style.display = 'block';

    // Находим элементы формы
    const sendButton = page.querySelector('#send-coins');
    const usernameInput = page.querySelector('#username');
    const amountInput = page.querySelector('#amount');
    const messageDiv = page.querySelector('#transfer-message');
    const historyList = page.querySelector('#history-list');

    if (!sendButton || !usernameInput || !amountInput || !messageDiv || !historyList) {
        console.error('Some transfer form elements not found');
        return;
    }

    // Обработчик отправки
    sendButton.addEventListener('click', async () => {
        const recipient = usernameInput.value.trim();
        const amount = parseInt(amountInput.value);

        if (!recipient || !recipient.startsWith('@')) {
            showMessage('Введите @username получателя', 'error', messageDiv);
            return;
        }

        const result = await transferCoins(recipient, amount);
        showMessage(result.message, result.success ? 'success' : 'error', messageDiv);
        
        if (result.success) {
            usernameInput.value = '';
            amountInput.value = '';
            renderTransferHistory(historyList);
        }
    });

    // Кнопка "Назад"
    const backButton = page.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }

    // Показ истории
    renderTransferHistory(historyList);
}

// ... (остальные функции остаются без изменений)

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем существование основных элементов
    if (!getElement('coin') || !getElement('coins') || !getElement('highscore')) {
        console.error('Critical elements not found');
        return;
    }

    await initTelegramUser();
    await loadUserData();

    // Клик по монете
    const coinButton = document.querySelector('.coin-button');
    if (coinButton) {
        coinButton.addEventListener('click', async () => {
            coins++;
            if (coins > highscore) highscore = coins;
            updateDisplays();
            await db.ref(`users/${USER_ID}`).update({ 
                balance: coins, 
                highscore 
            });
        });
    }

    // Навигация
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.page === 'transfer') {
                showTransferPage();
            } else {
                const pagesContainer = getElement('pages-container');
                const defaultPageTemplate = getElement('default-page');
                
                if (!pagesContainer || !defaultPageTemplate) return;
                
                const page = defaultPageTemplate.cloneNode(true);
                const titleElement = page.querySelector('.page-title');
                
                if (titleElement) {
                    titleElement.textContent = btn.textContent;
                }
                
                pagesContainer.innerHTML = '';
                pagesContainer.appendChild(page);
                pagesContainer.style.display = 'block';
                
                const backButton = page.querySelector('.back-button');
                if (backButton) {
                    backButton.addEventListener('click', () => {
                        pagesContainer.style.display = 'none';
                    });
                }
            }
        });
    });
});
