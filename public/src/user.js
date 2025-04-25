import { db, auth } from './firebase.js';

const state = {
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
    Object.assign(state, newState);
};

export async function initUser() {
    try {
        // Ожидаем аутентификацию
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
        state.USER_ID = `tg_${tgUser.id || Math.random().toString(36).slice(2, 10)}`;
        state.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${state.USER_ID.slice(-4)}`;

        await db.ref(`users/${state.USER_ID}`).update({
            username: state.currentUsername,
            balance: 0,
            highscore: 0,
            transfers: []
        });

        await loadData();
    } catch (error) {
        console.error('Init error:', error);
        state.USER_ID = `local_${Math.random().toString(36).slice(2, 10)}`;
        state.currentUsername = '@guest';
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
