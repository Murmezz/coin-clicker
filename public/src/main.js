import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

// Глобальные элементы
let coinButton = null;

const handleCoinClick = async (event) => {
    const coin = event.currentTarget;
    const effectsContainer = document.getElementById('effects-container');
    const balanceDisplay = document.getElementById('coins');

// Обработчик клика
const onCoinClick = async (event) => {
    if (!coinButton) return;
    
    // Координаты клика относительно монеты
    const rect = coinButton.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Анимации
    coinButton.style.transform = 'scale(0.95)';
    createDentEffect(clickX, clickY, coinButton);
    
    // Возврат к исходному состоянию
    setTimeout(() => {
        coinButton.style.transform = '';
    }, 200);
    
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

// Показ простых страниц
const showSimplePage = (title) => {
    const pagesContainer = document.getElementById('pages-container');
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
    
    pagesContainer.querySelector('.back-button')?.addEventListener('click', () => {
        pagesContainer.style.display = 'none';
    });
};

// Инициализация
const initApp = async () => {
    try {
        await initUser();
        await loadData();
        updateDisplays();
        
        // Инициализация монеты
        coinButton = document.getElementById('coin-button');
        coinButton?.addEventListener('click', onCoinClick);
        
        // Навигация
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.dataset.page === 'transfer' 
                    ? showTransferPage() 
                    : showSimplePage(btn.textContent);
            });
        });
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
};

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
