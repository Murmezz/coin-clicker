import { db } from './firebase.js';
import { getUserId, getCoins, updateUserState, getTransferHistory } from './user.js';

export async function sendCoins(recipientUsername, amount) {
    try {
        const senderUserId = getUserId();
        const currentBalance = getCoins();
        
        if (!senderUserId) {
            throw new Error('User not authenticated');
        }

        amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount');
        }

        if (amount > currentBalance) {
            throw new Error('Insufficient balance');
        }

        const usersRef = db.ref('users');
        const recipientSnapshot = await usersRef
            .orderByChild('username')
            .equalTo(recipientUsername.replace('@', ''))
            .once('value');

        if (!recipientSnapshot.exists()) {
            throw new Error('Recipient not found');
        }

        const recipientData = Object.values(recipientSnapshot.val())[0];
        const recipientId = recipientData.telegramId;

        if (recipientId === senderUserId) {
            throw new Error('Cannot send coins to yourself');
        }

        const transferRef = db.ref('transfers').push();
        const transferData = {
            senderId: senderUserId,
            recipientId: recipientId,
            amount: amount,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        const updates = {};
        updates[`users/${senderUserId}/balance`] = currentBalance - amount;
        updates[`users/${recipientId}/balance`] = (recipientData.balance || 0) + amount;
        updates[`transfers/${transferRef.key}`] = transferData;

        await db.ref().update(updates);

        return true;
    } catch (error) {
        console.error('Error sending coins:', error);
        throw error;
    }
}

export async function updateTransferHistory() {
    try {
        const history = await getTransferHistory();
        const historyList = document.getElementById('history-list');
        
        if (!historyList) return;

        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">История переводов пуста</div>';
            return;
        }

        history.forEach(transfer => {
            const isOutgoing = transfer.senderId === getUserId();
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${isOutgoing ? 'outgoing' : 'incoming'}`;
            
            historyItem.innerHTML = `
                <div class="history-info">
                    <span class="history-direction-icon">${isOutgoing ? '↑' : '↓'}</span>
                    <div>
                        <span class="history-username">${isOutgoing ? 'Отправлено' : 'Получено'}</span>
                        <span class="history-date">${new Date(transfer.timestamp).toLocaleString()}</span>
                    </div>
                </div>
                <span class="history-amount ${isOutgoing ? 'outgoing' : 'incoming'}">
                    ${isOutgoing ? '-' : '+'}${transfer.amount}
                </span>
            `;
            
            historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error updating transfer history:', error);
    }
}
