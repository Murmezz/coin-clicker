import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database-compat.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlB5mKpyKi2MVp2ZYqbE3kBc0VdmXr3Ik",
  authDomain: "fastcoin-7db18.firebaseapp.com",
  databaseURL: "https://fastcoin-7db18-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fastcoin-7db18",
  storageBucket: "fastcoin-7db18.appspot.com",
  messagingSenderId: "1024804439259",
  appId: "1:1024804439259:web:351a470a824712c494f8fe"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Авторизуемся анонимно
signInAnonymously(auth)
  .catch((error) => console.error("Auth error:", error));

// Явно экспортируем необходимые объекты
export { db, auth };
