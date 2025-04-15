// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем на весь экран

let coins = 0;
let autoIncome = 0;

const coinsDisplay = document.getElementById("coins");
const clickBtn = document.getElementById("clickBtn");
const upgradeBtns = document.querySelectorAll(".upgrade-btn");

// Загрузка данных (если есть)
if (tg.initDataUnsafe.user) {
    const userId = tg.initDataUnsafe.user.id;
    const savedData = localStorage.getItem(`coin_clicker_${userId}`);
    if (savedData) {
        const data = JSON.parse(savedData);
        coins = data.coins;
        autoIncome = data.autoIncome;
        updateUI();
    }
}

// Клик по коину
clickBtn.addEventListener("click", () => {
    coins++;
    updateUI();
    saveData();
});

// Покупка улучшений
upgradeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const cost = parseInt(btn.dataset.cost);
        const income = parseInt(btn.dataset.income);

        if (coins >= cost) {
            coins -= cost;
            autoIncome += income;
            updateUI();
            saveData();
        }
    });
});

// Автоматическая добыча
setInterval(() => {
    if (autoIncome > 0) {
        coins += autoIncome;
        updateUI();
        saveData();
    }
}, 1000);

// Обновление интерфейса
function updateUI() {
    coinsDisplay.textContent = coins;
    upgradeBtns.forEach(btn => {
        const cost = parseInt(btn.dataset.cost);
        btn.disabled = coins < cost;
    });
}

// Сохранение данных
function saveData() {
    if (tg.initDataUnsafe.user) {
        const userId = tg.initDataUnsafe.user.id;
        const data = { coins, autoIncome };
        localStorage.setItem(`coin_clicker_${userId}`, JSON.stringify(data));
    }
}