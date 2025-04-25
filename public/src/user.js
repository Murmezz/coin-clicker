// Состояние приложения
const userState = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

// Геттеры
const getUserId = () => userState.USER_ID;
const getUsername = () => userState.currentUsername;
const getCoins = () => userState.coins;
const getHighscore = () => userState.highscore;
const getTransferHistory = () => [...userState.transferHistory];

// Обновление состояния
const updateUserState = (newState) => {
    Object.assign(userState, newState);
};

// Инициализация пользователя
const initializeUser = async () => {
    try {
        // Аутентификация
        const { auth, db } = window.firebaseApp;
        await auth.signInAnonymously();
        
        // Получаем данные пользователя
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
        userState.USER_ID = `tg_${tgUser.id || Math.random().toString(36).slice(2, 10)}`;
        
        // Формируем username
        userState.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}`
            : `@user${userState.USER_ID.slice(-4)}`;

        // Инициализация в базе данных
        await db.ref(`users/${userState.USER_ID}`).update({
            username: userState.currentUsername,
            balance: firebase.database.ServerValue.increment(0),
            highscore: firebase.database.ServerValue.increment(0),
            transfers: []
        });

        // Загрузка данных
        await loadUserData();
        
    } catch (error) {
        console.error('User initialization failed:', error);
        // Fallback данные
        userState.USER_ID = `local_${Date.now()}`;
        userState.currentUsername = '@guest';
    }
};

// Загрузка данных пользователя
const loadUserData = () => {
    return new Promise((resolve) => {
        const { db } = window.firebaseApp;
        db.ref(`users/${userState.USER_ID}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                updateUserState({
                    coins: data.balance || 0,
                    highscore: data.highscore || 0,
                    transferHistory: data.transfers || []
                });
            }
            resolve();
        });
    });
};

// Экспорт
export {
    getUserId,
    getUsername,
    getCoins,
    getHighscore,
    getTransferHistory,
    initializeUser as initUser,
    loadUserData as loadData
};
