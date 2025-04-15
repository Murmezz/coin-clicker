const coinButton = document.getElementById('coin');
const coinsDisplay = document.getElementById('coins');
let coins = localStorage.getItem('coins') || 0;
coinsDisplay.textContent = coins;

// Анимация клика + звук (опционально)
coinButton.addEventListener('click', () => {
    coins++;
    coinsDisplay.textContent = coins;
    localStorage.setItem('coins', coins);

    // Анимация
    coinButton.style.transform = 'scale(0.9)';
    setTimeout(() => {
        coinButton.style.transform = 'scale(1)';
    }, 100);

    // Вращение монеты
    const img = coinButton.querySelector('img');
    img.style.transform = 'rotate(15deg)';
    setTimeout(() => {
        img.style.transform = 'rotate(0)';
    }, 200);

    // Звук клика (раскомментируй, если добавишь файл click.mp3)
    // new Audio('click.mp3').play().catch(e => console.log("Sound error:", e));
});

// Сброс прогресса (для теста, можно удалить)
console.log("Чтобы сбросить счётчик, введи localStorage.clear()");