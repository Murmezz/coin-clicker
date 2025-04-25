import { db, auth } from './firebase.js';

let userData = {
    coins: 0,
    highscore: 0,
    telegramId: null,
    username: null
};

export function getUserId() {
    return userData.telegramId;
}

export function getCoins() {
    return userData.coins;
}

export function getHighscore() {
    return userData.highscore;
}

export function updateUserState(newState) {
    userData = { ...userData, ...newState };
}

export async function initUser() {
    try {
        // Получаем данные из Telegram WebApp
        const tg = window.Telegram.WebApp;
        if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            throw new Error('Telegram user data not available');
        }

        const telegramUser = tg.initDataUnsafe.user;
        userData.telegramId = telegramUser.id.toString();
        userData.username = telegramUser.username || null;

        // Проверяем существование пользователя в базе
        const userRef = db.ref(users/${userData.telegramId});
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            // Создаем нового пользователя
            await userRef.set({
                telegramId: userData.telegramId,
                username: userData.username,
                balance: 0,
                highscore: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }

        // Устанавливаем слушатель изменений данных пользователя
        userRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                updateUserState({
                    coins: data.balance || 0,
                    highscore: data.highscore || 0
                });
            }
        });

    } catch (error) {
        console.error('Error initializing user:', error);
        throw error;
    }
}

export async function loadData() {
    try {
        if (!userData.telegramId) {
            throw new Error('User not initialized');
        }

        const snapshot = await db.ref(users/${userData.telegramId}).once('value');
        const data = snapshot.val();
        
        if (data) {
            updateUserState({
                coins: data.balance || 0,
                highscore: data.highscore || 0
            });
        }
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

export async function updateUserData(updates) {
    try {
        if (!userData.telegramId) {
            throw new Error('User not initialized');
        }

        await db.ref(users/${userData.telegramId}).update(updates);
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
}
