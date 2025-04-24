// Состояние пользователя
let state = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

// Геттеры
function getUserId() { return state.USER_ID; }
function getUsername() { return state.currentUsername; }
function getCoins() { return state.coins; }
function getHighscore() { return state.highscore; }
function getTransferHistory() { return [...state.transferHistory]; }

// Обновление состояния
function updateUserState(newState) {
    state = { ...state, ...newState };
    console.log("State updated:", state);
}

// Инициализация пользователя
async function initUser() {
    try {
        const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
        state.USER_ID = tgUser ? `tg_${tgUser.id}` : `anon_${Date.now()}`;
        state.currentUsername = tgUser?.username ? `@${tgUser.username}` : `@user_${state.USER_ID.slice(-4)}`;

        await db.ref(`users/${state.USER_ID}`).update({
            username: state.currentUsername,
            balance: 100, // Стартовый баланс
            highscore: 0,
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });

        await loadData();
    } catch (error) {
        console.error("Init error:", error);
        state.coins = 100;
    }
}

// Загрузка данных
async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${state.USER_ID}`).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            updateUserState({
                coins: data.balance || 100,
                highscore: data.highscore || 0,
                transferHistory: data.transfers || []
            });
            resolve();
        });
    });
}

// Экспортируем функции
window.user = {
    getUserId,
    getUsername,
    getCoins,
    getHighscore,
    getTransferHistory,
    updateUserState,
    initUser,
    loadData
};
