import { initUser, loadData, getCoins, updateUserState } from './user.js';
import { updateDisplays } from './ui.js';

let localCoins = 0;

async function handleCoinClick() {
    localCoins++;
    updateUserState({ coins: localCoins });
    updateDisplays();
    
    document.querySelector('.coin-button').style.transform = 'scale(0.9)';
    setTimeout(() => {
        document.querySelector('.coin-button').style.transform = 'scale(1)';
    }, 100);
}

async function initializeApp() {
    await initUser();
    localCoins = getCoins();
    updateDisplays();
    
    document.querySelector('.coin-button').addEventListener('click', handleCoinClick);
    
    setInterval(async () => {
        await db.ref(`users/${getUserId()}`).update({
            balance: localCoins
        });
    }, 5000);
}

document.addEventListener('DOMContentLoaded', initializeApp);