// Инициализация Firebase без модулей
const firebaseConfig = {
  apiKey: "AIzaSyBlB5mKpyKi2MVp2ZYqbE3kBc0VdmXr3Ik",
  authDomain: "fastcoin-7db18.firebaseapp.com",
  databaseURL: "https://fastcoin-7db18-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fastcoin-7db18",
  storageBucket: "fastcoin-7db18.appspot.com",
  messagingSenderId: "1024804439259",
  appId: "1:1024804439259:web:351a470a824712c494f8fe"
};

// Инициализируем Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Авторизуемся анонимно
auth.signInAnonymously()
  .catch(error => console.error("Auth error:", error));

// Экспортируем глобально (без модулей)
window.firebaseApp = {
  db,
  auth
};
