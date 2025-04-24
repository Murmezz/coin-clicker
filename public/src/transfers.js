import { db } from './firebase.js';
import { getUserId, getUsername, getCoins, getTransferHistory, updateUserState } from './user.js';

// Добавьте этот экспорт
export function renderTransferHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const transferHistory = getTransferHistory();
    
    historyList.innerHTML = transferHistory.length === 0 
        ? '<p class="empty-history">Нет истории переводов</p>'
        : transferHistory.slice(0, 10).map(tx => `
            <div class="history-item ${tx.from === getUsername() ? 'outgoing' : 'incoming'}">
                <div class="history-info">
                    <span class="history-direction-icon">
                        ${tx.from === getUsername() ? '➡️' : '⬅️'}
                    </span>
                    <div>
                        <span class="history-username">
                            ${tx.from === getUsername() ? tx.to : tx.from}
                        </span>
                        <span class="history-date">
                            ${new Date(tx.date).toLocaleString()}
                        </span>
                    </div>
                </div>
                <span class="history-amount ${tx.from === getUsername() ? 'outgoing' : 'incoming'}">
                    ${tx.from === getUsername() ? '-' : '+'}${tx.amount}
                </span>
            </div>
        `).join('');
}

// Остальные функции (findUser, makeTransfer) остаются без изменений

export async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    try {
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(username.toLowerCase())
            .once('value');
        
        if (!snapshot.exists() || snapshot.numChildren() > 1) {
            return null; // Не нашли или дубликат
        }

        const [userId, userData] = Object.entries(snapshot.val())[0];
        return { 
            userId,
            username: userData.username,
            balance: userData.balance || 0
        };
    } catch (error) {
        console.error('Ошибка поиска:', error);
        return null;
    }
}

export async function makeTransfer(recipientUsername, amount) {
    try {
        // Проверка на дубликаты username
        const recipient = await findUser(recipientUsername);
        if (!recipient) {
            return { 
                success: false, 
                message: 'Аккаунт не найден или дублирован' 
            };
        }
        
        // Остальные проверки
        if (recipientUsername.toLowerCase() === getUsername().toLowerCase()) {
            return { success: false, message: 'Нельзя перевести себе' };
        }
        
        if (amount > getCoins() || amount < 1) {
            return { success: false, message: 'Некорректная сумма' };
        }

        // Транзакция
        const updates = {};
        const newBalance = getCoins() - amount;
        
        updates[`users/${getUserId()}/balance`] = newBalance;
        updates[`users/${recipient.userId}/balance`] = (recipient.balance || 0) + amount;
        
        await db.ref().update(updates);
        updateUserState({ coins: newBalance });
        
        return { success: true, message: `Перевод ${amount} коинов успешен!` };
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return { success: false, message: 'Ошибка при переводе' };
    }
}