const coinButton = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');

// Загружаем сохранённые данные
let coins = localStorage.getItem('coins') || 0;
let highscore = localStorage.getItem('highscore') || 0;

coinsDisplay.textContent = coins;
highscoreDisplay.textContent = highscore;

coinButton.addEventListener('click', function(e) {
    // Получаем координаты клика относительно кнопки
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Определяем направление наклона
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const angleX = ((y - centerY) / centerY) * 15;
    const angleY = ((centerX - x) / centerX) * 15;
    
    coins++;
    coinsDisplay.textContent = coins;
    
    // Обновляем рекорд
    if (coins > highscore) {
        highscore = coins;
        highscoreDisplay.textContent = highscore;
        localStorage.setItem('highscore', highscore);
    }
    
    // Сохраняем монеты
    localStorage.setItem('coins', coins);
    
    // Анимация наклона
    const img = this.querySelector('img');
    img.style.transform = `perspective(500px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale(0.95)`;
    
    setTimeout(() => {
        img.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale(1)';
    }, 200);
});

// Отключаем контекстное меню
coinButton.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Сброс (для теста)
console.log("Сбросить прогресс: localStorage.clear()");