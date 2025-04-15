const coinButton = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');

// Загружаем сохранённые данные
let coins = localStorage.getItem('coins') || 0;
let highscore = localStorage.getItem('highscore') || 0;

coinsDisplay.textContent = coins;
highscoreDisplay.textContent = highscore;

coinButton.addEventListener('click', function(e) {
    // Получаем координаты клика относительно центра кнопки
    const rect = this.getBoundingClientRect();
    const radius = rect.width / 2;
    const centerX = rect.left + radius;
    const centerY = rect.top + radius;
    
    // Проверяем, находится ли клик внутри круга
    const distance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + 
        Math.pow(e.clientY - centerY, 2)
    );
    
    if (distance > radius) return; // Игнорируем клики вне круга
    
    // Вычисляем направление наклона (инвертированное)
    const relX = (centerX - e.clientX) / radius;
    const relY = (centerY - e.clientY) / radius;
    
    coins++;
    coinsDisplay.textContent = coins;
    
    // Обновляем рекорд
    if (coins > highscore) {
        highscore = coins;
        highscoreDisplay.textContent = highscore;
        localStorage.setItem('highscore', highscore);
    }
    
    localStorage.setItem('coins', coins);
    
    // Анимация с инвертированным наклоном
    const img = this.querySelector('img');
    const tiltAngle = 12; // Максимальный угол наклона
    img.style.transform = `
        perspective(500px) 
        rotateX(${-relY * tiltAngle}deg) 
        rotateY(${relX * tiltAngle}deg) 
        scale(0.95)
    `;
    
    setTimeout(() => {
        img.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
    }, 200);
});

// Блокируем все нежелательные события
coinButton.addEventListener('contextmenu', (e) => e.preventDefault());
coinButton.addEventListener('mousedown', (e) => e.preventDefault());
coinButton.addEventListener('dragstart', (e) => e.preventDefault());

// Сброс прогресса
console.log("Сбросить прогресс: localStorage.clear()");