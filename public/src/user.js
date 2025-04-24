import { auth, db } from './firebase.js';

let state = {
    USER_ID: '',
    currentUsername: '',
    coins: 100,
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
    console.log("State updated:", state);
};

export async function initUser() {
    try {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        state.USER_ID = tgUser ? `tg_${tgUser.id}` : `anon_${Date.now()}`;
        state.currentUsername = tgUser?.username ? `@${tgUser.username}` : `@user${state.USER_ID.slice(-4)}`;

        await db.ref(`users/${state.USER_ID}`).update({
            username: state.currentUsername,
            balance: 100,
            highscore: 0,
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        });

        await loadData();
    } catch (error) {
        console.error("Init error:", error);
        state.coins = 100;
    }
}

export async function loadData() {
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