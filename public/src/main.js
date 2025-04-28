import { initUser, loadData, updateDisplays } from './user.js';
import { showTransferPage, getElement } from './ui.js';
import { initCoinGame } from './coinGame.js';

async function initializeApp() {
    try {
        await initUser();
        await loadData();
        updateDisplays();

        // Обработчики навигации
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    showTransferPage();
                } else if (btn.dataset.page === 'games') {
                    initCoinGame();
                }
            });
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);