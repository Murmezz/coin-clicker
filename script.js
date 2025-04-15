function createFloatingNumber(startX, startY) {
    const numberElement = document.createElement('div');
    numberElement.className = 'floating-number';
    numberElement.textContent = '+1';
    
    // Добавляем в общий контейнер, а не в coin-container
    const floatingContainer = document.querySelector('.floating-numbers-container') || 
                           (() => {
                             const container = document.createElement('div');
                             container.className = 'floating-numbers-container';
                             document.body.appendChild(container);
                             return container;
                           })();
    
    // Позиция баланса
    const balanceRect = document.querySelector('.balance').getBoundingClientRect();
    const targetX = balanceRect.left + balanceRect.width/2 - startX;
    const targetY = balanceRect.top - startY;
    
    // Устанавливаем начальную позицию
    numberElement.style.left = `${startX}px`;
    numberElement.style.top = `${startY}px`;
    
    // Передаём конечные координаты через CSS переменные
    numberElement.style.setProperty('--target-x', `${targetX}px`);
    numberElement.style.setProperty('--target-y', `${targetY}px`);
    
    floatingContainer.appendChild(numberElement);
    
    // Удаляем элемент после анимации
    setTimeout(() => {
        numberElement.remove();
        if (floatingContainer.children.length === 0) {
            floatingContainer.remove();
        }
    }, 1000);
}