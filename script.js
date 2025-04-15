// Улучшенная функция сохранения
async function saveData() {
  try {
    await setDoc(doc(db, "users", userId), {
      coins: coins,
      autoClickers: autoClickers,
      upgradeCost: upgradeCost,
      lastSave: new Date()
    }, { merge: true }); // Ключевой параметр!
    console.log("Данные сохранены");
  } catch (error) {
    console.error("Ошибка сохранения:", error);
  }
}