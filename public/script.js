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

// Инициализация пользователя
async function initTelegramUser() {
    try {
        await auth.signInAnonymously();
        const user = auth.currentUser;
        
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            USER_ID = `tg_${tgUser.id}`;
            currentUsername = tgUser.username ? `@${tgUser.username.toLowerCase()}` : `@user${tgUser.id.slice(-4)}`;
            
            // Сохраняем/обновляем юзернейм в базе
            const userRef = db.ref(`users/${USER_ID}`);
            const snapshot = await userRef.once('value');
            
            if (!snapshot.exists()) {
                await userRef.set({
                    username: currentUsername,
                    balance: 0,
                    highscore: 0,
                    transfers: []
                });
            } else if (!snapshot.val().username) {
                await userRef.update({ username: currentUsername });
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

// Поиск пользователя по юзернейму (без учета регистра)
async function findUserByUsername(username) {
    if (!username.startsWith('@')) return null;
    
    const cleanUsername = username.toLowerCase();
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val();
    
    for (const userId in users) {
        if (users[userId].username && users[userId].username.toLowerCase() === cleanUsername) {
            return { userId, ...users[userId] };
        }
    }
    return null;
}

// Перевод монет между пользователями
async function transferCoins(recipientUsername, amount) {
    try {
        // Проверки
        if (recipientUsername.toLowerCase() === currentUsername.toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        
        const recipient = await findUserByUsername(recipientUsername);
        if (!recipient) {
            return { success: false, message: 'Пользователь не найден' };
        }
        
        if (amount > coins) {
            return { success: false, message: 'Недостаточно коинов' };
        }

        // Создаем транзакции
        const date = new Date().toISOString();
        const outgoingTx = { date, username: recipientUsername, amount, type: 'outgoing' };
        const incomingTx = { date, username: currentUsername, amount, type: 'incoming' };

        // Атомарное обновление
        const updates = {};
        updates[`users/${USER_ID}/balance`] = coins - amount;
        updates[`users/${USER_ID}/transfers`] = [...transferHistory, outgoingTx];
        updates[`users/${recipient.userId}/balance`] = (recipient.balance || 0) + amount;
        updates[`users/${recipient.userId}/transfers`] = [...(recipient.transfers || []), incomingTx];

        await db.ref().update(updates);

        // Обновляем локальные данные
        coins -= amount;
        transferHistory.push(outgoingTx);
        updateDisplays();

        return { success: true, message: `Успешно переведено ${amount} коинов` };
    } catch (error) {
        console.error('Transfer error:', error);
        return { success: false, message: 'Ошибка перевода' };
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
            }
            updateDisplays();
            resolve();
        });
    });
}

// Обновление интерфейса
function updateDisplays() {
    document.getElementById('coins').textContent = coins;
    document.getElementById('highscore').textContent = highscore;
}

// Показать страницу перевода
function showTransferPage() {
    const pagesContainer = document.getElementById('pages-container');
    pagesContainer.innerHTML = '';
    const page = document.getElementById('transfer-page').cloneNode(true);
    pagesContainer.appendChild(page);
    pagesContainer.style.display = 'block';

    // Обработчики для формы
    const sendButton = page.querySelector('#send-coins');
    const usernameInput = page.querySelector('#username');
    const amountInput = page.querySelector('#amount');
    const messageDiv = page.querySelector('#transfer-message');
    const historyList = page.querySelector('#history-list');

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
    page.querySelector('.back-button').addEventListener('click', () => {
        pagesContainer.style.display = 'none';
    });

    // Показ истории
    renderTransferHistory(historyList);
}

// Рендер истории переводов
function renderTransferHistory(container) {
    container.innerHTML = transferHistory.length === 0 
        ? '<p>Нет истории переводов</p>'
        : transferHistory.slice(0, 10).map(tx => `
            <div class="history-item ${tx.type}">
                <div>
                    <span class="history-username">${tx.username}</span>
                    <span class="history-date">${new Date(tx.date).toLocaleString()}</span>
                </div>
                <span class="history-amount ${tx.type}">${tx.type === 'outgoing' ? '-' : '+'}${tx.amount}</span>
            </div>
        `).join('');
}

// Показать сообщение
function showMessage(text, type, container) {
    container.textContent = text;
    container.className = `transfer-message ${type}-message`;
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    await initTelegramUser();
    await loadUserData();

    // Клик по монете
    document.querySelector('.coin-button').addEventListener('click', () => {
        coins++;
        if (coins > highscore) highscore = coins;
        updateDisplays();
        db.ref(`users/${USER_ID}`).update({ balance: coins, highscore });
    });

    // Навигация
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.page === 'transfer') {
                showTransferPage();
            } else {
                const pagesContainer = document.getElementById('pages-container');
                pagesContainer.innerHTML = '';
                const page = document.getElementById('default-page').cloneNode(true);
                page.querySelector('.page-title').textContent = btn.textContent;
                pagesContainer.appendChild(page);
                pagesContainer.style.display = 'block';
                
                page.querySelector('.back-button').addEventListener('click', () => {
                    pagesContainer.style.display = 'none';
                });
            }
        });
    });
});
