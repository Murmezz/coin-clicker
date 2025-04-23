// main.js
import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';
import { createCoinEffect, tiltCoin } from './animations.js';

const handleCoinClick = async (event) => {
    const coinButton = event.currentTarget;
    const rect = coinButton.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Анимации
    tiltCoin(coinButton, clickX, clickY);
    createCoinEffect(event.clientX, event.clientY);
    
    // Обновление данных
    const newCoins = getCoins() + 1;
    const newHighscore = Math.max(getHighscore(), newCoins);
    
    updateUserState({ 
        coins: newCoins,
        highscore: newHighscore
    });
    updateDisplays();
    
    try {
        await db.ref(`users/${getUserId()}`).update({ 
            balance: newCoins,
            highscore: newHighscore
        });
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
};

const initApp = async () => {
    try {
        await initUser();
        await loadData();
        
        document.getElementById('coin-button')?.addEventListener('click', handleCoinClick);
        
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    showTransferPage();
                }
            });
        });
        
        updateDisplays();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
};

document.addEventListener('DOMContentLoaded', initApp);
