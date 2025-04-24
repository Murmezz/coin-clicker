window.userModule = (function() {
    const state = {
        USER_ID: '',
        currentUsername: '',
        coins: 100,
        highscore: 0,
        transferHistory: []
    };

    async function saveToDatabase() {
        try {
            await firebase.database().ref(`users/${state.USER_ID}`).update({
                balance: state.coins,
                highscore: state.highscore,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error("Ошибка сохранения:", error);
        }
    }

    return {
        initUser: async function() {
            try {
                // Добавляем анонимную аутентификацию
                await firebase.auth().signInAnonymously();
                
                const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
                state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
                state.currentUsername = tgUser?.username 
                    ? `@${tgUser.username}` 
                    : `@user_${state.USER_ID.slice(-4)}`;

                const userRef = firebase.database().ref(`users/${state.USER_ID}`);
                const snapshot = await userRef.once('value');
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    state.coins = data.balance || 100;
                    state.highscore = data.highscore || 0;
                    state.transferHistory = data.transfers || [];
                } else {
                    await userRef.set({
                        username: state.currentUsername,
                        balance: 100,
                        highscore: 0,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    });
                }
            } catch (error) {
                console.error("Ошибка инициализации:", error);
                state.USER_ID = `local_${Date.now()}`;
                state.currentUsername = "@guest";
                state.coins = 100;
            }
        },

        updateUserState: function(newState) {
            Object.assign(state, newState);
            saveToDatabase();
        },

        getUserId: () => state.USER_ID,
        getUsername: () => state.currentUsername,
        getCoins: () => state.coins,
        getHighscore: () => state.highscore,
        getTransferHistory: () => [...state.transferHistory],

        makeTransfer: async function(username, amount) {
    try {
        // 1. Проверяем аутентификацию
        if (!firebase.auth().currentUser) {
            await firebase.auth().signInAnonymously();
        }

        // 2. Поиск получателя
        const snapshot = await firebase.database()
            .ref('users')
            .orderByChild('username')
            .equalTo(username.toLowerCase())
            .once('value');

        if (!snapshot.exists()) {
            return { success: false, message: 'Пользователь не найден' };
        }

        // 3. Подготовка данных перевода
        const [recipientId, recipientData] = Object.entries(snapshot.val())[0];
        const transferId = firebase.database().ref().push().key;
        const transferData = {
            amount: amount,
            date: new Date().toISOString(),
            from: this.getUsername(),
            to: username
        };

        // 4. Формируем обновления
        const updates = {};
        updates[`users/${this.getUserId()}/balance`] = this.getCoins() - amount;
        updates[`users/${recipientId}/balance`] = (recipientData.balance || 0) + amount;
        updates[`users/${this.getUserId()}/transfers/${transferId}`] = transferData;
        updates[`users/${recipientId}/transfers/${transferId}`] = transferData;

        // 5. Выполняем запрос
        await firebase.database().ref().update(updates);
        
        // 6. Обновляем локальное состояние
        this.updateUserState({
            coins: this.getCoins() - amount,
            transferHistory: {
                ...this.getTransferHistory(),
                [transferId]: transferData
            }
        });

        return { success: true, message: `Переведено ${amount} коинов` };
    } catch (error) {
        console.error("Ошибка перевода:", error);
        return { success: false, message: 'Ошибка при переводе' };
    }
}