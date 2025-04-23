export const createDentEffect = (parentElement, clickX, clickY) => {
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${clickX}px`;
    dent.style.top = `${clickY}px`;
    parentElement.appendChild(dent);
    setTimeout(() => dent.remove(), 300); // Уменьшили время
};

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

export const tiltCoin = (element, clickX, clickY) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Уменьшенный наклон (15 градусов вместо 20)
    const tiltX = ((clickX - centerX) / centerX) * 15;
    const tiltY = ((clickY - centerY) / centerY) * -15;
    
    element.style.transform = `
        perspective(800px)
        rotateX(${tiltY}deg)
        rotateY(${tiltX}deg)
        scale(0.95)
    `;
    
    setTimeout(() => {
        element.style.transform = '';
    }, 250); // Укороченная анимация
};
