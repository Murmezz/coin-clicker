import { initUser, loadData, updateUserState, getUserId, getCoins, getHighscore } from './user.js';
import { showTransferPage, updateDisplays } from './ui.js';
import { db } from './firebase.js';

async function handleCoinClick() {
  try {
    const { db } = window.firebaseApp;
    const userId = getUserId();
    
    await db.ref(`users/${userId}`).transaction((user) => {
      if (user) {
        user.balance = (user.balance || 0) + 1;
        user.highscore = Math.max(user.highscore || 0, user.balance);
      }
      return user;
    });
    
    updateDisplays();
  } catch (error) {
    console.error('Click error:', error);
  }
}

function showSimplePage(title) {
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = `
        <div class="page">
            <div class="page-header">
                <button class="back-button">←</button>
                <h2 class="page-title">${title}</h2>
            </div>
            <div class="page-content">
                <p>Раздел в разработке</p>
            </div>
        </div>
    `;
    pagesContainer.style.display = 'block';
    
    const backButton = pagesContainer.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            pagesContainer.style.display = 'none';
        });
    }
}

async function initializeApp() {
    try {
        await initUser();
        await loadData();
        updateDisplays();

        const coinButton = document.querySelector('.coin-button');
        if (coinButton) {
            coinButton.addEventListener('click', handleCoinClick);
        }

        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page === 'transfer') {
                    showTransferPage();
                } else {
                    showSimplePage(btn.textContent);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
