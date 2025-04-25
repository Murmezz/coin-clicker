// user.js
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js";
import { getDatabase, ref, set, update, push, onValue, once } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database-compat.js";

const state = {
    USER_ID: '',
    currentUsername: '',
    coins: 100,
    highscore: 0,
    transferHistory: {}
};

let auth, db;

export async function initUser(firebaseApp) {
    try {
        auth = getAuth(firebaseApp);
        db = getDatabase(firebaseApp);
        
        await signInAnonymously(auth);
        
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
        state.currentUsername = tgUser?.username 
            ? `@${tgUser.username}` 
            : `@user_${state.USER_ID.slice(-4)}`;

        const userRef = ref(db, `users/${state.USER_ID}`);
        const snapshot = await once(userRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            state.coins = data.balance || 100;
            state.highscore = data.highscore || 0;
            state.transferHistory = data.transfers || {};
        } else {
            await set(userRef, {
                username: state.currentUsername,
                balance: 100,
                highscore: 0,
                createdAt: Date.now()
            });
        }
    } catch (error) {
        console.error("Init error:", error);
        state.coins = 100;
    }
}

export function getCoins() {
    return state.coins;
}

export function getHighscore() {
    return state.highscore;
}

export function getUsername() {
    return state.currentUsername;
}

export async function makeTransfer(username, amount) {
    try {
        const lowercaseUsername = username.toLowerCase();
        const usernameRef = ref(db, `username_lookup/${lowercaseUsername}`);
        const usernameSnap = await once(usernameRef);
        
        if (!usernameSnap.exists()) {
            return { success: false, message: 'User not found' };
        }

        const updates = {};
        updates[`users/${state.USER_ID}/balance`] = state.coins - amount;
        updates[`users/${usernameSnap.val()}/balance`] = (await getCoins(usernameSnap.val())) + amount;
        
        await update(ref(db), updates);
        state.coins -= amount;
        
        return { success: true, message: `Sent ${amount} coins` };
    } catch (error) {
        console.error("Transfer error:", error);
        return { success: false, message: error.message };
    }
}
