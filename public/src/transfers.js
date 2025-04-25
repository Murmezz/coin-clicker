import { db } from './firebase.js';
import { getUserId, getUsername, getCoins, getTransferHistory, updateUserState } from './user.js';
import { updateDisplays } from './ui.js';

export async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    try {
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(username.toLowerCase())
            .once('value');

        if (snapshot.exists()) {
            const userData = Object.values(snapshot.val())[0];
            return {
                userId: Object.keys(snapshot.val())[0],
                username: userData.username,
                balance: userData.balance || 0,
                transfers: userData.transfers || []
            };
        }
        return null;
    } catch (error) {
        console.error('Search error:', error);
        return null;
    }
}

// ... остальной код transfers.js без изменений ...

export async function makeTransfer(recipientUsername, amount) {
    try {
        const currentUsername = getUsername();
        const coins = getCoins();
        const USER_ID = getUserId();
        const recipient = await findUser(recipientUsername);

        // Проверки
        if (recipientUsername.toLowerCase() === currentUsername.toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        if (!recipient) {
            return { success: false, message: 'Пользователь не найден' };
        }
        if (amount > coins || amount < 1) {
            return { success: false, message: 'Некорректная сумма' };
        }

        // Создаем транзакцию
        const transaction = {
            date: new Date().toISOString(),
            from: currentUsername,
            to: recipientUsername,
            amount: amount,
            status: 'completed'
        };

        // Обновляем данные
        await db.ref(`users/${USER_ID}`).update({
            balance: coins - amount,
            transfers: [...getTransferHistory(), transaction]
        });

        await db.ref(`users/${recipient.userId}`).update({
            balance: (recipient.balance || 0) + amount,
            transfers: [...(recipient.transfers || []), transaction]
        });

        updateUserState({
            coins: coins - amount,
            transferHistory: [...getTransferHistory(), transaction]
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
            <div class="history-item">
                <span class="history-username">${tx.to}</span>
                <span class="history-amount">-${tx.amount}</span>
                <span class="history-date">${new Date(tx.date).toLocaleString()}</span>
            </div>
        `).join('');
}
