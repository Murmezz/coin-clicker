import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

// Анимационные функции
const createCoinEffect = (x, y) => {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};

const createParticles = (x, y) => {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${Math.random() * 10 + 5}px`;
        particle.style.height = particle.style.width;
        particle.style.opacity = Math.random() * 0.5 + 0.5;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 50;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
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
