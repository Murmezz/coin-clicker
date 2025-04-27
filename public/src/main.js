import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays, getElement, showMessage } from './ui.js';
import { db } from './firebase.js';

// Глобальная проверка загрузки модуля игры
let gameModuleLoaded = false;

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

async function launchGame() {
    try {
        if (!gameModuleLoaded) {
            const gameModule = await import('./coinGame.js');
            window.initCoinGame = gameModule.initCoinGame;
            gameModuleLoaded = true;
        }
        window.initCoinGame();
    } catch (error) {
        console.error('Ошибка загрузки игры:', error);
        showMessage('Игра временно недоступна', 'error');
    }
}

function setupNavigation() {
    // Удаляем старые обработчики
    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    // Добавляем новые обработчики
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 200);
            
            switch(this.dataset.page) {
                case 'transfer':
                    showTransferPage();
                    break;
                case 'games':
                    launchGame();
                    break;
                default:
                    showSimplePage(this.textContent);
            }
        });
    });
}

function createEmergencyButton() {
    if (document.getElementById('emergency-game-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'emergency-game-btn';
    btn.textContent = 'ЗАПУСТИТЬ ИГРУ';
    btn.addEventListener('click', launchGame);
    document.body.appendChild(btn);
}

async function initializeApp() {
    try {
        await initUser();
        await loadData();
        updateDisplays();

        document.querySelector('.coin-button')?.addEventListener('click', handleCoinClick);
        setupNavigation();
        createEmergencyButton();

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showMessage('Ошибка загрузки приложения', 'error');
    }
}

// Двойная проверка готовности документа
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeApp, 100);
} else {
    document.addEventListener('DOMContentLoaded', initializeApp);
}
