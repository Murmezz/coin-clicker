import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

// Добавьте в самое начало файла (после импортов):
const effectsContainer = document.createElement('div');
effectsContainer.className = 'effects-container';
document.body.appendChild(effectsContainer);

// Добавим в начало файла:
function createDentEffect(x, y, parent) {
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${x}px`;
    dent.style.top = `${y}px`;
    parent.appendChild(dent);
    
    // Активируем анимацию
    setTimeout(() => dent.classList.add('active'), 10);
    
    // Удаляем после анимации
    setTimeout(() => dent.remove(), 600);
}

// Обновленный handleCoinClick:
const handleCoinClick = async (event) => {
    const coinButton = event.currentTarget;
    
    // Эффект продавливания
    coinButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        coinButton.style.transform = '';
    }, 200);
    
    // Эффект вмятины
    const rect = coinButton.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    createDentEffect(clickX, clickY, coinButton);
    
    // Логика клика
    const currentCoins = getCoins();
    const newCoins = currentCoins + 1;
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
const handleCoinClick = async (event) => {
    try {
        const coin = event.currentTarget;
        coin.classList.add('coin-clicked');
        setTimeout(() => coin.classList.remove('coin-clicked'), 100);

        createCoinEffect(event.clientX, event.clientY);
        createParticles(event.clientX, event.clientY);

        const currentCoins = getCoins();
        const newCoins = currentCoins + 1;
        const newHighscore = Math.max(getHighscore(), newCoins);
        
        updateUserState({ 
            coins: newCoins,
            highscore: newHighscore
        });
        
        updateDisplays();
        
        await db.ref(`users/${getUserId()}`).update({ 
            balance: newCoins, 
            highscore: newHighscore 
        });

    } catch (error) {
        console.error('Ошибка при клике:', error);
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

// Инициализация приложения
const initializeApp = async () => {
    try {
        await initUser();
        await loadData();
        updateDisplays();

        document.querySelector('.coin-button')?.addEventListener('click', handleCoinClick);
        
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

document.addEventListener('DOMContentLoaded', initializeApp);
