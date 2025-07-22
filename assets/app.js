import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// CONFIG FIREBASE
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

let user = null;
let currentNoteId = null;
let currentCategoryId = null;

const loadingMessage = document.getElementById("loading-message");
const notesList = document.getElementById("notes-list");
const newNoteBtn = document.getElementById("new-note");
const listsToggle = document.getElementById("lists");
const listsDropdown = document.getElementById("lists-dropdown");

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = "login.html";
    return;
  }
  user = u;
  await loadCategories();
  await loadSnippets();
  loadingMessage.style.display = "none";
});

// Toggle dropdown
listsToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  listsDropdown.style.display = listsDropdown.style.display === "none" ? "flex" : "none";
});

// Fecha dropdown ao clicar fora
document.body.addEventListener("click", (e) => {
  if (!listsToggle.contains(e.target)) {
    listsDropdown.style.display = "none";
  }
});

async function loadCategories() {
  const catsCol = collection(db, "users", user.uid, "categories");
  const snapshot = await getDocs(catsCol);
  listsDropdown.innerHTML = "";

  snapshot.forEach(docSnap => {
    const cat = docSnap.data();
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
      <span>${cat.name}</span>
      <div class="category-actions">
        ✏️ ${!cat.protected ? '🗑️' : ''}
      </div>
    `;

    div.querySelector("span").onclick = () => {
      listsToggle.querySelector("div").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#59636e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg> ${cat.name}`;
      currentCategoryId = docSnap.id;
      listsDropdown.style.display = "none";
      loadSnippets();
    };

    div.querySelector(".category-actions").children[0].onclick = async (e) => {
      e.stopPropagation();
      const newName = prompt("Novo nome:", cat.name);
      if (newName && newName.trim()) {
        const ref = doc(db, "users", user.uid, "categories", docSnap.id);
        await updateDoc(ref, { name: newName.trim() });
        loadCategories();
      }
    };

    if (!cat.protected) {
      div.querySelector(".category-actions").children[1].onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Excluir "${cat.name}"? Isso apagará todos os snippets desta lista.`)) {
          const snippetsCol = collection(db, "users", user.uid, "snippets");
          const snaps = await getDocs(snippetsCol);
          snaps.forEach(async s => {
            if (s.data().categoryId === docSnap.id) {
              await deleteDoc(doc(db, "users", user.uid, "snippets", s.id));
            }
          });
          await deleteDoc(doc(db, "users", user.uid, "categories", docSnap.id));
          loadCategories();
          currentCategoryId = null;
          loadSnippets();
        }
      };
    }

    listsDropdown.appendChild(div);
  });

  const addBtn = document.createElement("div");
  addBtn.id = "add-category-btn";
  addBtn.innerHTML = "+ Nova Lista";
  addBtn.onclick = async () => {
    const newName = prompt("Nome da nova lista:");
    if (newName && newName.trim()) {
      await addDoc(collection(db, "users", user.uid, "categories"), { name: newName.trim(), protected: false });
      loadCategories();
    }
  };
  listsDropdown.appendChild(addBtn);
}

// Novo snippet
newNoteBtn.addEventListener("click", () => {
  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "flex";
  document.getElementById("note-title").value = "";
  document.getElementById("note-content").value = "";
  currentNoteId = null;
});

// Salvar novo ou editar
document.getElementById("note-title").addEventListener("blur", saveSnippet);
document.getElementById("note-content").addEventListener("blur", saveSnippet);

async function saveSnippet() {
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-content").value.trim();
  if (!title) return;

  if (currentNoteId) {
    const ref = doc(db, "users", user.uid, "snippets", currentNoteId);
    await updateDoc(ref, { title: title, content: content });
  } else {
    const newDoc = await addDoc(collection(db, "users", user.uid, "snippets"), {
      title: title,
      content: content,
      categoryId: currentCategoryId || null
    });
    currentNoteId = newDoc.id;
  }
  loadSnippets();
}

async function loadSnippets() {
  const snippetsCol = collection(db, "users", user.uid, "snippets");
  const snaps = await getDocs(snippetsCol);
  notesList.innerHTML = "";

  snaps.forEach(docSnap => {
    const s = docSnap.data();
    if (currentCategoryId && s.categoryId !== currentCategoryId) return;
    const div = document.createElement("div");
    div.textContent = s.title || "Sem título";
    div.onclick = () => openSnippet(docSnap.id);
    notesList.appendChild(div);
  });
  notesList.style.display = "flex";
}

async function openSnippet(id) {
  currentNoteId = id;
  const ref = doc(db, "users", user.uid, "snippets", id);
  const snap = await getDoc(ref);
  const s = snap.data();

  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "flex";
  document.getElementById("note-title").value = s.title || "";
  document.getElementById("note-content").value = s.content || "";
}

document.getElementById("delete-note").addEventListener("click", async () => {
  if (!currentNoteId) return;
  if (confirm("Excluir este snippet?")) {
    const ref = doc(db, "users", user.uid, "snippets", currentNoteId);
    await deleteDoc(ref);
    currentNoteId = null;
    document.getElementById("editor").style.display = "none";
    document.getElementById("home").style.display = "flex";
    loadSnippets();
  }
});
