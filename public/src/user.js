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
};

export async function initUser() {
    try {
        const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
        if (!tgUser) throw new Error("No Telegram user");

        // Жёсткая привязка к Telegram ID
        state.USER_ID = `tg_${tgUser.id}`;
        state.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${tgUser.id.toString().slice(-4)}`;

        // Создаём/обновляем запись
        await db.ref(`users/${state.USER_ID}`).update({
            username: state.currentUsername,
            telegramId: tgUser.id, // Добавляем ID для миграции
            balance: firebase.database.ServerValue.increment(0),
            highscore: firebase.database.ServerValue.increment(0),
            lastLogin: new Date().toISOString()
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Fallback для тестирования
        state.USER_ID = `local_${Math.random().toString(36).substr(2, 9)}`;
        state.currentUsername = `@guest_${Math.random().toString(36).substr(2, 5)}`;
    }
}

export async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${state.USER_ID}`).on('value', (snapshot) => {
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
}