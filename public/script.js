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

// Инициализация пользователя (исправленная)
async function initUser() {
    try {
        // Аутентификация
        const { user } = await auth.signInAnonymously();
        USER_ID = user.uid;

        // Для Telegram WebApp
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            currentUsername = tgUser.username ? `@${tgUser.username.toLowerCase()}` : `@user${tgUser.id.slice(-4)}`;
        } else {
            currentUsername = `@anon_${Math.random().toString(36).substr(2, 8)}`;
        }

        // Создаем/обновляем запись пользователя
        await db.ref(`users/${USER_ID}`).set({
            username: currentUsername,
            balance: 100, // Стартовый баланс
            highscore: 0,
            transfers: {}
        }, (error) => {
            if (error) {
                console.error('Ошибка создания пользователя:', error);
            }
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        USER_ID = `local_${Math.random().toString(36).substr(2, 9)}`;
        currentUsername = `@guest_${Math.random().toString(36).substr(2, 5)}`;
    }
}

// Перевод средств (защищенный от дублирования)
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
            to: recipientUsername,
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
        transferHistory.unshift(transaction);
        updateDisplays();
        renderTransferHistory();

        return { success: true, message: `Переведено ${amount} коинов` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка сервера' };
    } finally {
        isTransferInProgress = false;
        if (sendButton) sendButton.disabled = false;
    }
}

// Загрузка данных (с защитой от ошибок)
async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
            try {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    coins = data.balance || 0;
                    highscore = data.highscore || 0;
                    
                    // Конвертируем transfers в массив
                    transferHistory = data.transfers 
                        ? Object.values(data.transfers).sort((a, b) => 
                            new Date(b.date) - new Date(a.date))
                        : [];
                    
                    updateDisplays();
                    renderTransferHistory();
                }
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            }
            resolve();
        }, (error) => {
            console.error('Ошибка подписки на данные:', error);
            resolve();
        });
    });
}
