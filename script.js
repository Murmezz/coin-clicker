const coinContainer = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');
const floatingNumbers = document.getElementById('floating-numbers');

// Загружаем сохранённые данные
let coins = localStorage.getItem('coins') || 0;
let highscore = localStorage.getItem('highscore') || 0;

coinsDisplay.textContent = coins;
highscoreDisplay.textContent = highscore;

coinContainer.addEventListener('mousedown', function(e) {
    e.preventDefault();

    const rect = this.getBoundingClientRect();
    const radius = rect.width / 2;
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;

    // Вычисляем направление наклона
    const relX = (centerX - e.clientX) / radius;
    const relY = (centerY - e.clientY) / radius;

    // Анимация наклона
    const coinButton = this.querySelector('.coin-button');
    const tiltAngle = 12;
    coinButton.style.transform = `
        perspective(500px) 
        rotateX(${relY * tiltAngle}deg) 
        rotateY(${-relX * tiltAngle}deg) 
        scale(0.95)
    `;
});

coinContainer.addEventListener('mouseup', function(e) {
    const coinButton = this.querySelector('.coin-button');
    const rect = this.getBoundingClientRect();
    
    // Возврат в исходное положение
    coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';

    // Увеличиваем счётчик
    coins++;
    coinsDisplay.textContent = coins;

    // Обновляем рекорд
    if (coins > highscore) {
        highscore = coins;
        highscoreDisplay.textContent = highscore;
        localStorage.setItem('highscore', highscore);
    }

    localStorage.setItem('coins', coins);

    // Создаём летящее число
    createFloatingNumber(e.clientX, e.clientY);
});

function createFloatingNumber(startX, startY) {
    const numberElement = document.createElement('div');
    numberElement.className = 'floating-number';
    numberElement.textContent = '+1';
    
    // Позиция клика относительно контейнера
    const containerRect = coinContainer.getBoundingClientRect();
    const x = startX - containerRect.left;
    const y = startY - containerRect.top;
    
    // Позиция баланса относительно контейнера
    const balanceRect = document.querySelector('.balance').getBoundingClientRect();
    const targetX = balanceRect.left + balanceRect.width/2 - containerRect.left - x;
    const targetY = balanceRect.top - containerRect.top - y;
    
    // Устанавливаем начальную позицию
    numberElement.style.left = `${x}px`;
    numberElement.style.top = `${y}px`;
    
    // Передаём конечные координаты через CSS переменные
    numberElement.style.setProperty('--target-x', `${targetX}px`);
    numberElement.style.setProperty('--target-y', `${targetY}px`);
    
    floatingNumbers.appendChild(numberElement);
    
    // Удаляем элемент после анимации
    setTimeout(() => {
        numberElement.remove();
    }, 1000);
}

// Для мобильных устройств
coinContainer.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    this.dispatchEvent(mouseEvent);
});

coinContainer.addEventListener('touchend', function(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch.clientX,
        client