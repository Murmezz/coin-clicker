import { db } from './firebase.js';
import { getUserId, getUsername, getCoins, getTransferHistory, updateUserState } from './user.js';
import { updateDisplays } from './ui.js';

export async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    try {
        const searchUsername = username.toLowerCase();
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(searchUsername)
            .once('value');
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            const userId = Object.keys(users)[0];
            return { 
                userId,
                username: users[userId].username,
                balance: users[userId].balance || 0,
                transfers: users[userId].transfers || []
            };
        }
        return null;
    } catch (error) {
        console.error('Ошибка поиска:', error);
        return null;
    }
}

export async function makeTransfer(recipientUsername, amount) {
    try {
        const currentUsername = getUsername();
        const coins = getCoins();
        const USER_ID = getUserId();
        const transferHistory = getTransferHistory();

        // Проверки
        if (recipientUsername.toLowerCase() === currentUsername.toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        
        const recipient = await findUser(recipientUsername);
        if (!recipient) {
            return { success: false, message: 'Пользователь не зарегистрирован' };
        }
        
        if (amount > coins || amount < 1) {
            return { success: false, message: 'Некорректная сумма' };
        }

        const transaction = {
            date: new Date().toISOString(),
            from: currentUsername,
            to: recipientUsername,
            amount: amount,
            status: 'completed'
        };

        const updates = {};
        updates[`users/${USER_ID}/balance`] = coins - amount;
        updates[`users/${USER_ID}/transfers`] = [...transferHistory, transaction];
        updates[`users/${recipient.userId}/balance`] = (recipient.balance || 0) + amount;
        updates[`users/${recipient.userId}/transfers`] = [...(recipient.transfers || []), transaction];

        await db.ref().update(updates);

        updateUserState({
            coins: coins - amount,
            transferHistory: [...transferHistory, transaction]
        });
        
        updateDisplays();

        return { success: true, message: `Перевод ${amount} коинов успешен!` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка при переводе' };
    }
}

export function renderTransferHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const transferHistory = getTransferHistory();
    
    historyList.innerHTML = transferHistory.length === 0 
        ? '<p>Нет истории переводов</p>'
        : transferHistory.slice(0, 10).map(tx => `
            <div class="history-item ${tx.status}">
                <div>
                    <span class="history-username">${tx.to}</span>
                    <span class="history-date">${new Date(tx.date).toLocaleString()}</span>
                </div>
                <span class="history-amount">-${tx.amount}</span>
            </div>
        `).join('');
}
