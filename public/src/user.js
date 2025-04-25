import { auth, db } from './firebase.js';

// Состояние приложения
const state = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

// Геттеры
export const getUserId = () => state.USER_ID;
export const getUsername = () => state.currentUsername;
export const getCoins = () => state.coins;
export const getHighscore = () => state.highscore;
export const getTransferHistory = () => [...state.transferHistory];

// Обновление состояния
export const updateUserState = (newState) => {
    Object.assign(state, newState);
};

// Инициализация пользователя
export async function initUser() {
    try {
        // Аутентификация в Firebase
        await auth.signInAnonymously();
        
        // Получаем данные пользователя
        let tgUser = getTelegramUserData();
        
        // Устанавливаем ID и username
        state.USER_ID = `tg_${tgUser.id}`;
        state.currentUsername = formatUsername(tgUser);
        
        // Инициализация в базе данных
        await initializeUserInDatabase();
        
        // Загрузка данных
        await loadData();
        
    } catch (error) {
        console.error('User initialization failed:', error);
        setFallbackUserData();
    }
}

// Загрузка данных из базы
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

// Вспомогательные функции
function getTelegramUserData() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        return Telegram.WebApp.initDataUnsafe.user;
    }
    
    // Fallback данные
    return {
        id: Math.floor(Math.random() * 1000000),
        first_name: 'Гость',
        username: 'guest_' + Math.random().toString(36).slice(2, 7)
    };
}

function formatUsername(user) {
    return user.username 
        ? `@${user.username.toLowerCase()}` 
        : `@user${user.id.toString().slice(-4)}`;
}

async function initializeUserInDatabase() {
    const userRef = db.ref(`users/${state.USER_ID}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
        await userRef.set({
            username: state.currentUsername,
            balance: 0,
            highscore: 0,
            transfers: []
        });
        
        // Создаем запись для поиска по username
        await db.ref(`usernames/${state.currentUsername.toLowerCase()}`)
              .set(state.USER_ID);
    }
}

function setFallbackUserData() {
    state.USER_ID = `local_${Math.random().toString(36).slice(2, 11)}`;
    state.currentUsername = '@guest';
    state.coins = 0;
    state.highscore = 0;
    state.transferHistory = [];
}
