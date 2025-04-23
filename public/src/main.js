import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';
import { createDentEffect, createCoinEffect, tiltCoin } from './animations.js';

// Инициализация элементов
let coinButton = null;
let effectsContainer = null;

const initElements = () => {
    coinButton = document.getElementById('coin-button');
    effectsContainer = document.createElement('div');
    effectsContainer.id = 'effects-container';
    document.body.appendChild(effectsContainer);
};

const handleCoinClick = async (event) => {
    if (!coinButton) return;
    
    const rect = coinButton.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Анимации
    tiltCoin(coinButton, clickX, clickY);
    createDentEffect(coinButton, clickX, clickY);
    createCoinEffect(event.clientX, event.clientY);
    
    // Обновление данных
    const newCoins = getCoins() + 1;
    updateUserState({ 
        coins: newCoins,
        highscore: Math.max(getHighscore(), newCoins)
    });
    updateDisplays();
    
    try {
        await db.ref(`users/${getUserId()}`).update({ 
            balance: newCoins,
            highscore: Math.max(getHighscore(), newCoins)
        });
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
};

const initEventListeners = () => {
    if (coinButton) {
        coinButton.addEventListener('click', handleCoinClick);
    }
    
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.page === 'transfer') {
                showTransferPage();
            } else {
                // Заглушка для других страниц
                console.log(`Открываем ${btn.dataset.page}`);
            }
        });
    });
};

const initApp = async () => {
    try {
        initElements(); // Инициализируем элементы ДО всего
        await initUser();
        await loadData();
        
        initEventListeners();
        updateDisplays();
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
};

document.addEventListener('DOMContentLoaded', initApp);
