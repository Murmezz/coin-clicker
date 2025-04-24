async function initializeApp() {
    try {
        // Используем window.userModule вместо user
        await window.userModule.initUser();
        console.log("User initialized:", window.userModule.getUserId());
        
        // Обработчики событий
        document.querySelector('.coin-button')?.addEventListener('click', () => {
            const newCoins = window.userModule.getCoins() + 1;
            window.userModule.updateUserState({
                coins: newCoins,
                highscore: Math.max(window.userModule.getHighscore(), newCoins)
            });
            window.uiModule.updateDisplays();
        });
        
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    window.uiModule.showTransferPage();
                } else {
                    window.uiModule.showSimplePage(btn.textContent);
                }
            });
        });
        
        window.uiModule.updateDisplays();
        
    } catch (error) {
        console.error("Initialize error:", error);
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initializeApp);
