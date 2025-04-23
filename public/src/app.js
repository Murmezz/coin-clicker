// Настройки NVUTI
let nvutiChance = 50; // Шанс выигрыша (%)
let nvutiMultiplier = 2; // Множитель (x2, x3...)
let nvutiBetAmount = 10; // Ставка по умолчанию

// Показываем меню игр
function showGamesMenu() {
  WebApp.showPopup(`
    <div class="games-menu">
      <h3>🎮 Игры</h3>
      <button onclick="startNvutiGame()">🎲 NVUTI (Рандом)</button>
    </div>
  `, { width: 300, height: 150 });
}

// Запуск NVUTI
function startNvutiGame() {
  WebApp.showPopup(`
    <div class="nvuti-game">
      <h3>🎲 NVUTI</h3>
      
      <div class="settings">
        <p>Шанс: <span id="nvutiChance">${nvutiChance}%</span></p>
        <input type="range" min="5" max="95" value="${nvutiChance}" 
               oninput="updateNvutiChance(this.value)">
        
        <p>Множитель: <span id="nvutiMultiplier">x${nvutiMultiplier}</span></p>
        <input type="range" min="1.1" max="10" step="0.1" value="${nvutiMultiplier}" 
               oninput="updateNvutiMultiplier(this.value)">
        
        <p>Ставка: <span id="nvutiBet">${nvutiBetAmount}</span> монет</p>
        <button onclick="changeNvutiBet(-5)">-5</button>
        <button onclick="changeNvutiBet(5)">+5</button>
      </div>
      
      <button class="bet-button" onclick="placeNvutiBet()">Поставить ${nvutiBetAmount} монет</button>
    </div>
  `, { width: 320, height: 300 });
}

// Обновляем шанс и множитель
function updateNvutiChance(value) {
  nvutiChance = parseInt(value);
  document.getElementById("nvutiChance").textContent = value + "%";
  // Автоподбор множителя (чем меньше шанс, тем выше множитель)
  nvutiMultiplier = (100 / nvutiChance).toFixed(1);
  document.getElementById("nvutiMultiplier").textContent = "x" + nvutiMultiplier;
}

function updateNvutiMultiplier(value) {
  nvutiMultiplier = parseFloat(value).toFixed(1);
  document.getElementById("nvutiMultiplier").textContent = "x" + nvutiMultiplier;
}

// Меняем ставку
function changeNvutiBet(amount) {
  nvutiBetAmount = Math.max(1, nvutiBetAmount + amount);
  document.getElementById("nvutiBet").textContent = nvutiBetAmount;
  document.querySelector(".bet-button").textContent = `Поставить ${nvutiBetAmount} монет`;
}

// Делаем ставку
function placeNvutiBet() {
  if (coins < nvutiBetAmount) {
    WebApp.showAlert("Недостаточно монет!");
    return;
  }

  const random = Math.random() * 100;
  const isWin = random <= nvutiChance;

  if (isWin) {
    const winAmount = Math.floor(nvutiBetAmount * nvutiMultiplier);
    coins += winAmount;
    WebApp.showAlert(`🎉 Выигрыш! +${winAmount} монет!`);
  } else {
    coins -= nvutiBetAmount;
    WebApp.showAlert(`😢 Проигрыш... -${nvutiBetAmount} монет.`);
  }
  
  updateCoinsDisplay();
}
