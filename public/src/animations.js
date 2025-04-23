// Эффект клика по монете
export const animateCoinClick = (element, clickX, clickY) => {
    // 1. Наклон в сторону клика (10 градуров максимум)
    const tiltX = ((clickX - element.offsetWidth/2) / element.offsetWidth) * 10;
    const tiltY = ((clickY - element.offsetHeight/2) / element.offsetHeight) * -10;
    
    element.style.transform = `
        perspective(500px)
        rotateX(${tiltY}deg)
        rotateY(${tiltX}deg)
        scale(0.95)
    `;
    
    // 2. Возврат в исходное состояние через 200ms
    setTimeout(() => {
        element.style.transform = '';
    }, 200);
};

// Эффект "+1" от точки клика к балансу
export const createPlusOne = (startX, startY) => {
    const effect = document.createElement('div');
    effect.className = 'plus-one-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    // Рассчет конечной позиции (к балансу)
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const balanceRect = balanceEl.getBoundingClientRect();
        effect.style.setProperty('--target-x', `${balanceRect.left - startX}px`);
        effect.style.setProperty('--target-y', `${balanceRect.top - startY}px`);
    }
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
};
