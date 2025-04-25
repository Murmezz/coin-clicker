import { updateTransferHistory, sendCoins } from './transfers.js';
import { getCoins, getHighscore } from './user.js';

export function updateDisplays() {
    const coinsDisplay = document.getElementById('coins');
    const highscoreDisplay = document.getElementById('highscore');
    
    if (coinsDisplay) {
        coinsDisplay.textContent = getCoins();
    }
    if (highscoreDisplay) {
        highscoreDisplay.textContent = getHighscore();
    }
}

export function showTransferPage() {
    const pagesContainer = document.getElementById('pages-container');
    const template = document.getElementById('transfer-page-template');
    
    if (!pagesContainer || !template) return;

    pagesContainer.innerHTML = template.innerHTML;
    pagesContainer.style.display = 'block';

    const backButton = pagesContainer.querySelector('.back-button');
    const sendButton = pagesContainer.querySelector('#send-coins');
    const usernameInput = pagesContainer.querySelector('#username');
    const amountInput = pagesContainer.querySelector('#amount');
    const messageDiv = pagesContainer.querySelector('#transfer-message');

    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }

    if (sendButton && usernameInput && amountInput && messageDiv) {
        sendButton.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const amount = parseInt(amountInput.value);

            messageDiv.className = 'transfer-message';
            
            try {
                const result = await sendCoins(username, amount);
                if (result) {
                    messageDiv.className = 'transfer-message success-message';
                    messageDiv.textContent = 'Перевод успешно выполнен';
                    usernameInput.value = '';
                    amountInput.value = '';
                    updateDisplays();
                    await updateTransferHistory();
                }
            } catch (error) {
                messageDiv.className = 'transfer-message error-message';
                messageDiv.textContent = error.message;
            }
        });
    }

    updateTransferHistory();
}
