// Импортируем Firebase через CDN (стандартный способ)
import firebase from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js';
import 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js';
import 'https://www.gstatic.com/firebasejs/9.6.0/firebase-database-compat.js';

// Состояние пользователя
const state = {
    USER_ID: '',
    currentUsername: '',
    coins: 100,
    highscore: 0,
    transferHistory: {}
};

// Инициализация Firebase (должна быть вызвана до использования)
let db;

export async function initUser(firebaseApp) {
    try {
        db = firebase.database(firebaseApp);
        
        // Анонимная аутентификация
        await firebase.auth().signInAnonymously();
        
        // Инициализация пользователя
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
        state.currentUsername = tgUser?.username 
            ? `@${tgUser.username}` 
            : `@user_${state.USER_ID.slice(-4)}`;

        // Проверка/создание пользователя в базе
        const userRef = db.ref(`users/${state.USER_ID}`);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            state.coins = data.balance || 100;
            state.highscore = data.highscore || 0;
            state.transferHistory = data.transfers || {};
        } else {
            await userRef.set({
                username: state.currentUsername,
                balance: 100,
                highscore: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    } catch (error) {
        console.error("Init error:", error);
        state.coins = 100; // Fallback
    }
}

// Геттеры
export function getCoins() { return state.coins; }
export function getHighscore() { return state.highscore; }
export function getUsername() { return state.currentUsername; }

// Перевод средств
export async function makeTransfer(username, amount) {
    try {
        // Поиск пользователя (без учета регистра)
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(username.toLowerCase())
            .once('value');

        if (!snapshot.exists()) {
            return { success: false, message: 'Пользователь не найден' };
        }

        // Подготовка транзакции
        const [recipientId, recipientData] = Object.entries(snapshot.val())[0];
        const updates = {};
        updates[`users/${state.USER_ID}/balance`] = state.coins - amount;
        updates[`users/${recipientId}/balance`] = (recipientData.balance || 0) + amount;

        // Выполнение
        await db.ref().update(updates);
        state.coins -= amount;
        
        return { success: true, message: `Переведено ${amount} коинов` };
    } catch (error) {
        console.error("Transfer error:", error);
        return { success: false, message: 'Ошибка перевода' };
    }
}
