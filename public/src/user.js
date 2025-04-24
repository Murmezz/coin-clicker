// user.js
let state = {
    USER_ID: '',
    coins: 0,
    // ... остальные поля
};

async function saveToDatabase() {
    try {
        await firebase.database().ref(`users/${state.USER_ID}`).update({
            balance: state.coins,
            highscore: state.highscore,
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });
        console.log("Данные сохранены в Firebase");
    } catch (error) {
        console.error("Ошибка сохранения:", error);
    }
}

function updateUserState(newState) {
    state = { ...state, ...newState };
    saveToDatabase(); // Автосохранение при любом изменении
    window.uiModule.updateDisplays();
}