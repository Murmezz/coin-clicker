document.addEventListener('DOMContentLoaded', async () => {
    // Инициализация пользователя
    await window.userModule.initUser();
    
    // Обновляем отображение баланса
    document.getElementById('coins').textContent = window.userModule.getCoins();
    document.getElementById('highscore').textContent = window.userModule.getHighscore();
    
    // Обработчик клика по монете
    document.querySelector('.coin-button').addEventListener('click', () => {
        const newCoins = window.userModule.coins + 1;
        window.userModule.coins = newCoins;
        window.userModule.highscore = Math.max(window.userModule.highscore, newCoins);
        
        // Сохраняем и обновляем
        firebase.database().ref(`users/${window.userModule.USER_ID}`).update({
            balance: newCoins,
            highscore: window.userModule.highscore
        });
        
        document.getElementById('coins').textContent = newCoins;
        document.getElementById('highscore').textContent = window.userModule.highscore;
    });
    
    // Обработчики кнопок
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.page === 'transfer') {
                window.uiModule.showTransferPage();
            } else {
                alert(`${this.textContent} - раздел в разработке`);
            }
        });
    });
});