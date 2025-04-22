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

// Функция для безопасного получения элемента
function getElement(id) {
    return document.getElementById(id);
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
    
    historyList.innerHTML = transferHistory.length === 0 
        ? '<p>Нет истории переводов</p>'
        : transferHistory.slice(0, 10).map(tx => `
            <div class="history-item ${tx.status}">
                <div>
                    <span class="history-username">${tx.to}</span>
                    <span class="history-date">${new Date(tx.date).toLocaleString()}</span>
                </div>
                <span class="history-amount">-${tx.amount}</span>
            </div>
        `).join('');
}

// Инициализация пользователя
async function initUser() {
    try {
        // Аутентификация
        const { user } = await auth.signInAnonymously();
        USER_ID = user.uid;

        // Для Telegram пользователей
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            currentUsername = tgUser.username ? `@${tgUser.username.toLowerCase()}` : `@user${tgUser.id.slice(-4)}`;
        } else {
            currentUsername = `@user_${Math.random().toString(36).substr(2, 8)}`;
        }

        // Создаем/обновляем запись пользователя
        await db.ref(`users/${USER_ID}`).update({
            username: currentUsername,
            balance: firebase.database.ServerValue.increment(0),
            highscore: firebase.database.ServerValue.increment(0)
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        USER_ID = `local_${Math.random().toString(36).substr(2, 9)}`;
        currentUsername = `@guest_${Math.random().toString(36).substr(2, 5)}`;
    }
}

// Поиск пользователя по юзернейму
async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    try {
        // Приводим к нижнему регистру для поиска
        const searchUsername = username.toLowerCase();
        
        // Получаем токен аутентификации
        const token = await auth.currentUser.getIdToken();
        
        // Альтернативный метод поиска через фильтрацию
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(searchUsername)
            .once('value', { token });
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            const userId = Object.keys(users)[0];
            return { 
                userId,
                username: users[userId].username,
                balance: users[userId].balance || 0,
                transfers: users[userId].transfers || []
            };
        }
        return null;
    } catch (error) {
        console.error('Ошибка поиска:', error);
        // Fallback: попробуем получить только нужного пользователя
        try {
            const allUsers = await db.ref('users').once('value');
            const users = allUsers.val() || {};
            for (const uid in users) {
                if (users[uid].username && 
                    users[uid].username.toLowerCase() === username.toLowerCase()) {
                    return {
                        userId: uid,
                        ...users[uid]
                    };
                }
            }
            return null;
        } catch (fallbackError) {
            console.error('Fallback search failed:', fallbackError);
            return null;
        }
    }
}

// Перевод средств
async function makeTransfer(recipientUsername, amount) {
    try {
        // Проверка аутентификации
        if (!auth.currentUser) {
            await auth.signInAnonymously();
        }
        
        // Проверка ввода
        if (!recipientUsername || !recipientUsername.startsWith('@')) {
            return { success: false, message: 'Некорректный юзернейм' };
        }
        
        // Приводим юзернейм к нижнему регистру
        recipientUsername = recipientUsername.toLowerCase();
        
        // Поиск получателя
        const recipient = await findUser(recipientUsername);
        if (!recipient) {
            return { 
                success: false, 
                message: 'Пользователь @' + recipientUsername.slice(1) + ' не найден' 
            };
        }
        
        // Остальная логика перевода...
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка сервера' };
    }
}

        // Подготовка транзакции
        const transaction = {
            date: new Date().toISOString(),
            from: currentUsername,
            to: recipientUsername,
            amount: amount,
            status: 'completed'
        };

        // Атомарное обновление
        const updates = {};
        updates[`users/${USER_ID}/balance`] = coins - amount;
        updates[`users/${USER_ID}/transfers`] = [...transferHistory, transaction];
        updates[`users/${recipient.userId}/balance`] = (recipient.balance || 0) + amount;
        updates[`users/${recipient.userId}/transfers`] = [...(recipient.transfers || []), transaction];

        await db.ref().update(updates);

        // Обновление локальных данных
        coins -= amount;
        transferHistory.push(transaction);
        updateDisplays();
        renderTransferHistory();

        return { success: true, message: `Перевод ${amount} коинов успешен!` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка при переводе' };
    }
}

// Загрузка данных
async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                coins = data.balance || 0;
                highscore = data.highscore || 0;
                transferHistory = data.transfers || [];
                updateDisplays();
                renderTransferHistory();
            }
            resolve();
        });
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    await initUser();
    await loadData();

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
            }
        });
    });
});

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
    
    if (!sendButton || !usernameInput || !amountInput) return;
    
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
}
