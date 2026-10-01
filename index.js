import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBH4xNY0vcuM_NsGCGnRYEM_beGoQtZ_N0",
  authDomain: "sqwid-messenger.firebaseapp.com",
  databaseURL: "https://sqwid-messenger-default-rtdb.firebaseio.com",
  projectId: "sqwid-messenger",
  storageBucket: "sqwid-messenger.firebasestorage.app",
  messagingSenderId: "943129718217",
  appId: "1:943129718217:web:9e156626c721480a9c0c18"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const avatarPreviewText = document.getElementById("avatarPreviewText");
const registerFields = document.getElementById("registerFields");
const statusText = document.getElementById("status");

let avatarBase64 = null;

// Показываем поля имени/фото, когда пользователь начинает регистрацию
document.getElementById("btnRegister").addEventListener("focus", () => {
  registerFields.style.display = "block";
});

// Показываем поля по первому клику на "Зарегистрироваться"
let registerMode = false;
function enableRegisterMode() {
  registerMode = true;
  registerFields.style.display = "block";
}

// Просмотр выбранного фото
avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) {
    alert("Фото слишком большое. Выберите до 500 КБ");
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    avatarBase64 = e.target.result;
    avatarPreview.src = avatarBase64;
    avatarPreview.style.display = "block";
    avatarPreviewText.textContent = "Фото выбрано";
  };
  reader.readAsDataURL(file);
});

onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "chat.html";
});

// === Регистрация ===
async function register() {
  registerMode = true;
  registerFields.style.display = "block";

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const name = usernameInput.value.trim() || email.split("@")[0];

  if (!email || !password) {
    statusText.innerText = "Заполните email и пароль";
    return;
  }
  if (password.length < 6) {
    statusText.innerText = "Пароль минимум 6 символов";
    return;
  }

  statusText.innerText = "Регистрируем...";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, "users/" + cred.user.uid), {
      email: email,
      name: name,
      photo: avatarBase64 || null,
      hideEmail: false
    });
    statusText.innerText = "Готово! Теперь нажмите «Войти»";
  } catch (error) {
    statusText.innerText = translateError(error.code);
  }
}

// === Вход ===
async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    statusText.innerText = "Заполните email и пароль";
    return;
  }
  statusText.innerText = "Входим...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "chat.html";
  } catch (error) {
    statusText.innerText = translateError(error.code);
  }
}

// === Сброс пароля ===
async function resetPassword() {
  const email = emailInput.value.trim();
  if (!email) {
    statusText.innerText = "Введите email";
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    statusText.innerText = "Письмо отправлено. Проверьте папку «Спам», если не видите входящее";
  } catch (error) {
    statusText.innerText = translateError(error.code);
  }
}

document.getElementById("btnLogin").addEventListener("click", login);
document.getElementById("btnRegister").addEventListener("click", register);
document.getElementById("btnReset").addEventListener("click", resetPassword);

[emailInput, passwordInput].forEach(input => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });
});

function translateError(code) {
  const map = {
    "auth/invalid-email": "Неверный формат email",
    "auth/user-not-found": "Пользователь не найден",
    "auth/wrong-password": "Неверный пароль",
    "auth/invalid-credential": "Неверный email или пароль",
    "auth/email-already-in-use": "Этот email уже зарегистрирован",
    "auth/weak-password": "Пароль слишком короткий",
    "auth/too-many-requests": "Слишком много попыток. Подождите",
    "auth/network-request-failed": "Нет интернета",
    "auth/operation-not-allowed": "Вход по email выключен"
  };
  return map[code] || ("Ошибка: " + code);
}

console.log("index.js загружен");