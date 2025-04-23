import { getCoins, getHighscore } from './user.js';
import { makeTransfer, renderTransferHistory } from './transfers.js';

export function getElement(id) {
    return document.getElementById(id);
}

export function updateDisplays() {
    const coinsDisplay = getElement('coins');
    const highscoreDisplay = getElement('highscore');
    if (coinsDisplay) coinsDisplay.textContent = getCoins();
    if (highscoreDisplay) highscoreDisplay.textContent = getHighscore();
}

export function showMessage(text, type) {
    const messageDiv = getElement('transfer-message');
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `transfer-message ${type}-message`;
}

export function showTransferPage() {
    const pagesContainer = getElement('pages-container');
    const transferPageTemplate = getElement('transfer-page-template');
    
    if (!pagesContainer || !transferPageTemplate) return;
    
    const transferPage = transferPageTemplate.cloneNode(true);
    transferPage.id = 'active-transfer-page';
    transferPage.style.display = 'block';
    
    pagesContainer.innerHTML = '';
    pagesContainer.appendChild(transferPage);
    pagesContainer.style.display = 'block';
    
    renderTransferHistory();

    const sendButton = transferPage.querySelector('#send-coins');
    const usernameInput = transferPage.querySelector('#username');
    const amountInput = transferPage.querySelector('#amount');
    
    if (sendButton && usernameInput && amountInput) {
        sendButton.addEventListener('click', async () => {
            const recipient = usernameInput.value.trim();
            const amount = parseInt(amountInput.value);
            
            if (!recipient.startsWith('@')) {
                showMessage('Введите @username получателя', 'error');
                return;
            }
            
            const result = await makeTransfer(recipient, amount);
            showMessage(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                usernameInput.value = '';
                amountInput.value = '';
            }
        });
    }

    const backButton = transferPage.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
}