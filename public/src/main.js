import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays, getElement } from './ui.js';
import { db } from './firebase.js';
import { initCoinGame } from './coinGame.js'; // Импорт функции для игры в монетку

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

        const coinButton = document.querySelector('.coin-button');
        if (coinButton) {
            coinButton.addEventListener('click', handleCoinClick);
        }

        // Обработчики кнопок навигации
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                
                switch(page) {
                    case 'transfer':
                        showTransferPage();
                        break;
                    case 'games':
                        initCoinGame(); // Запуск игры в монетку
                        break;
                    default:
                        showSimplePage(btn.textContent);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Fallback для тестирования вне Telegram
        const pagesContainer = getElement('pages-container');
        if (pagesContainer) {
            pagesContainer.innerHTML = `
                <div class="page">
                    <div class="page-content">
                        <p class="error-message">Ошибка загрузки. Пожалуйста, откройте приложение через Telegram.</p>
                    </div>
                </div>
            `;
            pagesContainer.style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
