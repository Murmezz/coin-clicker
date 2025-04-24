const transfers = {
    findUser: async function(username) {
        if (!username.startsWith('@')) return null;
        
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(username.toLowerCase())
            .once('value');
        
        return snapshot.exists() ? Object.entries(snapshot.val())[0][1] : null;
    },

    makeTransfer: async function(recipientUsername, amount) {
        try {
            const recipient = await this.findUser(recipientUsername);
            if (!recipient) return { success: false, message: 'Пользователь не найден' };

            const updates = {};
            const newBalance = user.getCoins() - amount;
            
            updates[`users/${user.getUserId()}/balance`] = newBalance;
            updates[`users/${recipient.userId}/balance`] = recipient.balance + amount;
            
            await db.ref().update(updates);
            user.updateUserState({ coins: newBalance });
            
            return { success: true, message: `Переведено ${amount} коинов` };
        } catch (error) {
            console.error("Transfer error:", error);
            return { success: false, message: 'Ошибка перевода' };
        }
    },

    renderTransferHistory: function() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        historyList.innerHTML = user.getTransferHistory()
            .slice(0, 10)
            .map(tx => `
                <div class="history-item ${tx.from === user.getUsername() ? 'outgoing' : 'incoming'}">
                    <span>${tx.from === user.getUsername() ? '➡️' : '⬅️'} ${tx.amount}</span>
                    <span>${new Date(tx.date).toLocaleString()}</span>
                </div>`
            ).join('') || '<p>Нет истории</p>';
    }
};

window.transfers = transfers;
