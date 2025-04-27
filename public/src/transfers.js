// Убираем повторное объявление db, используем глобальный объект

async function findUser(username) {
    if (!username.startsWith('@')) return null;
    
    try {
        const snapshot = await firebase.database().ref('users')
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

async function makeTransfer(recipientUsername, amount) {
    try {
        const currentUsername = getUsername();
        const coins = getCoins();
        const USER_ID = getUserId();
        const transferHistory = getTransferHistory();

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

        await firebase.database().ref().update(updates);

        updateUserState({
            coins: coins - amount,
            transferHistory: [...transferHistory, transaction]
        });
        
        updateDisplays();

        return { success: true, message: `Перевод ${amount} коинов успешен!` };
    } catch (error) {
        console.error('Transfer error:', error);
        return { success: false, message: 'Ошибка при переводе' };
    }
}

function renderTransferHistory() {
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
