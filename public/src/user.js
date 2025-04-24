import { auth, db } from './firebase.js';

let state = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

export const getUserId = () => state.USER_ID;
export const getUsername = () => state.currentUsername;
export const getCoins = () => state.coins;
export const getHighscore = () => state.highscore;
export const getTransferHistory = () => [...state.transferHistory];

export const updateUserState = (newState) => {
    state = { ...state, ...newState };
    console.log("State updated:", state); // Добавьте для отладки
};

export async function initUser() {
    try {
        // 1. Проверяем Telegram WebApp
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const tgUserId = tgUser?.id.toString();
        
        // 2. Создаём ID (используем Telegram ID или генерируем)
        state.USER_ID = tgUserId ? `tg_${tgUserId}` : `anon_${Math.random().toString(36).substr(2, 9)}`;
        
        // 3. Устанавливаем username
        state.currentUsername = tgUser?.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user_${state.USER_ID.slice(-4)}`;
        
        // 4. Загружаем или создаём запись
        const userRef = db.ref(`users/${state.USER_ID}`);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            await userRef.set({
                username: state.currentUsername,
                balance: 100, // Стартовый баланс
                highscore: 0,
                telegramId: tgUserId || null,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
        
        // 5. Загружаем данные
        await loadData();
        
    } catch (error) {
        console.error("initUser error:", error);
        // Fallback
        state.USER_ID = `local_${Date.now()}`;
        state.currentUsername = "@guest";
        state.coins = 100;
    }
}

export async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${state.USER_ID}`).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            updateUserState({
                coins: data.balance || 100, // Дефолтное значение
                highscore: data.highscore || 0,
                transferHistory: data.transfers || []
            });
            resolve();
        });
    });
}