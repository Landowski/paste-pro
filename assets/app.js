import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, setDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 🔥 CONFIGURE SEUS DADOS!
const firebaseConfig = {
  apiKey: "AIzaSyC4-YX2cIXN5wEfTMG-CCiL-q6dJiL5EDs",
  authDomain: "paste-pro-5ce14.firebaseapp.com",
  projectId: "paste-pro-5ce14",
  storageBucket: "paste-pro-5ce14.firebasestorage.app",
  messagingSenderId: "66327050528",
  appId: "1:66327050528:web:be6bdabdcec3c004f5ff45"
};

const loadingMessage = document.getElementById("loading-message");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let isPro = false;
let currentNoteId = null;

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = "login.html";
    return;
  }
  user = u;

  let currentCategoryId = null; // Armazena a categoria ativa
const listsToggle = document.getElementById("lists");
const listsDropdown = document.getElementById("lists-dropdown");

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

// Carrega categorias
async function loadCategories() {
  const catsCol = collection(db, "users", user.uid, "categories");
  const snapshot = await getDocs(catsCol);
  const catsArray = [];

  snapshot.forEach(docSnap => {
    const cat = docSnap.data();
    catsArray.push({
      id: docSnap.id,
      name: cat.name,
      protected: cat.protected || false
    });
  });

  listsDropdown.innerHTML = "";
  catsArray.forEach(cat => {
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
      <span>${cat.name}</span>
      <div class="category-actions">
        ✏️ 
        ${!cat.protected ? '🗑️' : ''}
      </div>
    `;

    div.querySelector("span").onclick = () => {
      listsToggle.querySelector("div").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#59636e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg> ${cat.name}`;
      currentCategoryId = cat.id;
      listsDropdown.style.display = "none";
      loadNotes();
    };

    div.querySelector(".category-actions").children[0].onclick = async (e) => {
      e.stopPropagation();
      const newName = prompt("Novo nome:", cat.name);
      if (newName && newName.trim()) {
        const ref = doc(db, "users", user.uid, "categories", cat.id);
        await updateDoc(ref, { name: newName.trim() });
        loadCategories();
      }
    };

    if (!cat.protected) {
      div.querySelector(".category-actions").children[1].onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Excluir "${cat.name}"? Isso apagará todos os snippets desta lista.`)) {
          // Deleta todos snippets da categoria
          const snippetsCol = collection(db, "users", user.uid, "snippets");
          const snaps = await getDocs(snippetsCol);
          snaps.forEach(async s => {
            if (s.data().categoryId === cat.id) {
              await deleteDoc(doc(db, "users", user.uid, "snippets", s.id));
            }
          });
          await deleteDoc(doc(db, "users", user.uid, "categories", cat.id));
          loadCategories();
          currentCategoryId = null;
          loadNotes();
        }
      };
    }

    listsDropdown.appendChild(div);
  });

  // Botão adicionar nova lista
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

// Recarrega notas filtradas
async function loadNotes() {
  const snippetsCol = collection(db, "users", user.uid, "snippets");
  let qSnap = await getDocs(snippetsCol);

  notesList.innerHTML = "";
  qSnap.forEach(docSnap => {
    const snip = docSnap.data();
    if (currentCategoryId && snip.categoryId !== currentCategoryId) return;
    const div = document.createElement("div");
    div.textContent = snip.title || "Sem título";
    div.onclick = () => openNote(docSnap.id);
    notesList.appendChild(div);
  });
  notesList.style.display = "flex";
}

loadCategories();


  loadNotes();
  loadingMessage.style.display = "none";
});

const notesList = document.getElementById("notes-list");
const newNoteBtn = document.getElementById("new-note");

newNoteBtn.addEventListener("click", () => {
  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "flex";
  document.getElementById("note-title").value = "";
  document.getElementById("note-content").value = "";
  currentNoteId = null;
});

  // 👇 Cria também o index auxiliar
  const notesIndexRef = doc(db, "notesIndex", docRef.id);
  await setDoc(notesIndexRef, {
    userId: user.uid
  });
  loadNotes();
  openNote(docRef.id);
  showToast("Nova nota criada", "verde");
});

async function loadNotes() {
  const notesCol = collection(db, "users", user.uid, "notes");
  const snapshot = await getDocs(notesCol);

  // Cria array e ordena
  const notesArray = [];
  snapshot.forEach(docSnap => {
    const note = docSnap.data();
    notesArray.push({
      id: docSnap.id,
      titulo: note.titulo || `Nota ${docSnap.id.substring(0, 5)}`,
      ordem: note.ordem || 0
    });
  });

  notesArray.sort((a, b) => a.ordem - b.ordem);

  notesList.innerHTML = "";
  notesArray.forEach(note => {
    const div = document.createElement("div");
    div.id = `note-item-${note.id}`;
    div.dataset.id = note.id; // Necessário para sortable
    div.textContent = note.titulo;
    div.onclick = () => openNote(note.id);
    notesList.appendChild(div);
    notesList.style.display = "flex";
  });

  // Inicializa SortableJS
  Sortable.create(notesList, {
    animation: 150,
    onEnd: saveNewOrder
  });
}

async function saveNewOrder() {
  const items = document.querySelectorAll("#notes-list div");
  for (let i = 0; i < items.length; i++) {
    const noteId = items[i].dataset.id;
    const noteRef = doc(db, "users", user.uid, "notes", noteId);
    await updateDoc(noteRef, { ordem: i });
  }
}

async function saveNewNote() {
  const title = document.getElementById("note-title").value.trim();
  const content = document.getElementById("note-content").value.trim();

  if (!title) return alert("Título é obrigatório");

  const newNote = {
    title: title,
    content: content,
    categoryId: currentCategoryId || null
  };
  const ref = await addDoc(collection(db, "users", user.uid, "snippets"), newNote);
  openNote(ref.id);
  loadNotes();
}

async function openNote(id) {
  currentNoteId = id;
  const noteRef = doc(db, "users", user.uid, "notes", id);
  const noteDoc = await getDoc(noteRef);
  const note = noteDoc.data();

  document.getElementById("home").style.display = "none";
  document.getElementById("editor").style.display = "flex";
  document.getElementById("note-title").value = note.titulo || "";
  document.getElementById("note-content").value = note.texto;
  document.getElementById("public-toggle").checked = note.publica;

  const shareLink = `${window.location.origin}/p.html?id=${id}`;
  const shareLinkDiv = document.getElementById("link-container");
  let link = document.getElementById("share-link");
  link.innerHTML = `<a href="${shareLink}" target="_blank">${shareLink}</a>`;

  // ✅ Mostra ou esconde o link com base no toggle
  if (note.publica) {
    shareLinkDiv.style.display = "flex";
  } else {
    shareLinkDiv.style.display = "none";
  }

  // Marca selected na sidebar
  document.querySelectorAll("#notes-list div").forEach(div => div.classList.remove("selected"));
  const selectedItem = document.getElementById(`note-item-${id}`);
  if (selectedItem) {
    selectedItem.classList.add("selected");
  }
}

const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

document.getElementById("note-content").addEventListener("input", debounce(async (e) => {
  if (!currentNoteId) return;
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { texto: e.target.value });
}, 500));

document.getElementById("note-title").addEventListener("input", debounce(async (e) => {
  if (!currentNoteId) return;
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { titulo: e.target.value });
  // Atualiza o título na sidebar em tempo real se quiser:
  updateSidebarTitle(currentNoteId, e.target.value);
}, 500));

function updateSidebarTitle(noteId, newTitle) {
  const item = document.getElementById(`note-item-${noteId}`);
  if (item) {
    item.textContent = newTitle || `Nota ${noteId.substring(0, 5)}`;
  }
}

document.getElementById("public-toggle").addEventListener("change", async (e) => {
  if (!currentNoteId) return;

  const shareLinkDiv = document.getElementById("link-container");
  const isTogglingToPrivate = !e.target.checked; // true se está tentando deixar privado

  // 🔧 CORREÇÃO: Se usuário FREE tenta deixar PRIVADO
  if (!isPro && isTogglingToPrivate) {
    showToast("Assine o plano Pro para deixar o texto privado", "verde");
    e.target.checked = true; // Força toggle voltar para ON
    shareLinkDiv.style.display = "flex";
    return;
  }

  // ✅ Usuário PRO ou está deixando público - pode prosseguir
  const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
  await updateDoc(noteRef, { publica: e.target.checked });

  if (e.target.checked) {
    shareLinkDiv.style.display = "flex";
    showToast("Texto compartilhado publicamente", "azul");
  } else {
    shareLinkDiv.style.display = "none";
    showToast("Texto privado", "azul");
  }
});

document.getElementById("delete-note").addEventListener("click", async () => {
  if (!currentNoteId) return;
  if (confirm("Deseja excluir esta nota?")) {
    try {
      // 1️⃣ Exclui a nota
      const noteRef = doc(db, "users", user.uid, "notes", currentNoteId);
      await deleteDoc(noteRef);
      
      // 2️⃣ Exclui o índice
      const indexRef = doc(db, "notesIndex", currentNoteId);
      await deleteDoc(indexRef);
      
      showToast("Texto excluído", "vermelho");
      document.getElementById("editor").style.display = "none";
      document.getElementById("home").style.display = "flex";
      loadNotes();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      showToast("Erro ao excluir texto", "vermelho");
    }
  }
});

function showToast(msg, fundo) {
    const cores = {
        azul: '#0969da',
        preto: '#1f2328',
        vermelho: '#cf222e',
        verde: '#1f883d',
    };
    
    let divToast = document.createElement('div');
    divToast.innerHTML = `<div id="toast" style="background-color: ${cores[fundo]}">${msg}</div>`;
    document.getElementsByTagName('body')[0].appendChild(divToast);
    
    var notifica = document.getElementById("toast");
    notifica.className = "show"; 
    
    setTimeout(function() {
        notifica.className = "show hide";
        setTimeout(function() {
            document.getElementsByTagName('body')[0].removeChild(divToast);
        }, 600);
    }, 2500);
}

document.getElementById("copy").addEventListener("click", () => {
  const shareLink = document.getElementById("share-link").textContent;
  navigator.clipboard.writeText(shareLink).then(() => {
    showToast("Link copiado!", 'preto');
  })
});
