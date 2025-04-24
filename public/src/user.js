// Убираем дублирующееся объявление auth
const userState = {
    USER_ID: '',
    currentUsername: '',
    coins: 100,
    highscore: 0,
    transferHistory: []
};

async function initUser() {
    try {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const userId = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
        const username = tgUser?.username ? `@${tgUser.username}` : `@user_${userId.slice(-4)}`;

        // Создаем/обновляем запись пользователя
        const userRef = firebase.database().ref(`users/${userId}`);
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
        userState.USER_ID = userId;
        userState.currentUsername = username;
        await loadData();

    } catch (error) {
        console.error("Init error:", error);
        // Fallback
        userState.USER_ID = `local_${Date.now()}`;
        userState.currentUsername = "@guest";
        userState.coins = 100;
    }
}

async function loadData() {
    if (!userState.USER_ID) return;
    
    return new Promise((resolve) => {
        firebase.database().ref(`users/${userState.USER_ID}`).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            userState.coins = data.balance || 100;
            userState.highscore = data.highscore || 0;
            userState.transferHistory = data.transfers || [];
            resolve();
        });
    });
}

// Экспортируем объект с методами
window.userModule = {
    getUserId: () => userState.USER_ID,
    getUsername: () => userState.currentUsername,
    getCoins: () => userState.coins,
    getHighscore: () => userState.highscore,
    getTransferHistory: () => [...userState.transferHistory],
    updateUserState: (newState) => Object.assign(userState, newState),
    initUser,
    loadData
};
