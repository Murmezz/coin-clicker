export const createDentEffect = (parentElement, clickX, clickY) => {
    const dent = document.createElement('div');
    dent.className = 'dent-effect';
    dent.style.left = `${clickX}px`;
    dent.style.top = `${clickY}px`;
    parentElement.appendChild(dent);
    setTimeout(() => dent.remove(), 300); // Уменьшили время
};

export const createCoinEffect = () => {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = '+1';
    
    // Фиксированная позиция справа от монеты
    const coinRect = document.getElementById('coin-button').getBoundingClientRect();
    effect.style.right = `${window.innerWidth - coinRect.right + 30}px`;
    effect.style.top = `${coinRect.top + coinRect.height/2 - 15}px`;
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 600); // Укороченная анимация
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
