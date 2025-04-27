// Используем глобальные объекты Firebase
const db = firebase.database();
const auth = firebase.auth();

const userState = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

function getUserId() { return userState.USER_ID; }
function getUsername() { return userState.currentUsername; }
function getCoins() { return userState.coins; }
function getHighscore() { return userState.highscore; }
function getTransferHistory() { return [...userState.transferHistory]; }

function updateUserState(newState) {
    Object.assign(userState, newState);
}

async function initUser() {
    try {
        await new Promise((resolve) => {
            auth.onAuthStateChanged(user => resolve(user));
        });

        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
        userState.USER_ID = `tg_${tgUser.id || 'guest_' + Math.random().toString(36).substr(2, 8)}`;
        userState.currentUsername = tgUser.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${userState.USER_ID.slice(-4)}`;

        await db.ref(`users/${userState.USER_ID}`).update({
            username: userState.currentUsername,
            balance: 0,
            highscore: 0,
            transfers: []
        });

        await loadData();
    } catch (error) {
        console.error('Init error:', error);
        userState.USER_ID = `local_${Math.random().toString(36).slice(2, 9)}`;
        userState.currentUsername = '@guest';
    }
}

async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${userState.USER_ID}`).on('value', (snapshot) => {
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
