// coinGame.js
import { getElement, showMessage } from './ui.js';
import { getUserId, getCoins, updateUserState } from './user.js';
import { db } from './firebase.js';

// Состояние игры
let gameState = {
    isPlaying: false,
    currentBet: 0,
    userChoice: null
};

export function initCoinGame() {
    showCoinGamePage();
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
                            <button id="choose-heads" class="coin-choice-button">
                                <img src="https://i.postimg.cc/5yCLJbrb/1000048704.png" alt="Орел" class="choice-icon">
                                <span>Орел</span>
                            </button>
                            <button id="choose-tails" class="coin-choice-button">
                                <img src="https://i.postimg.cc/G2BSdqqB/1000048918.png" alt="Решка" class="choice-icon">
                                <span>Решка</span>
                            </button>
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
    
    // Обработчик кнопки "Назад"
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
            gameState.isPlaying = false;
        });
    }
    
    // Инициализация элементов управления
    setupGameControls();
}

function setupGameControls() {
    const betInput = getElement('bet-amount');
    const headsButton = getElement('choose-heads');
    const tailsButton = getElement('choose-tails');
    const startButton = getElement('start-game');
    
    if (!betInput || !headsButton || !tailsButton || !startButton) return;
    
    // Обновление максимальной ставки
    betInput.max = getCoins();
    
    // Обработчики выбора стороны монеты
    headsButton.addEventListener('click', () => {
        if (gameState.isPlaying) return;
        gameState.userChoice = 'heads';
        headsButton.classList.add('active');
        tailsButton.classList.remove('active');
        updateStartButton();
    });
    
    tailsButton.addEventListener('click', () => {
        if (gameState.isPlaying) return;
        gameState.userChoice = 'tails';
        tailsButton.classList.add('active');
        headsButton.classList.remove('active');
        updateStartButton();
    });
    
    // Обработчик изменения суммы ставки
    betInput.addEventListener('input', () => {
        if (gameState.isPlaying) return;
        const betAmount = parseInt(betInput.value);
        gameState.currentBet = isNaN(betAmount) ? 0 : Math.min(betAmount, getCoins());
        updateStartButton();
    });
    
    // Обработчик начала игры
    startButton.addEventListener('click', startCoinFlipGame);
    
    function updateStartButton() {
        startButton.disabled = !(gameState.currentBet > 0 && gameState.userChoice);
    }
}

async function startCoinFlipGame() {
    if (gameState.isPlaying) return;
    gameState.isPlaying = true;
    
    const betAmount = gameState.currentBet;
    const userChoice = gameState.userChoice;
    const newCoins = getCoins() - betAmount;
    
    // Списание ставки
    await db.ref(`users/${getUserId()}`).update({ balance: newCoins });
    updateUserState({ coins: newCoins });
    
    // Получаем элементы
    const coinContainer = getElement('coin-flip-container');
    const coin = getElement('coin');
    const resultDiv = getElement('game-result');
    const betControls = document.querySelector('.bet-controls');
    
    if (!coinContainer || !coin || !resultDiv || !betControls) return;
    
    // Показываем подтверждение ставки
    betControls.innerHTML = `
        <div class="bet-confirmation">
            <p>Ставка принята: ${betAmount} коинов на ${userChoice === 'heads' ? 'орла' : 'решку'}</p>
            <div class="countdown">Подбрасываем через: 3</div>
        </div>
    `;
    
    // Обратный отсчет
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        countdown--;
        const countdownElement = document.querySelector('.countdown');
        if (countdownElement) {
            countdownElement.textContent = `Подбрасываем через: ${countdown}`;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            flipCoin();
        }
    }, 1000);
    
    function flipCoin() {
        // Показываем анимацию
        coinContainer.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        coin.style.transform = 'rotateY(0)';
        coin.classList.remove('flipping');
        
        // Определение результата
        const isWin = Math.random() < 0.5;
        const coinResult = isWin ? userChoice : (userChoice === 'heads' ? 'tails' : 'heads');
        
        // Запуск анимации
        void coin.offsetWidth; // Перезапуск анимации
        coin.classList.add('flipping');
        
        // Обработка результата
        setTimeout(async () => {
            coin.classList.remove('flipping');
            coin.style.transform = coinResult === 'heads' ? 'rotateY(0)' : 'rotateY(180deg)';
            
            // Обновление баланса
            if (isWin) {
                const winAmount = betAmount * 2;
                const newBalance = newCoins + winAmount;
                await db.ref(`users/${getUserId()}`).update({ balance: newBalance });
                updateUserState({ coins: newBalance });
                
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
                playAgainButton.addEventListener('click', () => {
                    showCoinGamePage();
                });
            }
        }, 2500);
    }
}
