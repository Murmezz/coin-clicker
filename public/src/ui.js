import { coins, highscore } from './user.js';
import { renderTransferHistory } from './transfers.js';

export function getElement(id) {
    return document.getElementById(id);
}

export function updateDisplays() {
    const coinsDisplay = getElement('coins');
    const highscoreDisplay = getElement('highscore');
    if (coinsDisplay) coinsDisplay.textContent = coins;
    if (highscoreDisplay) highscoreDisplay.textContent = highscore;
}

export function showMessage(text, type) {
    const messageDiv = getElement('transfer-message');
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `transfer-message ${type}-message`;
}

export function showTransferPage() {
    const pagesContainer = getElement('pages-container');
    const transferPage = getElement('transfer-page');
    
    if (!pagesContainer || !transferPage) return;
    
    pagesContainer.innerHTML = '';
    const page = transferPage.cloneNode(true);
    pagesContainer.appendChild(page);
    pagesContainer.style.display = 'block';
    renderTransferHistory();

    const sendButton = page.querySelector('#send-coins');
    const usernameInput = page.querySelector('#username');
    const amountInput = page.querySelector('#amount');
    
    sendButton?.addEventListener('click', async () => {
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

    const backButton = page.querySelector('.back-button');
    backButton?.addEventListener('click', () => {
        pagesContainer.style.display = 'none';
    });
}