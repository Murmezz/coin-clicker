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
let isTransferInProgress = false;

// Функция для безопасного получения элемента
function getElement(id) {
    const el = document.getElementById(id);
    if (!el) console.error(`Элемент #${id} не найден`);
    return el;
}

// Обновление интерфейса
function updateDisplays() {
    const coinsDisplay = getElement('coins');
    const highscoreDisplay = getElement('highscore');
    if (coinsDisplay) coinsDisplay.textContent = coins;
    if (highscoreDisplay) highscoreDisplay.textContent = highscore;
}

// Показать сообщение
function showMessage(text, type) {
    const messageDiv = getElement('transfer-message');
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `transfer-message ${type}-message`;
}

// Рендер истории переводов
function renderTransferHistory() {
    const historyList = getElement('history-list');
    if (!historyList) return;
    
    if (!Array.isArray(transferHistory)) {
        transferHistory = [];
    }
    
    historyList.innerHTML = transferHistory.length === 0 
        ? '<div class="empty-history">Нет истории переводов</div>'
        : transferHistory.map(tx => `
            <div class="history-item ${tx.from === currentUsername ? 'outgoing' : 'incoming'}">
                <div class="history-info">
                    <span class="history-direction-icon">
                        ${tx.from === currentUsername ? '↑' : '↓'}
                    </span>
                    <div>
                        <span class="history-username">
                            ${tx.from === currentUsername ? tx.to : tx.from}
                        </span>
                        <span class="history-date">
                            ${new Date(tx.date).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
                <span class="history-amount">
                    ${tx.from === currentUsername ? '-' : '+'}${tx.amount}
                </span>
            </div>
        `).join('');
}

// Очистка кеша аутентификации
async function clearAuthCache() {
    try {
        await auth.signOut();
        if (window.indexedDB) {
            await new Promise((resolve) => {
                const req = indexedDB.deleteDatabase("firebaseLocalStorageDb");
                req.onsuccess = resolve;
                req.onerror = resolve;
            });
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('firebase:authUser:AIzaSyBlB5mKpyKi2MVp2ZYqbE3kBc0VdmXr3Ik:[DEFAULT]');
        }
    } catch (error) {
        console.error("Ошибка очистки кеша:", error);
    }
}

// Аутентификация пользователя
async function initAuth() {
    try {
        await clearAuthCache();
        const userCredential = await auth.signInAnonymously();
        return userCredential.user;
    } catch (error) {
        console.error("Ошибка аутентификации:", error);
        return null;
    }
}

// Инициализация пользователя
async function initUser() {
    const user = await initAuth();
    
    if (!user) {
        // Fallback для локального режима
        USER_ID = `local_${Date.now()}`;
        currentUsername = `@guest_${Math.random().toString(36).substr(2, 5)}`;
        coins = 100;
        highscore = 0;
        transferHistory = [];
        updateDisplays();
        return;
    }

    USER_ID = user.uid;
    
    // Для Telegram WebApp
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = Telegram.WebApp.initDataUnsafe.user;
        currentUsername = tgUser.username ? `@${tgUser.username.toLowerCase()}` : `@user${tgUser.id.slice(-4)}`;
    } else {
        currentUsername = `@anon_${Math.random().toString(36).substr(2, 8)}`;
    }

    // Создаем/обновляем запись пользователя
    await db.ref(`users/${USER_ID}`).transaction((currentData) => {
        if (!currentData) {
            return {
                username: currentUsername,
                balance: 100,
                highscore: 0,
                transfers: {},
                lastLogin: Date.now()
            };
        }
        return currentData;
    });
}

// Поиск пользователя по юзернейму
async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    try {
        const searchUsername = username.toLowerCase();
        const snapshot = await db.ref('users').once('value');
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            for (const userId in users) {
                if (users[userId].username && 
                    users[userId].username.toLowerCase() === searchUsername) {
                    return { 
                        userId,
                        username: users[userId].username,
                        balance: users[userId].balance || 0,
                        transfers: users[userId].transfers || {}
                    };
                }
            }
        }
        return null;
    } catch (error) {
        console.error('Ошибка поиска:', error);
        return null;
    }
}

// Перевод средств
async function makeTransfer(recipientUsername, amount) {
    if (isTransferInProgress) return { success: false, message: 'Перевод уже выполняется' };
    isTransferInProgress = true;

    const sendButton = document.querySelector('#send-coins');
    try {
        // Проверки
        recipientUsername = recipientUsername.toLowerCase();
        if (recipientUsername === currentUsername.toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        
        const recipient = await findUser(recipientUsername);
        if (!recipient) {
            return { success: false, message: 'Пользователь не найден' };
        }
        
        if (amount > coins || amount < 1) {
            return { success: false, message: 'Недостаточно средств' };
        }

        // Генерируем уникальный ID транзакции
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Создаем транзакцию
        const transaction = {
            id: transactionId,
            date: new Date().toISOString(),
            from: currentUsername,
            to: recipient.username,
            amount: amount,
            status: 'completed'
        };

        // Атомарное обновление
        const updates = {};
        updates[`users/${USER_ID}/balance`] = coins - amount;
        updates[`users/${USER_ID}/transfers/${transactionId}`] = transaction;
        updates[`users/${recipient.userId}/balance`] = (recipient.balance || 0) + amount;
        updates[`users/${recipient.userId}/transfers/${transactionId}`] = transaction;

        // Выполняем обновление
        await db.ref().update(updates);

        // Обновляем локальные данные
        coins -= amount;
        if (!Array.isArray(transferHistory)) transferHistory = [];
        transferHistory.unshift(transaction);
        updateDisplays();
        renderTransferHistory();

        return { success: true, message: `Переведено ${amount} коинов` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка при переводе' };
    } finally {
        isTransferInProgress = false;
        if (sendButton) sendButton.disabled = false;
    }
}

// Загрузка данных пользователя
async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                coins = data.balance || 0;
                highscore = data.highscore || 0;
                
                // Конвертируем transfers в массив
                if (data.transfers && typeof data.transfers === 'object') {
                    transferHistory = Object.values(data.transfers);
                } else {
                    transferHistory = [];
                }
                
                updateDisplays();
                renderTransferHistory();
            }
            resolve();
        }, (error) => {
            console.error('Ошибка загрузки данных:', error);
            resolve();
        });
    });
}

// Инициализация клика по монете
function initCoinClick() {
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
}

// Показать страницу перевода
function showTransferPage() {
    const pagesContainer = getElement('pages-container');
    const transferPage = getElement('transfer-page');
    
    if (!pagesContainer || !transferPage) return;
    
    pagesContainer.innerHTML = '';
    const page = transferPage.cloneNode(true);
    pagesContainer.appendChild(page);
    pagesContainer.style.display = 'block';

    // Форма перевода
    const sendButton = page.querySelector('#send-coins');
    const usernameInput = page.querySelector('#username');
    const amountInput = page.querySelector('#amount');
    const messageDiv = page.querySelector('#transfer-message');
    
    if (!sendButton || !usernameInput || !amountInput || !messageDiv) return;
    
    sendButton.addEventListener('click', async () => {
        const recipient = usernameInput.value.trim();
        const amount = parseInt(amountInput.value);
        
        if (!recipient || !recipient.startsWith('@')) {
            showMessage('Введите @username получателя', 'error');
            return;
        }
        
        const result = await makeTransfer(recipient, amount);
        showMessage(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
            usernameInput.value = '';
            amountInput.value = '';
        }
    });

    // Кнопка "Назад"
    const backButton = page.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
    
    renderTransferHistory();
}

// Инициализация навигации
function initNavigation() {
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.page === 'transfer') {
                showTransferPage();
            } else {
                const pagesContainer = getElement('pages-container');
                const defaultPage = getElement('default-page');
                
                if (!pagesContainer || !defaultPage) return;
                
                const page = defaultPage.cloneNode(true);
                const title = page.querySelector('.page-title');
                if (title) title.textContent = btn.textContent;
                
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
}

// Инициализация Telegram WebApp
function initTelegramWebApp() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        Telegram.WebApp.onEvent('viewportChanged', () => {
            Telegram.WebApp.expand();
        });
    }
}

// Основная функция инициализации
async function initializeApp() {
    initTelegramWebApp();
    await initUser();
    await loadData();
    initCoinClick();
    initNavigation();
    updateDisplays();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error('Ошибка инициализации приложения:', error);
        showMessage('Ошибка загрузки приложения', 'error');
    });
});

// Функция для смены пользователя
window.logout = function() {
    clearAuthCache().then(() => {
        window.location.reload();
    });
};