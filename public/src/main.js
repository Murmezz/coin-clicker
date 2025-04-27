import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays, getElement, showMessage } from './ui.js';
import { db } from './firebase.js';
import { initCoinGame } from './coinGame.js';

async function handleCoinClick() {
    try {
        const currentCoins = getCoins();
        const currentHighscore = getHighscore();
        const newCoins = currentCoins + 1;
        const newHighscore = Math.max(currentHighscore, newCoins);
        
        await db.ref(`users/${getUserId()}`).update({ 
            balance: newCoins, 
            highscore: newHighscore 
        });
        
        updateUserState({
            coins: newCoins,
            highscore: newHighscore
        });
        
        updateDisplays();
    } catch (error) {
        console.error('Ошибка при клике:', error);
    }
}

function showSimplePage(title) {
    const pagesContainer = getElement('pages-container');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">←</button>
                <h2 class="page-title">${title}</h2>
            </div>
            <div class="page-content">
                <p>Раздел в разработке</p>
            </div>
        </div>
    `;
    pagesContainer.style.display = 'block';
    
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
}

async function initializeApp() {
    try {
        await initUser();
        await loadData();
        updateDisplays();

        // Обработчик основной монеты
        const coinButton = document.querySelector('.coin-button');
        if (coinButton) {
            coinButton.addEventListener('click', handleCoinClick);
        }

        // Обработчик кнопок навигации
        document.querySelectorAll('.nav-button').forEach(btn => {
            // Проверяем, что кнопка существует и имеет атрибут data-page
            if (!btn || !btn.dataset.page) {
                console.error('Некорректная кнопка:', btn);
                return;
            }

            btn.addEventListener('click', function() {
                // Проверяем, какая кнопка была нажата
                switch(this.dataset.page) {
                    case 'transfer':
                        showTransferPage();
                        break;
                    case 'games':
                        // Дополнительная проверка перед запуском игры
                        if (typeof initCoinGame === 'function') {
                            initCoinGame();
                        } else {
                            console.error('Функция initCoinGame не найдена');
                            showMessage('Ошибка загрузки игры', 'error');
                        }
                        break;
                    default:
                        showSimplePage(this.textContent);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showMessage('Произошла ошибка при загрузке', 'error');
    }
}

// Явная проверка перед запуском приложения
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
