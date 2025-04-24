import { initUser, loadData, getUserId, getCoins, getHighscore, updateUserState } from './user.js';
import { showTransferPage, updateDisplays, showMessage } from './ui.js';
import { db } from './firebase.js';

// Локальный кэш для оптимизации кликов
let localCoins = 0;
let lastSyncTime = 0;
const SYNC_INTERVAL = 5000; // 5 секунд

async function handleCoinClick() {
    try {
        localCoins++;
        const newHighscore = Math.max(getHighscore(), localCoins);
        
        updateUserState({
            coins: localCoins,
            highscore: newHighscore
        });
        
        updateDisplays();
        
        // Синхронизация с Firebase только если прошло SYNC_INTERVAL
        const now = Date.now();
        if (now - lastSyncTime > SYNC_INTERVAL) {
            await db.ref(`users/${getUserId()}`).update({
                balance: localCoins,
                highscore: newHighscore
            });
            lastSyncTime = now;
            console.log('Данные синхронизированы с Firebase');
        }
        
        // Анимация клика
        const coin = document.querySelector('.coin-button');
        if (coin) {
            coin.style.transform = 'scale(0.95)';
            setTimeout(() => coin.style.transform = 'scale(1)', 100);
        }
        
    } catch (error) {
        console.error('Ошибка при клике:', error);
        showMessage('Ошибка сохранения', 'error');
    }
}

function showSimplePage(title) {
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">←</button>
                <h2 class="page-title">${title}</h2>
            </div>
            <div class="page-content">
                <p>${title === 'Игры' ? 'Выберите игру:' : 'Раздел в разработке'}</p>
                ${title === 'Игры' ? '<button class="nav-button" data-game="nvuti">NVUTI (x2)</button>' : ''}
            </div>
        </div>
    `;
    
    pagesContainer.style.display = 'block';
    
    // Обработчик кнопки "назад"
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
    
    // Обработчик игры NVUTI
    if (title === 'Игры') {
        const nvutiButton = pagesContainer.querySelector('[data-game="nvuti"]');
        if (nvutiButton) {
            nvutiButton.addEventListener('click', () => {
                showNvutiGame();
            });
        }
    }
}

function showNvutiGame() {
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">←</button>
                <h2 class="page-title">NVUTI</h2>
            </div>
            <div class="page-content">
                <div class="nvuti-game">
                    <input type="range" id="nvuti-bet" min="10" max="${Math.floor(getCoins()/2)}" value="10">
                    <p>Ставка: <span id="nvuti-bet-value">10</span></p>
                    <button id="nvuti-start" class="transfer-button">Крутить (x2)</button>
                    <div id="nvuti-result"></div>
                </div>
            </div>
        </div>
    `;
    
    // Обновление значения ставки
    const betSlider = pagesContainer.querySelector('#nvuti-bet');
    const betValue = pagesContainer.querySelector('#nvuti-bet-value');
    betSlider.addEventListener('input', () => {
        betValue.textContent = betSlider.value;
    });
    
    // Запуск игры
    const startButton = pagesContainer.querySelector('#nvuti-start');
    startButton.addEventListener('click', async () => {
        const bet = parseInt(betSlider.value);
        if (bet > getCoins()) {
            showMessage('Недостаточно средств', 'error');
            return;
        }
        
        // Симуляция игры (50% шанс)
        const isWin = Math.random() > 0.5;
        const result = isWin ? bet * 2 : -bet;
        
        // Обновляем баланс
        const newBalance = getCoins() + result;
        localCoins = newBalance;
        await db.ref(`users/${getUserId()}`).update({
            balance: newBalance
        });
        updateUserState({ coins: newBalance });
        updateDisplays();
        
        // Показываем результат
        const resultDiv = pagesContainer.querySelector('#nvuti-result');
        resultDiv.innerHTML = isWin 
            ? `<p style="color: #4CAF50;">Поздравляем! +${bet * 2} коинов</p>`
            : `<p style="color: #f44336;">Вы проиграли ${bet} коинов</p>`;
    });
    
    // Кнопка назад
    const backButton = pagesContainer.querySelector('.back-button');
    backButton.addEventListener('click', () => {
        pagesContainer.style.display = 'none';
    });
}

async function initializeApp() {
    try {
        // Инициализация пользователя
        await initUser();
        await loadData();
        
        // Первая синхронизация локального баланса
        localCoins = getCoins();
        lastSyncTime = Date.now();
        
        // Обновление интерфейса
        updateDisplays();
        
        // Обработчики событий
        document.querySelector('.coin-button')?.addEventListener('click', handleCoinClick);
        
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    showTransferPage();
                } else {
                    showSimplePage(btn.textContent);
                }
            });
        });
        
        console.log(`Приложение инициализировано. UserID: ${getUserId()}`);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showMessage('Ошибка загрузки данных', 'error');
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initializeApp);