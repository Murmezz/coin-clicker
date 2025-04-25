window.userModule = (function() {
    // Состояние пользователя
    const state = {
        USER_ID: '',
        currentUsername: '',
        coins: 100,
        highscore: 0,
        transferHistory: []
    };

    // Приватные методы
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

    async function registerUsername(username) {
        const lowercaseUsername = username.toLowerCase();
        await firebase.database().ref(`username_lookup/${lowercaseUsername}`).set(state.USER_ID);
    }

    // Публичные методы
    return {
        async initUser() {
            try {
                // Аутентификация
                await firebase.auth().signInAnonymously();
                
                // Инициализация данных
                const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
                state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
                state.currentUsername = tgUser?.username 
                    ? `@${tgUser.username}` 
                    : `@user_${state.USER_ID.slice(-4)}`;

                // Проверка существующего пользователя
                const userRef = firebase.database().ref(`users/${state.USER_ID}`);
                const snapshot = await userRef.once('value');
                
                if (snapshot.exists()) {
                    // Загрузка существующих данных
                    const data = snapshot.val();
                    state.coins = data.balance || 100;
                    state.highscore = data.highscore || 0;
                    state.transferHistory = data.transfers || [];
                    state.currentUsername = data.username || state.currentUsername;
                } else {
                    // Регистрация нового пользователя
                    await userRef.set({
                        username: state.currentUsername,
                        balance: 100,
                        highscore: 0,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    });
                    await registerUsername(state.currentUsername);
                }
            } catch (error) {
                console.error("Ошибка инициализации:", error);
                // Fallback
                state.USER_ID = `local_${Date.now()}`;
                state.currentUsername = "@guest";
                state.coins = 100;
            }
        },

        async makeTransfer(username, amount) {
            try {
                // Поиск без учета регистра
                const lowercaseUsername = username.toLowerCase();
                const userIdSnapshot = await firebase.database()
                    .ref(`username_lookup/${lowercaseUsername}`)
                    .once('value');
                
                if (!userIdSnapshot.exists()) {
                    return { success: false, message: 'Пользователь не найден' };
                }

                const recipientId = userIdSnapshot.val();
                const recipientData = (await firebase.database()
                    .ref(`users/${recipientId}`)
                    .once('value')).val();

                // Проверка баланса
                if (amount > state.coins || amount <= 0) {
                    return { success: false, message: 'Неверная сумма' };
                }

                // Подготовка транзакции
                const transferId = firebase.database().ref().push().key;
                const transferData = {
                    amount: amount,
                    date: new Date().toISOString(),
                    from: state.currentUsername,
                    to: username
                };

                // Обновления в базе
                const updates = {};
                updates[`users/${state.USER_ID}/balance`] = state.coins - amount;
                updates[`users/${recipientId}/balance`] = (recipientData.balance || 0) + amount;
                updates[`users/${state.USER_ID}/transfers/${transferId}`] = transferData;
                updates[`users/${recipientId}/transfers/${transferId}`] = transferData;

                // Выполнение транзакции
                await firebase.database().ref().update(updates);
                
                // Обновление состояния
                state.coins -= amount;
                state.transferHistory = {
                    ...state.transferHistory,
                    [transferId]: transferData
                };
                
                return { success: true, message: `Переведено ${amount} коинов` };
            } catch (error) {
                console.error("Ошибка перевода:", error);
                return { success: false, message: 'Ошибка при переводе' };
            }
        },

        // Геттеры
        getUserId: () => state.USER_ID,
        getUsername: () => state.currentUsername,
        getCoins: () => state.coins,
        getHighscore: () => state.highscore,
        getTransferHistory: () => ({...state.transferHistory}),

        // Обновление состояния
        updateUserState(newState) {
            Object.assign(state, newState);
            saveToDatabase();
        }
    };
})();