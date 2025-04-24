// user.js - Полная версия с автоматическим сохранением
const userModule = (function() {
    // Приватное состояние
    const state = {
        USER_ID: '',
        currentUsername: '',
        coins: 100,
        highscore: 0,
        transferHistory: [],
        lastSave: 0
    };

    // Приватные методы
    async function saveToDatabase() {
        try {
            // Оптимизация: сохраняем не чаще чем раз в 2 секунды
            const now = Date.now();
            if (now - state.lastSave < 2000) return;
            
            await firebase.database().ref(`users/${state.USER_ID}`).update({
                username: state.currentUsername,
                balance: state.coins,
                highscore: state.highscore,
                transfers: state.transferHistory,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
            state.lastSave = now;
            console.log("Данные сохранены в Firebase");
        } catch (error) {
            console.error("Ошибка сохранения:", error);
        }
    }

    // Публичные методы
    return {
        initUser: async function() {
            try {
                const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
                state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
                state.currentUsername = tgUser?.username 
                    ? `@${tgUser.username}` 
                    : `@user_${state.USER_ID.slice(-4)}`;

                // Загружаем или создаем запись
                const userRef = firebase.database().ref(`users/${state.USER_ID}`);
                const snapshot = await userRef.once('value');
                
                if (!snapshot.exists()) {
                    await userRef.set({
                        username: state.currentUsername,
                        balance: 100,
                        highscore: 0,
                        transfers: [],
                        telegramId: tgUser?.id || null,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    });
                } else {
                    const data = snapshot.val();
                    state.coins = data.balance || 100;
                    state.highscore = data.highscore || 0;
                    state.transferHistory = data.transfers || [];
                }

                console.log("Пользователь инициализирован:", state.USER_ID);
            } catch (error) {
                console.error("Ошибка инициализации:", error);
                // Fallback
                state.USER_ID = `local_${Date.now()}`;
                state.currentUsername = "@guest";
                state.coins = 100;
            }
        },

        updateUserState: function(newState) {
            Object.assign(state, newState);
            saveToDatabase(); // Автосохранение при любом изменении
        },

        // Геттеры
        getUserId: () => state.USER_ID,
        getUsername: () => state.currentUsername,
        getCoins: () => state.coins,
        getHighscore: () => state.highscore,
        getTransferHistory: () => [...state.transferHistory],

        // Специальные методы
        addCoins: function(amount) {
            if (amount <= 0) return;
            const newCoins = state.coins + amount;
            this.updateUserState({
                coins: newCoins,
                highscore: Math.max(state.highscore, newCoins)
            });
        },

        makeTransfer: async function(recipientUsername, amount) {
            if (amount <= 0 || amount > state.coins) {
                return { success: false, message: 'Неверная сумма' };
            }

            try {
                // Поиск получателя
                const snapshot = await firebase.database().ref('users')
                    .orderByChild('username')
                    .equalTo(recipientUsername.toLowerCase())
                    .once('value');

                if (!snapshot.exists()) {
                    return { success: false, message: 'Пользователь не найден' };
                }

                const [recipientId, recipientData] = Object.entries(snapshot.val())[0];
                const transaction = {
                    amount: amount,
                    date: new Date().toISOString(),
                    from: state.currentUsername,
                    to: recipientUsername
                };

                // Обновление данных
                const updates = {};
                updates[`users/${state.USER_ID}/balance`] = state.coins - amount;
                updates[`users/${recipientId}/balance`] = (recipientData.balance || 0) + amount;
                updates[`users/${state.USER_ID}/transfers`] = [...state.transferHistory, transaction];
                updates[`users/${recipientId}/transfers`] = [...(recipientData.transfers || []), transaction];

                await firebase.database().ref().update(updates);
                
                // Обновление состояния
                this.updateUserState({
                    coins: state.coins - amount,
                    transferHistory: [...state.transferHistory, transaction]
                });

                return { success: true, message: `Переведено ${amount} коинов` };
            } catch (error) {
                console.error("Ошибка перевода:", error);
                return { success: false, message: 'Ошибка при переводе' };
            }
        }
    };
})();

// Делаем доступным глобально
window.userModule = userModule;