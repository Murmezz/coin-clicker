import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

// Глобальные элементы
let coinButton = null;

const handleCoinClick = async (event) => {
    const coin = event.currentTarget;
    const effectsContainer = document.getElementById('effects-container');
    const balanceDisplay = document.getElementById('coins');
    
    // 1. Получаем координаты клика
    const rect = coin.getBoundingClientRect();
    const clickX = event.clientX;
    const clickY = event.clientY;
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    
    // 2. Анимация продавливания монеты
    // Вычисляем угол наклона (до 10 градусов)
    const tiltX = ((localX - rect.width/2) / (rect.width/2)) * 10;
    const tiltY = ((localY - rect.height/2) / (rect.height/2)) * -10;
    
    coin.style.transform = `
        perspective(500px)
        rotateX(${tiltY}deg)
        rotateY(${tiltX}deg)
        scale(0.95)
    `;
    
    // 3. Эффект вмятины
    const dent = document.createElement('div');
    dent.className = 'dent';
    dent.style.left = `${localX}px`;
    dent.style.top = `${localY}px`;
    coin.appendChild(dent);
    
    // 4. Эффект +1 (летит к балансу)
    const plus = document.createElement('div');
    plus.className = 'coin-plus';
    plus.textContent = '+1';
    plus.style.left = `${clickX}px`;
    plus.style.top = `${clickY}px`;
    
    if (balanceDisplay) {
        const balanceRect = balanceDisplay.getBoundingClientRect();
        const targetX = balanceRect.left + balanceRect.width/2 - clickX;
        const targetY = balanceRect.top + balanceRect.height/2 - clickY;
        plus.style.setProperty('--target-x', `${targetX * 0.7}px`);
        plus.style.setProperty('--target-y', `${targetY * 0.7}px`);
    }
    
    effectsContainer.appendChild(plus);
    
    // 5. Возврат в исходное состояние
    setTimeout(() => {
        coin.style.transform = '';
        dent.remove();
        plus.remove();
    }, 300);
    
    // 6. Обновление данных
    const newCoins = getCoins() + 1;
    updateUserState({ coins: newCoins });
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
