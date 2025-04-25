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
        
        // Проверяем разные варианты получения данных
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            tgUser = Telegram.WebApp.initDataUnsafe.user;
        } else if (window.Telegram?.WebApp?.initData) {
            try {
                const cleanData = Telegram.WebApp.initData.toString()
                    .replace(/^[^a-zA-Z0-9]+/, '');
                
                const params = new URLSearchParams(cleanData);
                const userStr = params.get('user');
                if (userStr) tgUser = JSON.parse(userStr);
            } catch (e) {
                console.warn('Failed to parse user data:', e);
            }
        }

        // Fallback если данные не получены
        if (!tgUser) {
            tgUser = {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Гость',
                username: 'guest_' + Math.random().toString(36).substr(2, 5)
            };
        }

        state.USER_ID = `tg_${tgUser.id}`;
        state.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${tgUser.id.toString().slice(-4)}`;

        // Далее ваша существующая логика работы с базой данных...
        
    } catch (error) {
        console.error('Init error:', error);
        // Fallback логика
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
