window.transfersModule = {
    makeTransfer: async function(recipientUsername, amount) {
        try {
            if (!recipientUsername.startsWith('@')) {
                return { success: false, message: 'Username должен начинаться с @' };
            }
            
            if (amount <= 0 || amount > window.userModule.getCoins()) {
                return { success: false, message: 'Неверная сумма' };
            }

            const snapshot = await firebase.database().ref('users')
                .orderByChild('username')
                .equalTo(recipientUsername.toLowerCase())
                .once('value');

            if (!snapshot.exists()) {
                return { success: false, message: 'Пользователь не найден' };
            }

            const [recipientId, recipientData] = Object.entries(snapshot.val())[0];
            const newBalance = window.userModule.getCoins() - amount;
            const transaction = {
                amount: amount,
                date: new Date().toISOString(),
                from: window.userModule.getUsername(),
                to: recipientUsername
            };

            const updates = {};
            updates[`users/${window.userModule.getUserId()}/balance`] = newBalance;
            updates[`users/${recipientId}/balance`] = recipientData.balance + amount;
            updates[`users/${window.userModule.getUserId()}/transfers`] = 
                [...window.userModule.getTransferHistory(), transaction];
            updates[`users/${recipientId}/transfers`] = 
                [...(recipientData.transfers || []), transaction];

            await firebase.database().ref().update(updates);
            
            window.userModule.updateUserState({
                coins: newBalance,
                transferHistory: [...window.userModule.getTransferHistory(), transaction]
            });

            return { success: true, message: `Успешно переведено ${amount} коинов` };

        } catch (error) {
            console.error("Transfer error:", error);
            return { success: false, message: 'Ошибка при переводе' };
        }
    },

    renderTransferHistory: function() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        const history = window.userModule.getTransferHistory()
            .slice(0, 10)
            .map(tx => `
                <div class="history-item ${tx.from === window.userModule.getUsername() ? 'outgoing' : 'incoming'}">
                    <span>${tx.from === window.userModule.getUsername() ? '➡️' : '⬅️'} ${tx.amount}</span>
                    <span>${new Date(tx.date).toLocaleString()}</span>
                </div>`
            ).join('') || '<p>Нет истории переводов</p>';
        
        historyList.innerHTML = history;
    }
};
