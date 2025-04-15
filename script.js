let coins = 0;

// Проверка подключения кнопки
const clickBtn = document.getElementById("clickBtn");
if (!clickBtn) {
  alert("ОШИБКА: Элемент clickBtn не найден!");
} else {
  clickBtn.addEventListener("click", () => {
    coins++;
    document.getElementById("coins").textContent = coins;
    
    // Визуальная отладка
    const debug = document.getElementById("debug");
    if (debug) debug.innerHTML = `Последний клик: ${new Date().toLocaleTimeString()}`;
  });
}