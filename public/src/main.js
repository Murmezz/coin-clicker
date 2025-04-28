import { initUser, loadData, getCoins, updateUserState, getUserId } from './user.js';
import { showTransferPage, getElement, updateDisplays, showMessage } from './ui.js';
import { db } from './firebase.js';

// Простейшая реализация игры
function initCoinGame() {
    const pagesContainer = getElement('pages-container');
    if (!pagesContainer) return;

    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">← Назад</button>
                <h2>Монетка</h2>
            </div>
            <div class="page-content">
                <div class="bet-section">
                    <input type="number" id="bet-amount" placeholder="Сумма ставки" min="1" max="${getCoins()}" class="transfer-input">
                    <div class="coin-choices">
                        <button id="heads-btn" class="choice-btn">Орёл</button>
                        <button id="tails-btn" class="choice-btn">Решка</button>
                    </div>
                    <button id="start-game" class="game-button">Играть</button>
                </div>
                <div id="game-result" class="game-result"></div>
            </div>
        </div>
    `;

    pagesContainer.style.display = 'block';

    // Обработчики
    let userChoice = null;
    let betAmount = 0;

    document.getElementById('heads-btn').addEventListener('click', () => {
        userChoice = 'heads';
        document.getElementById('heads-btn').classList.add('active');
        document.getElementById('tails-btn').classList.remove('active');
    });

    document.getElementById('tails-btn').addEventListener('click', () => {
        userChoice = 'tails';
        document.getElementById('tails-btn').classList.add('active');
        document.getElementById('heads-btn').classList.remove('active');
    });

    document.getElementById('bet-amount').addEventListener('input', (e) => {
        betAmount = parseInt(e.target.value) || 0;
    });

    document.getElementById('start-game').addEventListener('click', async () => {
        if (!userChoice || betAmount < 1 || betAmount > getCoins()) {
            showMessage('Некорректная ставка', 'error');
            return;
        }

        // Списание ставки
        const newCoins = getCoins() - betAmount;
        await db.ref(`users/${getUserId()}`).update({ balance: newCoins });
        updateUserState({ coins: newCoins });
        updateDisplays();

        // Определение результата
        const isWin = Math.random() < 0.5;
        const result = isWin ? userChoice : (userChoice === 'heads' ? 'tails' : 'heads');

        // Обновление баланса
        if (isWin) {
            const winAmount = betAmount * 2;
            await db.ref(`users/${getUserId()}`).update({ balance: newCoins + winAmount });
            updateUserState({ coins: newCoins + winAmount });
            updateDisplays();
        }

        // Показ результата
        document.getElementById('game-result').innerHTML = `
            <div class="result ${isWin ? 'win' : 'lose'}">
                <img src="${result === 'heads' ? 
                    'https://i.postimg.cc/5yCLJbrb/1000048704.png' : 
                    'https://i.postimg.cc/G2BSdqqB/1000048918.png'}" 
                    width="80">
                <h3>${isWin ? 'Победа!' : 'Проигрыш'}</h3>
                <p>Выпало: ${result === 'heads' ? 'Орёл' : 'Решка'}</p>
                <p>${isWin ? `+${betAmount * 2}` : `-${betAmount}`} коинов</p>
            </div>
        `;
    });

    document.querySelector('.back-button').addEventListener('click', () => {
        pagesContainer.style.display = 'none';
    });
}

// Инициализация приложения
async function initializeApp() {
    await initUser();
    await loadData();

    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.page === 'transfer') {
                showTransferPage();
            } else if (btn.dataset.page === 'games') {
                initCoinGame();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);