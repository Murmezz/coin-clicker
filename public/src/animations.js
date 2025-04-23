// animations.js
export const createCoinEffect = (startX, startY) => {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const balanceRect = balanceEl.getBoundingClientRect();
        effect.style.setProperty('--target-x', `${balanceRect.left - startX + 15}px`);
        effect.style.setProperty('--target-y', `${balanceRect.top - startY - 15}px`);
    }
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};

export const tiltCoin = (element, clickX, clickY) => {
    const rect = element.getBoundingClientRect();
    const tiltX = ((clickX - rect.width/2) / 50);
    const tiltY = ((clickY - rect.height/2) / -50);
    
    element.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg) scale(0.95)`;
    setTimeout(() => element.style.transform = '', 200);
};
