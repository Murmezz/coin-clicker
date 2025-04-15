let saveTimeout;

async function saveData() {
  clearTimeout(saveTimeout);
  
  await setDoc(doc(db, "users", userId), {
    coins: coins,
    autoClickers: autoClickers,
    upgradeCost: upgradeCost,
    lastSave: new Date()
  }, { merge: true });
  
  // Автосохранение каждые 30 сек
  saveTimeout = setTimeout(saveData, 30000);
}

// Инициализация при загрузке
async function init() {
  const docSnap = await getDoc(doc(db, "users", userId));
  if (docSnap.exists()) {
    const data = docSnap.data();
    coins = data.coins || 0;
    autoClickers = data.autoClickers || 0;
    upgradeCost = data.upgradeCost || 100;
    updateUI();
  }
  saveData(); // Первое сохранение
}

// Вызывайте init() при запуске игры