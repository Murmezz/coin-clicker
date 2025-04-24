document.addEventListener('DOMContentLoaded', async function() {
    // 1. Инициализация пользователя
    await window.userModule.initUser();
    
    // 2. Находим все элементы
    const coinButton = document.querySelector('.coin-button');
    const pagesContainer = document.getElementById('pages-container');
    const navButtons = document.querySelectorAll('.nav-button');
    
    // 3. Проверяем существование элементов
    if (!coinButton || !pagesContainer || navButtons.length === 0) {
        console.error("Критические элементы не найдены!");
        return;
    }
    
    // 4. Вешаем обработчики
    coinButton.addEventListener('click', function() {
        const newCoins = window.userModule.getCoins() + 1;
        window.userModule.updateUserState({
            coins: newCoins,
            highscore: Math.max(window.userModule.getHighscore(), newCoins)
        });
        window.uiModule.updateDisplays();
    });
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            switch(page) {
                case 'transfer':
                    window.uiModule.showTransferPage();
                    break;
                default:
                    window.uiModule.showSimplePage(this.textContent);
            }
        });
    });
    
    // 5. Первичное обновление интерфейса
    window.uiModule.updateDisplays();
    console.log("Приложение инициализировано");
});