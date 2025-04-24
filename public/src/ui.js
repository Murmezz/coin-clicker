import { getCoins, getHighscore } from './user.js';
import { makeTransfer, renderTransferHistory } from './transfers.js';

export function updateDisplays() {
    document.getElementById('coins').textContent = getCoins();
    document.getElementById('highscore').textContent = getHighscore();
}

export function showTransferPage() {
    const pagesContainer = document.getElementById('pages-container');
    pagesContainer.innerHTML = document.getElementById('transfer-page-template').innerHTML;
    pagesContainer.style.display = 'block';
    
    renderTransferHistory();
    
    document.getElementById('send-coins').addEventListener('click', async () => {
        const result = await makeTransfer(
            document.getElementById('username').value,
            parseInt(document.getElementById('amount').value)
        );
        
        alert(result.message);
        if (result.success) updateDisplays();
    });
}