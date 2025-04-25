// Вместо импорта используем глобальный объект
const { db, auth } = window.firebaseApp;

const state = {
  USER_ID: '',
  currentUsername: '',
  coins: 0,
  highscore: 0
};

export async function initUser() {
  try {
    // Ждем аутентификации
    await new Promise((resolve) => {
      auth.onAuthStateChanged(user => resolve(user));
    });

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    state.USER_ID = `tg_${tgUser.id || 'guest_' + Math.random().toString(36).substr(2, 8)}`;
    state.currentUsername = tgUser.username 
      ? `@${tgUser.username.toLowerCase()}` 
      : `@user${state.USER_ID.slice(-4)}`;

    // Создаем/обновляем пользователя
    await db.ref(`users/${state.USER_ID}`).update({
      username: state.currentUsername,
      balance: firebase.database.ServerValue.increment(0),
      highscore: firebase.database.ServerValue.increment(0)
    });

  } catch (error) {
    console.error('Init error:', error);
  }
}

export async function initUser() {
    try {
        await auth.signInAnonymously();
        
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        state.USER_ID = tgUser ? `tg_${tgUser.id}` : `local_${Math.random().toString(36).substr(2, 9)}`;
        
        // ГАРАНТИРОВАННОЕ создание username
        state.currentUsername = tgUser?.username 
            ? `@${tgUser.username.toLowerCase()}` 
            : `@user${state.USER_ID.slice(-4)}`;

        // Обязательное сохранение username в базу
        await db.ref(`users/${state.USER_ID}/username`).set(state.currentUsername);
        
        await loadData();
    } catch (error) {
        console.error('Init error:', error);
        state.USER_ID = `local_${Math.random().toString(36).substr(2, 9)}`;
        state.currentUsername = '@guest';
    }
}

export async function loadData() {
    return new Promise((resolve) => {
        db.ref(`users/${state.USER_ID}`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                updateUserState({
                    coins: data.balance || 0,
                    highscore: data.highscore || 0,
                    transferHistory: data.transfers || []
                });
            }
            resolve();
        });
    });
}
