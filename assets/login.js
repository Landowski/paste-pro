import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 🔥 CONFIGURE COM SEUS DADOS!
const firebaseConfig = {
  apiKey: "AIzaSyC4-YX2cIXN5wEfTMG-CCiL-q6dJiL5EDs",
  authDomain: "paste-pro-5ce14.firebaseapp.com",
  projectId: "paste-pro-5ce14",
  storageBucket: "paste-pro-5ce14.firebasestorage.app",
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
      await setDoc(doc(db, "users", userCred.user.uid), {
        email: email,
        assinante: false // Conta Free por padrão
      });
      showToast("Conta criada!");
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
  formTitle.textContent = isLogin ? "Login" : "Cadastro";
  submitBtn.textContent = isLogin ? "Entrar" : "Cadastrar";
  toggleForm.textContent = isLogin ? "Não tem uma conta? Crie uma" : "Já tem uma conta? Entre";
});

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}
