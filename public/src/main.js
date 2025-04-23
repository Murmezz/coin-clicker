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
    const coinButton = event.currentTarget;
    const rect = coinButton.getBoundingClientRect();
    
    // 1. Анимации
    animateCoinClick(coinButton, event.clientX - rect.left, event.clientY - rect.top);
    createPlusOne(event.clientX, event.clientY);
    
    // 2. Обновление данных
    const newCoins = getCoins() + 1;
    updateUserState({ 
        coins: newCoins,
        highscore: Math.max(getHighscore(), newCoins)
    });
    updateDisplays();
    
    // 3. Сохранение
    await db.ref(`users/${getUserId()}`).update({ 
        balance: newCoins,
        highscore: Math.max(getHighscore(), newCoins)
    });
};
    
    // Обновление данных
    const newCoins = getCoins() + 1;
    updateUserState({ 
        coins: newCoins,
        highscore: Math.max(getHighscore(), newCoins)
    });
    updateDisplays();
    
    await db.ref(`users/${getUserId()}`).update({ 
        balance: newCoins,
        highscore: Math.max(getHighscore(), newCoins)
    });

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
