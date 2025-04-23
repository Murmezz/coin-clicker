export const createPlusOneEffect = (startX, startY) => {
    const effect = document.createElement('div');
    effect.className = 'plus-one-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const balanceRect = balanceEl.getBoundingClientRect();
        const targetX = balanceRect.left - startX;
        const targetY = balanceRect.top - startY;
        
        effect.style.setProperty('--target-x', `${targetX}px`);
        effect.style.setProperty('--target-y', `${targetY}px`);
    }
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};
