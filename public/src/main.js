import { initUser, loadData, coins, highscore } from './user.js';
import { showTransferPage } from './ui.js';
import { updateDisplays } from './ui.js';

async function initializeApp() {
    await initUser();
    await loadData();

    // Coin click handler
    document.querySelector('.coin-button')?.addEventListener('click', async () => {
        coins++;
        if (coins > highscore) highscore = coins;
        updateDisplays();
        await db.ref(`users/${USER_ID}`).update({ 
            balance: coins, 
            highscore 
        });
    });

    // Navigation
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.page === 'transfer') showTransferPage();
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);