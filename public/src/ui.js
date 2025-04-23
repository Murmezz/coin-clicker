import { coins, highscore, transferHistory } from './user.js';
import { makeTransfer } from './transfers.js'; // Добавленный импорт

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

export function renderTransferHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    historyList.innerHTML = transferHistory.length === 0 
        ? '<p>Нет истории переводов</p>'
        : transferHistory.slice(0, 10).map(tx => `
            <div class="history-item ${tx.status}">
                <div>
                    <span class="history-username">${tx.to}</span>
                    <span class="history-date">${new Date(tx.date).toLocaleString()}</span>
                </div>
                <span class="history-amount">-${tx.amount}</span>
            </div>
        `).join('');
}