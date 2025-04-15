const coinContainer = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');

// Загружаем сохранённые данные
let coins = localStorage.getItem('coins') || 0;
let highscore = localStorage.getItem('highscore') || 0;

coinsDisplay.textContent = coins;
highscoreDisplay.textContent = highscore;

coinContainer.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const radius = rect.width / 2;
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;
    
    // Вычисляем направление наклона (в ту же сторону, куда кликнули)
    const relX = (e.clientX - centerX) / radius;
    const relY = (e.clientY - centerY) / radius;
    
    coins++;
    coinsDisplay.textContent = coins;
    
    // Обновляем рекорд
    if (coins > highscore) {
        highscore = coins;
        highscoreDisplay.textContent = highscore;
        localStorage.setItem('highscore', highscore);
    }
    
    localStorage.setItem('coins', coins);
    
    // Анимация наклона
    const coinButton = this.querySelector('.coin-button');
    const tiltAngle = 12;
    coinButton.style.transform = `
        perspective(500px) 
        rotateX(${relY * tiltAngle}deg) 
        rotateY(${-relX * tiltAngle}deg) 
        scale(0.95)
    `;
    
    setTimeout(() => {
        coinButton.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
    }, 200);
});

// Полная блокировка действий по умолчанию
coinContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

coinContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    return false;
});

coinContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    return false;
});

// Сброс прогресса
console.log("Сбросить прогресс: localStorage.clear()");