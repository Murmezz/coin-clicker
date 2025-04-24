window.userModule = (function() {
    const state = {
        USER_ID: '',
        coins: 0,
        highscore: 0,
        lastSave: 0
    };

    async function saveToDatabase() {
        if (!state.USER_ID) return;
        
        try {
            await firebase.database().ref(`users/${state.USER_ID}`).update({
                balance: state.coins,
                highscore: state.highscore,
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            });
            console.log("Данные сохранены");
        } catch (error) {
            console.error("Ошибка сохранения:", error);
        }
    }

    return {
        initUser: async function() {
            try {
                const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
                state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
                
                const snapshot = await firebase.database().ref(`users/${state.USER_ID}`).once('value');
                state.coins = snapshot.exists() ? (snapshot.val().balance || 100) : 100;
                state.highscore = snapshot.exists() ? (snapshot.val().highscore || 0) : 0;
                
                if (!snapshot.exists()) {
                    await firebase.database().ref(`users/${state.USER_ID}`).set({
                        balance: 100,
                        highscore: 0,
                        createdAt: firebase.database.ServerValue.TIMESTAMP
                    });
                }
            } catch (error) {
                console.error("Ошибка инициализации:", error);
                state.coins = 100;
            }
        },
        
        updateUserState: function(newState) {
            Object.assign(state, newState);
            saveToDatabase();
        },
        
        getCoins: () => state.coins,
        getHighscore: () => state.highscore,
        getUserId: () => state.USER_ID,
        
        makeTransfer: async function(username, amount) {
            try {
                const snapshot = await firebase.database().ref('users')
                    .orderByChild('username')
                    .equalTo(username.toLowerCase())
                    .once('value');
                
                if (!snapshot.exists()) {
                    return { success: false, message: 'Пользователь не найден' };
                }
                
                const [recipientId, recipientData] = Object.entries(snapshot.val())[0];
                const updates = {
                    [`users/${state.USER_ID}/balance`]: state.coins - amount,
                    [`users/${recipientId}/balance`]: (recipientData.balance || 0) + amount
                };
                
                await firebase.database().ref().update(updates);
                this.updateUserState({ coins: state.coins - amount });
                
                return { success: true, message: `Переведено ${amount} коинов` };
            } catch (error) {
                console.error("Ошибка перевода:", error);
                return { success: false, message: 'Ошибка при переводе' };
            }
        }
    };
})();