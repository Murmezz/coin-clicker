// animations.js
export const createDentEffect = (parentElement, clickX, clickY) => {
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${clickX}px`;
    dent.style.top = `${clickY}px`;
    parentElement.appendChild(dent);
    
    // Анимация автоматически удалит элемент после завершения
    setTimeout(() => dent.remove(), 600);
};

export const createCoinEffect = (startX, startY) => {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    
    // Получаем позицию элемента с балансом
    const balanceEl = document.getElementById('coins');
    if (balanceEl) {
        const balanceRect = balanceEl.getBoundingClientRect();
        const targetX = balanceRect.left + balanceRect.width/2 - startX;
        const targetY = balanceRect.top + balanceRect.height/2 - startY;
        
        effect.style.setProperty('--target-x', `${targetX * 0.7}px`);
        effect.style.setProperty('--target-y', `${targetY * 0.7}px`);
    }
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
};

export const tiltCoin = (element, clickX, clickY) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Вычисляем направление наклона (макс 15 градусов)
    const tiltX = ((clickX - centerX) / centerX) * 15;
    const tiltY = ((clickY - centerY) / centerY) * -15;
    
    element.style.transform = `
        perspective(500px)
        rotateX(${tiltY}deg)
        rotateY(${tiltX}deg)
        scale(0.95)
    `;
    
    setTimeout(() => {
        element.style.transform = '';
    }, 300);
};
