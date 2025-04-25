import { auth, db } from './firebase.js';

// Приватные переменные состояния
let state = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

// Геттеры для получения данных
export const getUserId = () => state.USER_ID;
export const getUsername = () => state.currentUsername;
export const getCoins = () => state.coins;
export const getHighscore = () => state.highscore;
export const getTransferHistory = () => [...state.transferHistory];

// Сеттеры для обновления данных
export const updateUserState = (newState) => {
    state = { ...state, ...newState };
};

export async function initUser() {
    try {
        const { user } = await auth.signInAnonymously();
        state.USER_ID = user.uid;

        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            state.currentUsername = tgUser.username 
                ? `@${tgUser.username.toLowerCase()}` 
                : `@user${tgUser.id.slice(-4)}`;
        } else {
            state.currentUsername = `@user_${Math.random().toString(36).substr(2, 8)}`;
        }

        await db.ref(`users/${state.USER_ID}`).update({
            username: state.currentUsername,
            balance: firebase.database.ServerValue.increment(0),
            highscore: firebase.database.ServerValue.increment(0)
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
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
