import { initUser, loadData, coins, highscore, USER_ID } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

async function initializeApp() {
    await initUser();
    await loadData();

    // Клик по монете
    document.querySelector('.coin-button')?.addEventListener('click', async () => {
        coins++;
        if (coins > highscore) highscore = coins;
        updateDisplays();
        await db.ref(`users/${USER_ID}`).update({ 
            balance: coins, 
            highscore 
        });
    });

    // Навигация
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            const pagesContainer = document.getElementById('pages-container');
            
            if (page === 'transfer') {
                showTransferPage();
            } else {
                const defaultPage = document.getElementById('default-page');
                pagesContainer.innerHTML = '';
                const pageClone = defaultPage.cloneNode(true);
                pageClone.querySelector('.page-title').textContent = btn.textContent;
                pagesContainer.appendChild(pageClone);
                pagesContainer.style.display = 'block';

                pageClone.querySelector('.back-button').addEventListener('click', () => {
                    pagesContainer.style.display = 'none';
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);