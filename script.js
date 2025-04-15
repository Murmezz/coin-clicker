const coinButton = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
const highscoreDisplay = document.getElementById('highscore');

// Загружаем сохранённые данные
let coins = localStorage.getItem('coins') || 0;
let highscore = localStorage.getItem('highscore') || 0;

coinsDisplay.textContent = coins;
highscoreDisplay.textContent = highscore;

coinButton.addEventListener('click', () => {
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
    
    // Анимация
    const img = coinButton.querySelector('img');
    img.style.transform = 'rotate(20deg) scale(0.95)';
    setTimeout(() => {
        img.style.transform = 'rotate(0) scale(1)';
    }, 200);
});

// Сброс (для теста)
console.log("Сбросить прогресс: localStorage.clear()");