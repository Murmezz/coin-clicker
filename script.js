// Полная реализация с вашим Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ваша конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCvoUo12VfezS9NsRuvU2XdJiJtRguSVAo",
  authDomain: "coins-d284d.firebaseapp.com",
  projectId: "coins-d284d",
  storageBucket: "coins-d284d.firebasestorage.app",
  messagingSenderId: "261873801666",
  appId: "1:261873801666:web:516f1bf88de4a8ddd29e5b",
  measurementId: "G-MQ5GG8NFH9"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Переменные игры
let coins = 0;
let autoIncome = 0;
let upgradeCost = 100; // Начальная стоимость
let upgradeCount = 0; // Количество купленных улучшений
const userId = Telegram.WebApp.initDataUnsafe.user?.id || "guest_" + Math.random().toString(36).substring(2);

// Элементы интерфейса
const coinsDisplay = document.getElementById("coins");
const incomeDisplay = document.getElementById("autoIncome");
const costDisplay = document.getElementById("upgradeCost");
const clickBtn = document.getElementById("clickBtn");

// Загрузка данных
async function loadData() {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    coins = data.coins || 0;
    autoIncome = data.autoIncome || 0;
    upgradeCost = data.upgradeCost || 100;
    upgradeCount = data.upgradeCount || 0;
    updateUI();
  }
  
  // Режим реального времени
  onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      coins = data.coins;
      autoIncome = data.autoIncome;
      upgradeCost = data.upgradeCost;
      upgradeCount = data.upgradeCount;
      updateUI();
    }
  });
}

// Сохранение данных
async function saveData() {
  await setDoc(doc(db, "users", userId), {
    coins,
    autoIncome,
    upgradeCost,
    upgradeCount,
    lastUpdate: new Date()
  });
}

// Покупка улучшения
async function buyUpgrade() {
  if (coins >= upgradeCost) {
    coins -= upgradeCost;
    autoIncome += 1;
    upgradeCount += 1;
    upgradeCost = Math.floor(100 * Math.pow(1.1, upgradeCount)); // +10% за каждое улучшение
    await saveData();
    updateUI();
    
    Telegram.WebApp.HapticFeedback.impactOccurred("light");
  } else {
    Telegram.WebApp.showAlert("Недостаточно коинов!");
  }
}

// Клик по коину
clickBtn.addEventListener("click", async () => {
  coins++;
  updateUI();
  await saveData();
  Telegram.WebApp.HapticFeedback.impactOccurred("soft");
});

// Автоматическая добыча
setInterval(async () => {
  if (autoIncome > 0) {
    coins += autoIncome;
    updateUI();
    await saveData();
  }
}, 1000);

// Обновление интерфейса
function updateUI() {
  coinsDisplay.textContent = coins;
  incomeDisplay.textContent = `${autoIncome}/сек`;
  costDisplay.textContent = upgradeCost;
  
  // Обновляем кнопку улучшения
  const upgradeBtn = document.getElementById("upgradeBtn");
  upgradeBtn.disabled = coins < upgradeCost;
  upgradeBtn.textContent = `Улучшить (+1/сек) - ${upgradeCost} коинов`;
}

// Инициализация
Telegram.WebApp.ready();
Telegram.WebApp.expand();
loadData();