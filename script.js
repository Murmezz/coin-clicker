const coinContainer = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');

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

coinContainer.addEventListener('mouseup', function() {
    const coinButton = this.querySelector('.coin-button');
    
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
});

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
    this.dispatchEvent(new MouseEvent('mouseup'));
});

// Блокировка нежелательных действий
coinContainer.addEventListener('contextmenu', (e) => e.preventDefault());
coinContainer.addEventListener('dragstart', (e) => e.preventDefault());