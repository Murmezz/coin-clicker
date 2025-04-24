import { initUser, loadData, getCoins, getHighscore, updateUserState } from './user.js';
import { updateDisplays } from './ui.js';

// Глобальные переменные
let localCoins = 0;
let isInitialized = false;

async function handleCoinClick() {
    if (!isInitialized) return;
    
    localCoins++;
    const newHighscore = Math.max(getHighscore(), localCoins);
    
    updateUserState({
        coins: localCoins,
        highscore: newHighscore
    });
    
    updateDisplays();
    
    // Анимация
    const coin = document.querySelector('.coin-button');
    coin.style.transform = 'scale(0.9)';
    setTimeout(() => coin.style.transform = 'scale(1)', 100);
}

async function initializeApp() {
    try {
        await initUser();
        localCoins = getCoins(); // Синхронизация с Firebase
        isInitialized = true;
        
        // Обработчики
        document.querySelector('.coin-button').addEventListener('click', handleCoinClick);
        updateDisplays();
        
        // Синхронизация каждые 5 сек
        setInterval(async () => {
            await db.ref(`users/${getUserId()}`).update({
                balance: localCoins,
                highscore: getHighscore()
            });
        }, 5000);
        
    } catch (error) {
        console.error("Initialize error:", error);
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', initializeApp);