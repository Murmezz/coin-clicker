// animations.js
export const createDentEffect = (parentElement, clickX, clickY) => {
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${clickX}px`;
    dent.style.top = `${clickY}px`;
    parentElement.appendChild(dent);
    setTimeout(() => dent.remove(), 600);
};

export const createCoinEffect = (startX, startY) => {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const rect = balanceEl.getBoundingClientRect();
        effect.style.setProperty('--target-x', `${rect.left - startX + 15}px`);
        effect.style.setProperty('--target-y', `${rect.top - startY - 15}px`);
    }
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};

export const tiltCoin = (element, clickX, clickY) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Усиленный наклон (до 20 градусов)
    const tiltX = ((clickX - centerX) / centerX) * 20;
    const tiltY = ((clickY - centerY) / centerY) * -20;
    
    element.style.transform = `
        perspective(1000px)
        rotateX(${tiltY}deg)
        rotateY(${tiltX}deg)
        scale(0.92)
    `;
    
    setTimeout(() => {
        element.style.transform = '';
    }, 400);
};
