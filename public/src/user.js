// Используем глобальные объекты Firebase
const db = window.firebaseDb;
const auth = window.firebaseAuth;

const state = {
    USER_ID: '',
    currentUsername: '',
    coins: 0,
    highscore: 0,
    transferHistory: []
};

function getUserId() { return state.USER_ID; }
function getUsername() { return state.currentUsername; }
function getCoins() { return state.coins; }
function getHighscore() { return state.highscore; }
function getTransferHistory() { return [...state.transferHistory]; }

function updateUserState(newState) {
    Object.assign(state, newState);
}

async function initUser() {
    try {
        await new Promise((resolve) => {
            auth.onAuthStateChanged(user => resolve(user));
        });

        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
        state.USER_ID = `tg_${tgUser.id || 'guest_' + Math.random().toString(36).substr(2, 8)}`;
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
        state.USER_ID = `local_${Math.random().toString(36).slice(2, 9)}`;
        state.currentUsername = '@guest';
    }
}

async function loadData() {
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

// Делаем функции доступными глобально
window.userModule = {
    getUserId,
    getUsername,
    getCoins,
    getHighscore,
    getTransferHistory,
    initUser,
    loadData,
    updateUserState
};
