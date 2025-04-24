window.userModule = {
    USER_ID: '',
    coins: 100,
    highscore: 0,

    async initUser() {
        try {
            // Авторизация
            await firebase.auth().signInAnonymously();
            
            // Создаем ID пользователя
            const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
            this.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Date.now()}`;
            
            // Загружаем данные
            const snapshot = await firebase.database()
                .ref(`users/${this.USER_ID}`)
                .once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                this.coins = data.balance || 100;
                this.highscore = data.highscore || 0;
            } else {
                // Создаем нового пользователя
                await firebase.database().ref(`users/${this.USER_ID}`).set({
                    balance: 100,
                    highscore: 0,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            }
        } catch (error) {
            console.error("Ошибка инициализации:", error);
            this.coins = 100; // Значение по умолчанию
        }
    },

    getCoins() {
        return this.coins;
    },

    getHighscore() {
        return this.highscore;
    }
};