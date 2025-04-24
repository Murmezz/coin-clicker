window.transfersModule = {
    async makeTransfer(username, amount) {
        if (!username.startsWith('@')) {
            throw new Error("Имя должно начинаться с @");
        }
        
        if (amount > window.userModule.coins) {
            throw new Error("Недостаточно средств");
        }
        
        // Поиск получателя
        const snapshot = await firebase.database()
            .ref('users')
            .orderByChild('username')
            .equalTo(username.toLowerCase())
            .once('value');
        
        if (!snapshot.exists()) {
            throw new Error("Пользователь не найден");
        }
        
        // Обновляем балансы
        const [recipientId, recipientData] = Object.entries(snapshot.val())[0];
        await firebase.database().ref().update({
            [`users/${window.userModule.USER_ID}/balance`]: window.userModule.coins - amount,
            [`users/${recipientId}/balance`]: (recipientData.balance || 0) + amount
        });
        
        // Обновляем локальные данные
        window.userModule.coins -= amount;
        document.getElementById('coins').textContent = window.userModule.coins;
    }
};