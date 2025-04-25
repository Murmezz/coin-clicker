import { auth, db } from './firebase.js';

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
        await auth.signInAnonymously();
        
        // Безопасное получение данных пользователя
        let tgUser = null;
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            tgUser = Telegram.WebApp.initDataUnsafe.user;
        } else {
            // Fallback для тестирования
            tgUser = {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Guest'
            };
        }

        state.USER_ID = `tg_${tgUser.id}`;
        state.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${tgUser.id.toString().slice(-4)}`;

        // Работа с базой данных
        const userRef = db.ref(`users/${state.USER_ID}`);
        const snapshot = await userRef.once('value');

        if (!snapshot.exists()) {
            await userRef.set({
                username: state.currentUsername,
                balance: 0,
                highscore: 0,
                transfers: []
            });
        }

        await loadData();
    } catch (error) {
        console.error('Init error:', error);
        state.USER_ID = `local_${Math.random().toString(36).slice(2, 11)}`;
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
