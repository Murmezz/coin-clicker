import { db } from './firebase.js';
import { getUserId, getUsername, getCoins, getTransferHistory, updateUserState } from './user.js';

export async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    const snapshot = await db.ref('users')
        .orderByChild('username')
        .equalTo(username.toLowerCase())
        .once('value');
    
    return snapshot.exists() ? Object.entries(snapshot.val())[0][1] : null;
}

export async function makeTransfer(recipientUsername, amount) {
    try {
        const recipient = await findUser(recipientUsername);
        if (!recipient) return { success: false, message: 'Пользователь не найден' };

        const updates = {};
        const newBalance = getCoins() - amount;
        
        updates[`users/${getUserId()}/balance`] = newBalance;
        updates[`users/${recipient.userId}/balance`] = recipient.balance + amount;
        
        await db.ref().update(updates);
        updateUserState({ coins: newBalance });
        
        return { success: true, message: `Переведено ${amount} коинов` };
    } catch (error) {
        console.error("Transfer error:", error);
        return { success: false, message: 'Ошибка перевода' };
    }
}

export function renderTransferHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    historyList.innerHTML = getTransferHistory()
        .slice(0, 10)
        .map(tx => `
            <div class="history-item ${tx.from === getUsername() ? 'outgoing' : 'incoming'}">
                <span>${tx.from === getUsername() ? '➡️' : '⬅️'} ${tx.amount}</span>
                <span>${new Date(tx.date).toLocaleString()}</span>
            </div>`
        ).join('') || '<p>Нет истории</p>';
}