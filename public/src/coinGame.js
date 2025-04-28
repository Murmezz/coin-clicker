import { getElement, showMessage, updateDisplays } from './ui.js';
import { getUserId, getCoins, updateUserState } from './user.js';
import { db } from './firebase.js';

let gameState = {
    isPlaying: false,
    currentBet: 0,
    userChoice: null,
    result: null
};

export function initCoinGame() {
    const pagesContainer = getElement('pages-container');
    if (!pagesContainer) return;

    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">← Назад</button>
                <h2>Монетка</h2>
            </div>
            <div class="page-content">
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
                    <div class="countdown">Подбрасываем через: <span>3</span></div>
                    <div id="coin" class="coin-game">
                        <div class="coin-front"></div>
                        <div class="coin-back"></div>
                    </div>
                </div>
                <div id="game-result" class="game-result hidden"></div>
            </div>
        </div>
    `;

    pagesContainer.style.display = 'block';
    setupGameControls();
    setupBackButton();
}

function setupGameControls() {
    const betInput = getElement('bet-amount');
    const headsBtn = getElement('choose-heads');
    const tailsBtn = getElement('choose-tails');
    const startBtn = getElement('start-game');

    if (!betInput || !headsBtn || !tailsBtn || !startBtn) return;

    headsBtn.addEventListener('click', () => selectChoice('heads', headsBtn, tailsBtn));
    tailsBtn.addEventListener('click', () => selectChoice('tails', tailsBtn, headsBtn));
    betInput.addEventListener('input', () => updateBet(betInput));
    startBtn.addEventListener('click', startGame);
}

function selectChoice(choice, activeBtn, inactiveBtn) {
    if (gameState.isPlaying) return;
    gameState.userChoice = choice;
    activeBtn.classList.add('active');
    inactiveBtn.classList.remove('active');
    updateStartButton();
}

function updateBet(input) {
    if (gameState.isPlaying) return;
    gameState.currentBet = Math.min(parseInt(input.value) || 0, getCoins());
    updateStartButton();
}

function updateStartButton() {
    const startBtn = getElement('start-game');
    if (startBtn) {
        startBtn.disabled = !(gameState.currentBet > 0 && gameState.userChoice);
    }
}

function setupBackButton() {
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            getElement('pages-container').style.display = 'none';
            gameState.isPlaying = false;
        });
    }
}

async function startGame() {
    if (gameState.isPlaying || !validateBet()) return;
    gameState.isPlaying = true;

    const newCoins = getCoins() - gameState.currentBet;
    await db.ref(`users/${getUserId()}`).update({ balance: newCoins });
    updateUserState({ coins: newCoins });
    updateDisplays();

    showBetConfirmation();
    startCountdown();
}

function validateBet() {
    if (gameState.currentBet > getCoins()) {
        showMessage('Недостаточно коинов', 'error');
        return false;
    }
    if (gameState.currentBet < 1 || !gameState.userChoice) {
        showMessage('Сделайте ставку и выберите сторону', 'error');
        return false;
    }
    return true;
}

function showBetConfirmation() {
    const betControls = document.querySelector('.bet-controls');
    if (betControls) {
        betControls.innerHTML = `
            <div class="bet-confirmation">
                <p>Ставка <strong>${gameState.currentBet}</strong> на <strong>${gameState.userChoice === 'heads' ? 'орла' : 'решку'}</strong></p>
            </div>
        `;
    }
}

function startCountdown() {
    const countdownElement = document.querySelector('.countdown span');
    if (!countdownElement) return;

    let count = 3;
    countdownElement.textContent = count;

    const timer = setInterval(() => {
        count--;
        countdownElement.textContent = count;

        if (count <= 0) {
            clearInterval(timer);
            flipCoin();
        }
    }, 1000);
}

async function flipCoin() {
    const coinContainer = getElement('coin-flip-container');
    const coin = getElement('coin');
    const resultDiv = getElement('game-result');

    if (!coinContainer || !coin || !resultDiv) return;

    gameState.result = Math.random() < 0.9 ? gameState.userChoice : 
                      (gameState.userChoice === 'heads' ? 'tails' : 'heads');

    coinContainer.classList.remove('hidden');
    coin.style.animation = 'none';
    void coin.offsetWidth;
    coin.style.animation = 'flip-coin 2.5s ease-out forwards';

    setTimeout(() => showResult(), 2500);
}

async function showResult() {
    const resultDiv = getElement('game-result');
    if (!resultDiv) return;

    const isWin = gameState.result === gameState.userChoice;
    const winAmount = gameState.currentBet * 2;

    if (isWin) {
        const newBalance = getCoins() + winAmount;
        await db.ref(`users/${getUserId()}`).update({ balance: newBalance });
        updateUserState({ coins: newBalance });
        updateDisplays();
    }

    resultDiv.innerHTML = `
        <div class="result ${isWin ? 'win' : 'lose'}">
            <h3>${isWin ? 'Победа!' : 'Проигрыш'}</h3>
            <div class="coin-result ${gameState.result}"></div>
            <p>Выпало: ${gameState.result === 'heads' ? 'Орёл' : 'Решка'}</p>
            <p>${isWin ? `+${winAmount}` : `-${gameState.currentBet}`} коинов</p>
            <button id="play-again" class="transfer-button">Играть снова</button>
        </div>
    `;
    resultDiv.classList.remove('hidden');

    document.getElementById('play-again')?.addEventListener('click', () => {
        resultDiv.classList.add('hidden');
        initCoinGame();
    });
}