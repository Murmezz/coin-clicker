export const createDentEffect = (parentElement, clickX, clickY) => {
    if (!parentElement) return;
    
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${clickX}px`;
    dent.style.top = `${clickY}px`;
    parentElement.appendChild(dent);
    
    setTimeout(() => dent.remove(), 600);
};

export const createCoinEffect = (startX, startY) => {
    const container = document.getElementById('effects-container');
    if (!container) return;
    
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const balanceRect = balanceEl.getBoundingClientRect();
        effect.style.setProperty('--target-x', `${balanceRect.left - startX + 30}px`);
        effect.style.setProperty('--target-y', `${balanceRect.top - startY - 30}px`);
    }
    
    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};

export const tiltCoin = (element, clickX, clickY) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const tiltX = ((clickX - rect.width/2) / rect.width) * 15;
    const tiltY = ((clickY - rect.height/2) / rect.height) * -15;
    
    element.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg) scale(0.95)`;
    setTimeout(() => element.style.transform = '', 300);
};
