import { auth, db } from './firebase.js';

export let USER_ID = '';
export let currentUsername = '';
export let coins = 0;
export let highscore = 0;
export let transferHistory = [];

export async function initUser() {
    try {
        const { user } = await auth.signInAnonymously();
        USER_ID = user.uid;

        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            currentUsername = tgUser.username ? `@${tgUser.username.toLowerCase()}` : `@user${tgUser.id.slice(-4)}`;
        } else {
            currentUsername = `@user_${Math.random().toString(36).substr(2, 8)}`;
        }

        await db.ref(`users/${USER_ID}`).update({
            username: currentUsername,
            balance: firebase.database.ServerValue.increment(0),
            highscore: firebase.database.ServerValue.increment(0)
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        USER_ID = `local_${Math.random().toString(36).substr(2, 9)}`;
        currentUsername = `@guest_${Math.random().toString(36).substr(2, 5)}`;
    }
}

export async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${USER_ID}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                coins = data.balance || 0;
                highscore = data.highscore || 0;
                transferHistory = data.transfers || [];
            }
            resolve();
        });
    });
}