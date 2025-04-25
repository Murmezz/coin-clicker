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
        await auth.signInAnonymously();
        
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (!tgUser) throw new Error('Telegram user not found');

        state.USER_ID = `tg_${tgUser.id}`;
        state.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${tgUser.id.toString().slice(-4)}`;

        const userRef = db.ref(`users/${state.USER_ID}`);
        const snapshot = await userRef.once('value');

        if (!snapshot.exists()) {
            // Создаем запись пользователя
            await userRef.set({
                username: state.currentUsername,
                balance: 0,
                highscore: 0,
                transfers: []
            });
            
            // Добавляем в индекс юзернеймов
            await db.ref(`usernames/${state.currentUsername.toLowerCase()}`)
                  .set(state.USER_ID);
        }

        await loadData();
    } catch (error) {
        console.error('Init error:', error);
        state.USER_ID = `local_${Math.random().toString(36).substr(2, 9)}`;
        state.currentUsername = '@guest';
    }
}

        // Загружаем данные
        await loadData();

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Fallback для тестирования вне Telegram
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
