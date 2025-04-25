import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyBlB5mKpyKi2MVp2ZYqbE3kBc0VdmXr3Ik",
  authDomain: "fastcoin-7db18.firebaseapp.com",
  databaseURL: "https://fastcoin-7db18-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fastcoin-7db18",
  storageBucket: "fastcoin-7db18.appspot.com",
  messagingSenderId: "1024804439259",
  appId: "1:1024804439259:web:351a470a824712c494f8fe"
};

const app = firebase.initializeApp(firebaseConfig);

// Авторизация перед использованием
const auth = firebase.auth();
const db = firebase.database();

// Анонимная авторизация
auth.signInAnonymously()
  .then(() => console.log("Firebase auth success"))
  .catch((error) => console.error("Firebase auth error:", error));

export { db, auth };
