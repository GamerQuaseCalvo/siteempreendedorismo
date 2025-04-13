const form = document.getElementById("postForm");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const postsContainer = document.getElementById("posts");
const pointsDisplay = document.getElementById("points");
const usernameDisplay = document.getElementById("usernameDisplay");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");
const focusTarget = document.getElementById("focusTarget");

let username = localStorage.getItem("username_posts") || "";
let posts = [];
let formVisible = true;
let atalhosAtivos = true;

const atalhoIndicador = document.createElement("div");
atalhoIndicador.innerText = "Atalhos desligados";
atalhoIndicador.style.cssText = `
  position: fixed;
  bottom: 10px;
  right: 15px;
  background: rgba(0, 0, 0, 0.05);
  color: #555;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  display: none;
  z-index: 1000;
`;
document.body.appendChild(atalhoIndicador);

function validarNome(nome) {
  return /^[a-zA-Zà-úÀ-Ú\s]+$/.test(nome.trim());
}

async function definirNome(nome) {
  nome = nome.trim();
  if (!validarNome(nome)) {
    alert("O nome deve conter apenas letras e espaços.");
    return false;
  }
  username = nome.toLowerCase();
  localStorage.setItem("username_posts", username);
  usernameDisplay.innerText = username;
  return true;
}

if (!username || !validarNome(username)) {
  let novoNome = "";
  do {
    novoNome = prompt("Digite seu nome:");
  } while (!novoNome || !validarNome(novoNome));
  definirNome(novoNome);
} else {
  definirNome(username);
}

form.style.display = "flex";

const charCount = document.getElementById("charCount");
const maxLength = parseInt(titleInput.getAttribute("maxlength"));

titleInput.addEventListener("input", () => {
  const currentLength = titleInput.value.length;
  charCount.innerText = `${currentLength}/${maxLength}`;
  charCount.classList.toggle("limit", currentLength >= maxLength);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim().slice(0, maxLength);
  const content = contentInput.value.trim();
  if (!title || !content) return;

  const now = new Date();
  const dateString = now.toLocaleDateString("pt-BR");
  const timeString = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

  const post = {
    title,
    content,
    author: username,
    timestamp: `${dateString} às ${timeString}`,
    guia_id: "default"
  };

  await fetch("/add_post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post)
  });

  posts.unshift(post);
  displayPosts(true);

  const nomeValido = validarNome(username);
  if (nomeValido) {
    await fetch("/adicionar_ponto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: username })
    });
  }

  await updatePointsDisplay();
  form.reset();
  charCount.innerText = `0/${maxLength}`;
  postsContainer.scrollTop = 0;
});

function displayPosts(animated = false) {
  postsContainer.innerHTML = "";
  posts.forEach((post, index) => {
    const postEl = document.createElement("div");
    postEl.className = "post";
    postEl.innerText = post.title;
    postEl.addEventListener("click", () => openPost(post));
    if (animated) {
      postEl.style.animation = `fadeInUp 0.4s ease ${(index * 0.05)}s both`;
    }
    postsContainer.appendChild(postEl);
  });
}

function openPost(post) {
  modalTitle.innerText = post.title;
  modalContent.innerHTML = `
    <p>${post.content}</p>
    <br>
    <p style="font-size: 0.9rem; color: #666; text-align: right;">
      por ${post.author}, em ${post.timestamp}
    </p>
  `;
  modal.style.display = "flex";
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Alt") {
    atalhosAtivos = !atalhosAtivos;
    atalhoIndicador.style.display = atalhosAtivos ? "none" : "block";
    setTimeout(() => focusTarget.focus(), 50);
    return;
  }

  if (!atalhosAtivos) return;

  if (e.key === "Shift") {
    formVisible = !formVisible;
    form.style.display = formVisible ? "flex" : "none";
    postsContainer.classList.toggle("full-height", !formVisible);
  }

  if (e.ctrlKey) {
    const newName = prompt("Digite seu novo nome:");
    if (newName) {
      definirNome(newName).then(updatePointsDisplay);
    }
  }

  if (e.key === "Escape" && modal.style.display === "flex") {
    modal.style.display = "none";
  }
});

async function updatePointsDisplay() {
  const res = await fetch("/get_pontos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: username })
  });
  const pontos = await res.json();
  pointsDisplay.innerText = pontos;
}

async function carregarPosts() {
  const res = await fetch("/posts");
  const novosPosts = await res.json();
  const mudou = JSON.stringify(novosPosts) !== JSON.stringify(posts);
  posts = novosPosts;
  if (mudou) displayPosts(true);
}

updatePointsDisplay();
carregarPosts();
setInterval(carregarPosts, 3000);
