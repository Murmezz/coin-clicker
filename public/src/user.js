// Инициализация Firebase
const auth = firebase.auth();

// Состояние пользователя
let state = {
    USER_ID: '',
    currentUsername: '',
    coins: 100,
    highscore: 0,
    transferHistory: []
};

async function initUser() {
    try {
        const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
        const userId = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
        const username = tgUser?.username ? `@${tgUser.username}` : `@user_${userId.slice(-4)}`;

        // Аутентификация через Telegram
        await auth.signInAnonymously();
        
        // Создаем/обновляем запись пользователя
        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            await userRef.set({
                username: username,
                balance: 100,
                highscore: 0,
                telegramId: tgUser?.id || null,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }

        // Обновляем состояние
        state.USER_ID = userId;
        state.currentUsername = username;
        await loadData();

    } catch (error) {
        console.error("Init error:", error);
        // Fallback
        state.USER_ID = `local_${Date.now()}`;
        state.currentUsername = "@guest";
        state.coins = 100;
    }
}

async function loadData() {
    if (!state.USER_ID) return;
    
    return new Promise((resolve) => {
        db.ref(`users/${state.USER_ID}`).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            state.coins = data.balance || 100;
            state.highscore = data.highscore || 0;
            state.transferHistory = data.transfers || [];
            resolve();
        });
    });
}

// Экспортируем функции
window.user = {
    getUserId: () => state.USER_ID,
    getUsername: () => state.currentUsername,
    getCoins: () => state.coins,
    getHighscore: () => state.highscore,
    getTransferHistory: () => [...state.transferHistory],
    updateUserState: (newState) => Object.assign(state, newState),
    initUser,
    loadData
};
