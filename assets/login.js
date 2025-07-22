import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  addDoc 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 🔥 CONFIGURE COM SEUS DADOS!
const firebaseConfig = {
  apiKey: "AIzaSyC4-YX2cIXN5wEfTMG-CCiL-q6dJiL5EDs",
  authDomain: "paste-pro-5ce14.firebaseapp.com",
  projectId: "paste-pro-5ce14",
  storageBucket: "paste-pro-5ce14.appspot.com",
  messagingSenderId: "66327050528",
  appId: "1:66327050528:web:be6bdabdcec3c004f5ff45"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const toggleForm = document.getElementById("toggle-form");
const toast = document.getElementById("toast");

let isLogin = true;

submitBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (isLogin) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast("Login bem-sucedido!");
      window.location.href = "app.html";
    } catch (err) {
      showToast(err.message);
    }
  } else {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Cria o documento do usuário na coleção "users"
      await setDoc(doc(db, "users", userCred.user.uid), {
        email: email,
        admin: false,
        sound: true,
        subscriber: false
      });

      // Cria a categoria fixa "main" na subcoleção "categories"
      const categoriesCol = collection(db, "users", userCred.user.uid, "categories");
      await addDoc(categoriesCol, { name: "main" });

      showToast("Conta criada com sucesso!");
      setTimeout(() => {
        window.location.href = "app.html";
      }, 1000);
    } catch (err) {
      showToast(err.message);
    }
  }
});

toggleForm.addEventListener("click", () => {
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? "LOGIN" : "SIGN UP";
  submitBtn.textContent = isLogin ? "LOGIN" : "SIGN UP";
  toggleForm.textContent = isLogin ? "Do not have a account? Sign up" : "Already have a account? Login";
});

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 4000);
}
