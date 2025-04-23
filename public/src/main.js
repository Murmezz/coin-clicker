import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

// Глобальные элементы
let coinButton = null;

// ... (импорты остаются прежними)

// Создание эффекта +1
const createCoinEffect = (startX, startY) => {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    // Вычисляем конечную позицию (баланс)
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const balanceRect = balanceEl.getBoundingClientRect();
        const targetX = balanceRect.left + balanceRect.width/2 - startX;
        const targetY = balanceRect.top + balanceRect.height/2 - startY;
        
        effect.style.setProperty('--target-x', `${targetX}px`);
        effect.style.setProperty('--target-y', `${targetY}px`);
    }
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};

// Эффект продавливания
const createDentEffect = (x, y, element) => {
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${x}px`;
    dent.style.top = `${y}px`;
    element.appendChild(dent);
    setTimeout(() => dent.remove(), 400);
};

// Новая анимация наклона
const tiltCoin = (element, clickX, clickY) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Вычисляем направление наклона
    const tiltX = (clickX - centerX) / 20;
    const tiltY = (clickY - centerY) / 20;
    
    element.style.transform = `
        perspective(500px)
        rotateX(${-tiltY}deg)
        rotateY(${tiltX}deg)
        scale(0.95)
    `;
    
    setTimeout(() => {
        element.style.transform = '';
    }, 300);
};

// Обработчик клика
const handleCoinClick = async (event) => {
    const coinButton = event.currentTarget;
    const rect = coinButton.getBoundingClientRect();
    
    // Координаты клика относительно монеты
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Анимации
    tiltCoin(coinButton, clickX, clickY);
    createDentEffect(clickX, clickY, coinButton);
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

// ... (остальной код initApp остается без изменений)

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
