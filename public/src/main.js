// main.js
function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            
            switch(page) {
                case 'transfer':
                    window.uiModule.showTransferPage();
                    break;
                case 'top':
                    window.uiModule.showSimplePage('Топ игроков');
                    break;
                case 'shop':
                    window.uiModule.showSimplePage('Магазин');
                    break;
                case 'games':
                    window.uiModule.showSimplePage('Игры');
                    break;
                case 'referrals':
                    window.uiModule.showSimplePage('Рефералы');
                    break;
                default:
                    window.uiModule.showSimplePage(this.textContent);
            }
        });
    });
}

async function initializeApp() {
    await window.userModule.initUser();
    setupNavigation();
    window.uiModule.updateDisplays();
    
    document.querySelector('.coin-button').addEventListener('click', () => {
        const newCoins = window.userModule.getCoins() + 1;
        window.userModule.updateUserState({
            coins: newCoins,
            highscore: Math.max(window.userModule.getHighscore(), newCoins)
        });
        window.uiModule.updateDisplays();
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);