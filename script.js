// Инициализация Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvoUo12VfezS9NsRuvU2XdJiJtRguSVAo",
  projectId: "coins-d284d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Переменные игры
let coins = 0;
const userId = "user_" + Math.random().toString(36).substring(2);

// Элементы интерфейса
const coinsDisplay = document.getElementById("coins");

// Загрузка данных
async function loadData() {
  const docSnap = await getDoc(doc(db, "users", userId));
  if (docSnap.exists()) {
    coins = docSnap.data().coins || 0;
    updateUI();
  }
}

// Сохранение данных
async function saveData() {
  await setDoc(doc(db, "users", userId), { coins });
}

// Клик по кнопке
document.getElementById("clickBtn").addEventListener("click", async () => {
  coins++;
  updateUI();
  await saveData();
  console.log("+1 коин! Текущий баланс:", coins); // Для отладки
});

// Обновление интерфейса
function updateUI() {
  coinsDisplay.textContent = coins;
}

// Запуск
loadData();