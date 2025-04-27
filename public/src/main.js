import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays, showMessage, getElement } from './ui.js';
import { db } from './firebase.js';

// Состояние игры
let gameState = {
    isPlaying: false,
    currentBet: 0,
    userChoice: null
};

async function handleCoinClick() {
    try {
        const currentCoins = getCoins();
        const currentHighscore = getHighscore();
        const newCoins = currentCoins + 1;
        const newHighscore = Math.max(currentHighscore, newCoins);
        
        await db.ref(`users/${getUserId()}`).update({ 
            balance: newCoins, 
            highscore: newHighscore 
        });
        
        updateUserState({
            coins: newCoins,
            highscore: newHighscore
        });
        
        updateDisplays();
    } catch (error) {
        console.error('Ошибка при клике:', error);
    }
}

function showCoinGamePage() {
    const pagesContainer = getElement('pages-container');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">←</button>
                <h2 class="page-title">Монетка</h2>
            </div>
            <div class="page-content">
                <div class="coin-game-container">
                    <div class="bet-controls">
                        <input type="number" id="bet-amount" placeholder="Сумма ставки" min="1" max="${getCoins()}" class="transfer-input">
                        <div class="choice-buttons">
                            <button id="choose-heads" class="coin-choice-button">Орел</button>
                            <button id="choose-tails" class="coin-choice-button">Решка</button>
                        </div>
                        <button id="start-game" class="transfer-button" disabled>Сделать ставку</button>
                    </div>
                    <div id="coin-flip-container" class="coin-flip-container hidden">
                        <div id="coin" class="coin-game">
                            <div class="coin-front"></div>
                            <div class="coin-back"></div>
                        </div>
                    </div>
                    <div id="game-result" class="game-result hidden"></div>
                </div>
            </div>
        </div>
    `;
    pagesContainer.style.display = 'block';
    
    // Обработчик кнопки "Назад"
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
            gameState.isPlaying = false;
        });
    }
    
    // Инициализация элементов игры
    initCoinGameControls();
}

function initCoinGameControls() {
    const betInput = getElement('bet-amount');
    const headsButton = getElement('choose-heads');
    const tailsButton = getElement('choose-tails');
    const startButton = getElement('start-game');
    
    if (!betInput || !headsButton || !tailsButton || !startButton) return;
    
    // Обновление максимальной ставки
    betInput.max = getCoins();
    
    // Обработчики выбора стороны монеты
    headsButton.addEventListener('click', () => {
        gameState.userChoice = 'heads';
        headsButton.classList.add('active');
        tailsButton.classList.remove('active');
        updateStartButton();
    });
    
    tailsButton.addEventListener('click', () => {
        gameState.userChoice = 'tails';
        tailsButton.classList.add('active');
        headsButton.classList.remove('active');
        updateStartButton();
    });
    
    // Обработчик изменения суммы ставки
    betInput.addEventListener('input', () => {
        const betAmount = parseInt(betInput.value);
        gameState.currentBet = isNaN(betAmount) ? 0 : Math.min(betAmount, getCoins());
        updateStartButton();
    });
    
    // Обработчик начала игры
    startButton.addEventListener('click', () => {
        if (gameState.isPlaying) return;
        if (gameState.currentBet < 1 || !gameState.userChoice) return;
        if (gameState.currentBet > getCoins()) {
            showMessage('Недостаточно коинов', 'error');
            return;
        }
        
        startCoinFlipGame();
    });
    
    function updateStartButton() {
        startButton.disabled = !(gameState.currentBet > 0 && gameState.userChoice);
    }
}

async function startCoinFlipGame() {
    gameState.isPlaying = true;
    const betAmount = gameState.currentBet;
    const userChoice = gameState.userChoice;
    
    // Списание ставки
    const newCoins = getCoins() - betAmount;
    await db.ref(`users/${getUserId()}`).update({ balance: newCoins });
    updateUserState({ coins: newCoins });
    updateDisplays();
    
    // Получаем элементы
    const coinContainer = getElement('coin-flip-container');
    const coin = getElement('coin');
    const resultDiv = getElement('game-result');
    const startButton = getElement('start-game');
    const betControls = document.querySelector('.bet-controls');
    
    if (!coinContainer || !coin || !resultDiv || !startButton || !betControls) return;
    
    // Показываем подтверждение ставки
    betControls.innerHTML = `
        <div class="bet-confirmation">
            <p>Ставка принята: ${betAmount} коинов на ${userChoice === 'heads' ? 'орла' : 'решку'}</p>
            <div class="countdown">Подбрасываем через: 3</div>
        </div>
    `;
    
    // Запускаем обратный отсчет
    let countdown = 3;
    const countdownElement = document.querySelector('.countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownElement.textContent = `Подбрасываем через: ${countdown}`;
        } else {
            clearInterval(countdownInterval);
            startCoinFlipAnimation();
        }
    }, 1000);
    
    // Функция анимации подбрасывания монетки
    const startCoinFlipAnimation = async () => {
        // Сброс предыдущего состояния
        coinContainer.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        coin.style.transform = 'rotateY(0)';
        coin.classList.remove('flipping');
        
        // Подготовка к анимации
        void coin.offsetWidth; // Trigger reflow
        
        // Определение результата (50/50)
        const isWin = Math.random() < 0.5;
        const coinResult = isWin ? userChoice : (userChoice === 'heads' ? 'tails' : 'heads');
        
        // Начинаем анимацию
        coin.classList.add('flipping');
        
        // Обработка результата после анимации
        setTimeout(() => {
            // Останавливаем анимацию
            coin.classList.remove('flipping');
            
            // Устанавливаем конечное положение
            coin.style.transform = coinResult === 'heads' ? 'rotateY(0)' : 'rotateY(180deg)';
            
            // Показываем результат
            showGameResult(isWin, betAmount, newCoins, userChoice, coinResult);
        }, 2500);
    };
    
    // Функция показа результата
    const showGameResult = async (isWin, betAmount, newCoins, userChoice, coinResult) => {
        if (isWin) {
            const winAmount = betAmount * 2;
            const newCoinsAfterWin = newCoins + winAmount;
            
            await db.ref(`users/${getUserId()}`).update({ balance: newCoinsAfterWin });
            updateUserState({ coins: newCoinsAfterWin });
            updateDisplays();
            
            resultDiv.innerHTML = `
                <div class="win-message">
                    <h3>Победа! +${winAmount} коинов</h3>
                    <p>Выпал ${coinResult === 'heads' ? 'орёл' : 'решка'}</p>
                    <button id="play-again" class="transfer-button">Играть снова</button>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="lose-message">
                    <h3>Проигрыш: -${betAmount} коинов</h3>
                    <p>Выпал ${coinResult === 'heads' ? 'орёл' : 'решка'}</p>
                    <button id="play-again" class="transfer-button">Играть снова</button>
                </div>
            `;
        }
        
        resultDiv.classList.remove('hidden');
        gameState.isPlaying = false;
        
        // Обработчик кнопки "Играть снова"
        const playAgainButton = getElement('play-again');
        if (playAgainButton) {
            playAgainButton.addEventListener('click', resetGameUI);
        }
    };
    
    // Функция сброса UI игры
    const resetGameUI = () => {
        coinContainer.classList.add('hidden');
        resultDiv.classList.add('hidden');
        initCoinGameControls();
    };
}

function showSimplePage(title) {
    const pagesContainer = getElement('pages-container');
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
    
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
}

async function initializeApp() {
    try {
        await initUser();
        await loadData();
        updateDisplays();

        const coinButton = document.querySelector('.coin-button');
        if (coinButton) {
            coinButton.addEventListener('click', handleCoinClick);
        }

        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    showTransferPage();
                } else if (btn.dataset.page === 'games') {
                    showCoinGamePage();
                } else {
                    showSimplePage(btn.textContent);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
