async function makeTransfer(recipientUsername, amount) {
    try {
        // Проверка ввода
        if (!recipientUsername.startsWith('@')) {
            return { success: false, message: 'Username должен начинаться с @' };
        }
        
        if (amount <= 0 || amount > user.getCoins()) {
            return { success: false, message: 'Неверная сумма' };
        }

        // Поиск получателя
        const snapshot = await db.ref('users')
            .orderByChild('username')
            .equalTo(recipientUsername.toLowerCase())
            .once('value');

        if (!snapshot.exists()) {
            return { success: false, message: 'Пользователь не найден' };
        }

        const [recipientId, recipientData] = Object.entries(snapshot.val())[0];

        // Подготовка транзакции
        const updates = {};
        const newBalance = user.getCoins() - amount;
        const transaction = {
            amount: amount,
            date: new Date().toISOString(),
            from: user.getUsername(),
            to: recipientUsername
        };

        // Обновление балансов
        updates[`users/${user.getUserId()}/balance`] = newBalance;
        updates[`users/${recipientId}/balance`] = recipientData.balance + amount;
        
        // Добавление в историю
        updates[`users/${user.getUserId()}/transfers`] = [...user.getTransferHistory(), transaction];
        updates[`users/${recipientId}/transfers`] = [...(recipientData.transfers || []), transaction];

        // Выполнение транзакции
        await db.ref().update(updates);
        
        // Обновление состояния
        user.updateUserState({
            coins: newBalance,
            transferHistory: [...user.getTransferHistory(), transaction]
        });

        return { success: true, message: `Успешно переведено ${amount} коинов` };

    } catch (error) {
        console.error("Transfer error:", error);
        return { success: false, message: 'Ошибка при переводе' };
    }
}

window.transfers = {
    makeTransfer,
    renderTransferHistory: function() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        const history = user.getTransferHistory().slice(0, 10).map(tx => `
            <div class="history-item ${tx.from === user.getUsername() ? 'outgoing' : 'incoming'}">
                <span>${tx.from === user.getUsername() ? '➡️' : '⬅️'} ${tx.amount}</span>
                <span>${new Date(tx.date).toLocaleString()}</span>
            </div>
        `).join('') || '<p>Нет истории переводов</p>';
        
        historyList.innerHTML = history;
    }
};
