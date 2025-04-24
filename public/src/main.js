// Инициализация приложения
async function initializeApp() {
    try {
        await user.initUser();
        await user.loadData();
        
        // Обработчики событий
        document.querySelector('.coin-button').addEventListener('click', handleCoinClick);
        
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    ui.showTransferPage();
                } else {
                    ui.showSimplePage(btn.textContent);
                }
            });
        });
        
        ui.updateDisplays();
    } catch (error) {
        console.error("Initialize error:", error);
    }
}

// Обработчик клика по монете
function handleCoinClick() {
    const newCoins = user.getCoins() + 1;
    const newHighscore = Math.max(user.getHighscore(), newCoins);
    
    user.updateUserState({
        coins: newCoins,
        highscore: newHighscore
    });
    
    ui.updateDisplays();
    
    // Анимация
    const coin = document.querySelector('.coin-button');
    coin.style.transform = 'scale(0.9)';
    setTimeout(() => coin.style.transform = 'scale(1)', 100);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initializeApp);
