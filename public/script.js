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
    
    // Сортируем по дате (новые сверху)
    const sortedHistory = [...transferHistory].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    historyList.innerHTML = sortedHistory.length === 0 
        ? '<div class="empty-history">История переводов пуста</div>'
        : sortedHistory.map(tx => `
            <div class="history-item ${tx.from === currentUsername ? 'outgoing' : 'incoming'}">
                <div>
                    <span class="history-username">
                        ${tx.from === currentUsername ? tx.to : tx.from}
                    </span>
                    <span class="history-date">
                        ${new Date(tx.date).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <span class="history-amount">
                    ${tx.from === currentUsername ? '-' : '+'}${tx.amount}
                </span>
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
        const searchUsername = username.toLowerCase();
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(searchUsername)
            .once('value');
        
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
        return null;
    }
}

// Функция перевода средств (обновленная)
async function makeTransfer(recipientUsername, amount) {
    try {
        // Проверки
        if (recipientUsername.toLowerCase() === currentUsername.toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        
        const recipient = await findUser(recipientUsername);
        if (!recipient) {
            return { success: false, message: 'Пользователь не зарегистрирован' };
        }
        
        if (amount > coins || amount < 1) {
            return { success: false, message: 'Некорректная сумма' };
        }

        // Блокировка повторных отправок
        const sendButton = document.querySelector('#send-coins');
        if (sendButton) sendButton.disabled = true;

        // Подготовка транзакции
        const transaction = {
            date: new Date().toISOString(),
            from: currentUsername,
            to: recipientUsername,
            amount: amount,
            status: 'completed',
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
        };

        // Атомарное обновление
        const updates = {};
        updates[`users/${USER_ID}/balance`] = firebase.database.ServerValue.increment(-amount);
        updates[`users/${USER_ID}/transfers/${transaction.id}`] = transaction;
        updates[`users/${recipient.userId}/balance`] = firebase.database.ServerValue.increment(amount);
        updates[`users/${recipient.userId}/transfers/${transaction.id}`] = transaction;

        await db.ref().update(updates);

        // Обновление локальных данных
        coins -= amount;
        transferHistory.unshift(transaction); // Добавляем в начало массива
        updateDisplays();
        renderTransferHistory();

        return { success: true, message: `Перевод ${amount} коинов успешен!` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка при переводе' };
    } finally {
        const sendButton = document.querySelector('#send-coins');
        if (sendButton) sendButton.disabled = false;
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

// Основная функция инициализации
async function initializeApp() {
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
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error('Ошибка инициализации приложения:', error);
    });
});
