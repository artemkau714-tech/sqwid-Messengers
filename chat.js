import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  remove,
  get,
  onValue,
  onChildAdded
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

const ADMIN_EMAIL = "artemkau714@gmail.com";
const RESERVED_SLUGS = ["sqwid", "admin", "support", "official", "help", "root"];
const ACCOUNTS_KEY = "sqwid_accounts";

let currentUser = null;
let currentUserData = {};
let currentChatId = null;
let currentChatData = null;
let userMap = {};
let unsubMessages = null;
let unsubChats = null;
let unsubLastRead = null;
let unsubAllMessages = null;
let chatAvatarBase64 = null;
let settingsAvatarBase64 = null;
let settingsAvatarChanged = false;
let pendingDeleteChatId = null;
let pendingDeleteChatData = null;
let selectedTariff = null;
let botStarted = false;
let pendingGivePlusUid = null;
let pendingGivePlusName = "";
let pendingGivePlusPeriod = null;
let searchTab = "people";
let lastReadMap = {};
let unreadCounts = {};
let toastTimer = null;
let msgListenerStart = 0;
let replyTo = null;

// ==== Модалки ====
function showAlert(text, title = "Сообщение") {
  return new Promise((resolve) => {
    document.getElementById("alertTitle").textContent = title;
    document.getElementById("alertText").textContent = text;
    document.getElementById("alertCancel").style.display = "none";
    document.getElementById("alertOk").textContent = "ОК";
    const modal = document.getElementById("modal-alert");
    modal.classList.add("active");
    const ok = document.getElementById("alertOk");
    const cancel = document.getElementById("alertCancel");
    const cleanup = () => {
      modal.classList.remove("active");
      ok.removeEventListener("click", onOk);
      cancel.removeEventListener("click", onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    ok.addEventListener("click", onOk);
    cancel.addEventListener("click", onCancel);
  });
}

function showConfirm(text, title = "Подтверждение") {
  return new Promise((resolve) => {
    document.getElementById("alertTitle").textContent = title;
    document.getElementById("alertText").textContent = text;
    document.getElementById("alertCancel").style.display = "block";
    document.getElementById("alertOk").textContent = "Да";
    const modal = document.getElementById("modal-alert");
    modal.classList.add("active");
    const ok = document.getElementById("alertOk");
    const cancel = document.getElementById("alertCancel");
    const cleanup = () => {
      modal.classList.remove("active");
      ok.removeEventListener("click", onOk);
      cancel.removeEventListener("click", onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    ok.addEventListener("click", onOk);
    cancel.addEventListener("click", onCancel);
  });
}

// ==== Toast и звук ====
function showToast(text) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Звук не сработал:", e);
  }
}

// ==== Авторизация ====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  currentUser = user;
  loadMyProfile();
  loadUsers();
  loadChats();
  loadLastRead();
  await checkInvite();
  checkAdmin();
  setTimeout(() => {
    saveCurrentAccount();
    listenAllNewMessages();
  }, 800);
});

function checkAdmin() {
  if (currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    document.getElementById("btnAdminPanel").style.display = "block";
  }
}

// ==== Мой профиль ====
function loadMyProfile() {
  onValue(ref(db, "users/" + currentUser.uid), (snapshot) => {
    currentUserData = snapshot.val() || {};
    let myName = currentUserData.name || currentUser.email.split("@")[0];
    const isMePlus = currentUserData.isPlus === true &&
      (!currentUserData.plusUntil || Date.now() < currentUserData.plusUntil);
    if (isMePlus) myName = "⭐ " + myName;
    document.getElementById("profileName").textContent = myName;

    const photo = document.getElementById("profilePhoto");
    if (currentUserData.photo) photo.src = currentUserData.photo;
    else photo.src = svgAvatar(currentUserData.name || "?");
    updateEmailVisibility();
  });
}

function updateEmailVisibility() {
  const emailSpan = document.getElementById("profileEmail");
  const btn = document.getElementById("btnToggleEmail");
  const hidden = currentUserData.hideEmail === true;
  emailSpan.textContent = hidden ? "••••••••" : currentUser.email;
  btn.textContent = hidden ? "Показать" : "Скрыть";
}

document.getElementById("btnToggleEmail").addEventListener("click", async () => {
  const v = !(currentUserData.hideEmail === true);
  await update(ref(db, "users/" + currentUser.uid), { hideEmail: v });
});

// ==== Меню ====
document.getElementById("btnBurger").addEventListener("click", () =>
  document.getElementById("profileMenu").classList.add("active"));
document.getElementById("btnCloseProfile").addEventListener("click", () =>
  document.getElementById("profileMenu").classList.remove("active"));
document.getElementById("btnAbout").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  document.getElementById("modal-about").classList.add("active");
});
document.getElementById("btnCloseAbout").addEventListener("click", () =>
  document.getElementById("modal-about").classList.remove("active"));
document.getElementById("btnLogout").addEventListener("click", () => {
  removeCurrentAccount();
  signOut(auth);
});

// ==== Навигация ====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
function goBack() {
  currentChatId = null;
  currentChatData = null;
  if (unsubMessages) { unsubMessages(); unsubMessages = null; }
  showScreen("screen-chats");
}
document.getElementById("btnBack").addEventListener("click", goBack);
document.getElementById("btnBackProfile").addEventListener("click", () => {
  if (currentChatId) {
    document.getElementById("chatTitle").textContent = currentChatData.name;
    showScreen("screen-messages");
  } else {
    showScreen("screen-chats");
  }
});
document.getElementById("btnBackSettings").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackMemory").addEventListener("click", () => showScreen("screen-settings"));
document.getElementById("btnBackPlus").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackBot").addEventListener("click", () => showScreen("screen-plus"));
document.getElementById("btnBackSearch").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackAdmin").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackAccounts").addEventListener("click", () => showScreen("screen-chats"));

// ==== Настройки ====
document.getElementById("btnSettings").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  openSettings();
});
document.getElementById("btnSaveSettings").addEventListener("click", saveSettings);

function openSettings() {
  settingsAvatarBase64 = null;
  settingsAvatarChanged = false;
  const photo = document.getElementById("settingsPhoto");
  if (currentUserData.photo) photo.src = currentUserData.photo;
  else photo.src = svgAvatar(currentUserData.name || "?");
  document.getElementById("settingsName").value = currentUserData.name || "";
  document.getElementById("settingsUsername").value = currentUserData.username || "";
  document.getElementById("settingsBio").value = currentUserData.bio || "";
  document.getElementById("settingsEmail").textContent = currentUser.email;
  document.getElementById("settingsShowUsername").checked = currentUserData.showUsername !== false;
  updateSettingsEmailBtn();
  showScreen("screen-settings");
}

function updateSettingsEmailBtn() {
  const btn = document.getElementById("btnToggleEmailSettings");
  const hidden = currentUserData.hideEmail === true;
  btn.textContent = hidden ? "Показать" : "Скрыть";
}

document.getElementById("btnToggleEmailSettings").addEventListener("click", async () => {
  const v = !(currentUserData.hideEmail === true);
  await update(ref(db, "users/" + currentUser.uid), { hideEmail: v });
});

document.getElementById("settingsAvatarInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) return showAlert("Фото до 500 КБ", "Слишком большое");
  const reader = new FileReader();
  reader.onload = ev => {
    settingsAvatarBase64 = ev.target.result;
    settingsAvatarChanged = true;
    document.getElementById("settingsPhoto").src = settingsAvatarBase64;
  };
  reader.readAsDataURL(file);
});

async function saveSettings() {
  const name = document.getElementById("settingsName").value.trim();
  const usernameRaw = document.getElementById("settingsUsername").value.trim().toLowerCase();
  const bio = document.getElementById("settingsBio").value.trim();
  const showUsername = document.getElementById("settingsShowUsername").checked;
  if (!name) return showAlert("Имя не может быть пустым", "Ошибка");

  let username = "";
  if (usernameRaw) {
    if (!/^[a-z0-9_]{3,20}$/.test(usernameRaw)) {
      return showAlert("Ник: только латиница, цифры и _, от 3 до 20 символов", "Ошибка");
    }
    username = usernameRaw;
    const allUsers = await get(ref(db, "users"));
    const users = allUsers.val() || {};
    for (const uid in users) {
      if (uid !== currentUser.uid && users[uid].username === username) {
        return showAlert("Этот ник уже занят", "Ошибка");
      }
    }
  }

  const updates = { name, username, bio, showUsername };
  if (settingsAvatarChanged && settingsAvatarBase64) updates.photo = settingsAvatarBase64;

  try {
    await update(ref(db, "users/" + currentUser.uid), updates);
    showAlert("Профиль сохранён", "Готово");
    showScreen("screen-chats");
  } catch (e) {
    showAlert("Ошибка: " + e.message, "Ошибка");
  }
}

// ==== Память ====
document.getElementById("btnMemory").addEventListener("click", () => openMemoryScreen());

async function openMemoryScreen() {
  document.getElementById("memoryTotal").textContent = "Считаем...";
  document.getElementById("memoryPhotos").textContent = "—";
  document.getElementById("memoryTexts").textContent = "—";
  showScreen("screen-memory");

  const snap = await get(ref(db, "messages"));
  const allChats = snap.val() || {};

  let photoBytes = 0;
  let photoCount = 0;
  let textCount = 0;

  for (const chatId in allChats) {
    const msgs = allChats[chatId] || {};
    for (const mid in msgs) {
      const m = msgs[mid];
      if (m.type === "photo" && m.photo) {
        photoCount++;
        photoBytes += m.photo.length;
      } else {
        textCount++;
      }
    }
  }

  document.getElementById("memoryTotal").textContent = formatBytes(photoBytes);
  document.getElementById("memoryPhotos").textContent = photoCount + " шт · " + formatBytes(photoBytes);
  document.getElementById("memoryTexts").textContent = textCount + " сообщений";
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + " МБ";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " ГБ";
}

document.getElementById("btnClearPhotos").addEventListener("click", async () => {
  const ok = await showConfirm(
    "Все фото во всех чатах будут удалены. Текст останется. Восстановить нельзя.",
    "Очистить фото?"
  );
  if (!ok) return;

  const snap = await get(ref(db, "messages"));
  const allChats = snap.val() || {};
  let removed = 0;

  for (const chatId in allChats) {
    const msgs = allChats[chatId] || {};
    for (const mid in msgs) {
      const m = msgs[mid];
      if (m.type === "photo" && m.photo) {
        await update(ref(db, "messages/" + chatId + "/" + mid), {
          type: "text",
          text: "[фото удалено]",
          photo: null
        });
        removed++;
      }
    }
  }

  showAlert(`Удалено фото: ${removed}`, "Готово");
  openMemoryScreen();
});

// ==== Аккаунты ====
function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); }
  catch { return []; }
}
function saveSavedAccounts(arr) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(arr)); }

function saveCurrentAccount() {
  const email = currentUser.email;
  const accounts = getSavedAccounts();
  const existing = accounts.find(a => a.email === email);
  if (existing) {
    existing.uid = currentUser.uid;
    existing.name = currentUserData.name || email.split("@")[0];
  } else {
    accounts.push({ email, uid: currentUser.uid, name: currentUserData.name || email.split("@")[0] });
  }
  saveSavedAccounts(accounts);
}

function removeCurrentAccount() {
  const email = currentUser.email;
  const accounts = getSavedAccounts().filter(a => a.email !== email);
  saveSavedAccounts(accounts);
}

document.getElementById("btnAccounts").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  renderAccounts();
  showScreen("screen-accounts");
});

function renderAccounts() {
  const list = document.getElementById("accountsList");
  list.innerHTML = "";
  const accounts = getSavedAccounts();

  if (accounts.length === 0) {
    list.innerHTML = `<li style="padding:20px;text-align:center;color:#8696a0;">Нет сохранённых аккаунтов</li>`;
    return;
  }

  accounts.forEach(acc => {
    const li = document.createElement("li");
    li.className = "account-row" + (acc.email === currentUser.email ? " current" : "");
    const isCurrent = acc.email === currentUser.email;
    let displayName = acc.name || acc.email.split("@")[0];

    li.innerHTML = `
      <div class="avatar">${escapeHtml(displayName.charAt(0).toUpperCase())}</div>
      <div class="info">
        <div class="name">${escapeHtml(displayName)}</div>
        <div class="email">${escapeHtml(acc.email)}</div>
      </div>
      ${isCurrent ? '<div class="badge-current">● Активный</div>' : ''}
    `;
    if (!isCurrent) li.addEventListener("click", () => switchToAccount(acc));
    list.appendChild(li);
  });
}

document.getElementById("btnAddAccount").addEventListener("click", async () => {
  const ok = await showConfirm(
    "Текущий аккаунт будет сохранён. Вы выйдете и войдёте заново с другим аккаунтом.",
    "Добавить аккаунт?"
  );
  if (!ok) return;
  saveCurrentAccount();
  await signOut(auth);
});

async function switchToAccount(acc) {
  const ok = await showConfirm(`Войти заново под ${acc.email}?\n\nПароль нужно будет ввести снова.`, "Переключение аккаунта");
  if (!ok) return;
  const password = prompt(`Введите пароль для ${acc.email}:`);
  if (!password) return;
  try {
    await signOut(auth);
    await signInWithEmailAndPassword(auth, acc.email, password);
  } catch (e) {
    showAlert("Не удалось войти: " + e.message, "Ошибка");
  }
}

// ==== Создание чата ====
document.getElementById("btnCreateChat").addEventListener("click", () =>
  document.getElementById("modal-create").classList.add("active"));
document.getElementById("btnCancel").addEventListener("click", () => {
  document.getElementById("modal-create").classList.remove("active");
  resetCreateForm();
});
document.getElementById("btnCreate").addEventListener("click", createChat);

function loadUsers() {
  const userSelect = document.getElementById("userSelect");
  onValue(ref(db, "users"), (snapshot) => {
    userMap = snapshot.val() || {};
    userSelect.innerHTML = "";
    for (const uid in userMap) {
      if (uid !== currentUser.uid) {
        const opt = document.createElement("option");
        opt.value = uid;
        opt.textContent = userMap[uid].name || userMap[uid].email;
        userSelect.appendChild(opt);
      }
    }
  });
}

document.getElementById("chatType").addEventListener("change", function () {
  const userSelect = document.getElementById("userSelect");
  const channelPublicLabel = document.getElementById("channelPublicLabel");
  const chatSlug = document.getElementById("chatSlug");
  const chatSlugHint = document.getElementById("chatSlugHint");
  const needSlug = this.value === "group" || this.value === "channel";
  chatSlug.style.display = needSlug ? "block" : "none";
  chatSlugHint.style.display = needSlug ? "block" : "none";

  if (this.value === "private") {
    userSelect.style.display = "block"; userSelect.multiple = false;
    channelPublicLabel.style.display = "none";
  } else if (this.value === "group") {
    userSelect.style.display = "block"; userSelect.multiple = true;
    channelPublicLabel.style.display = "none";
  } else if (this.value === "channel") {
    userSelect.style.display = "none";
    channelPublicLabel.style.display = "flex";
  } else {
    userSelect.style.display = "none";
    channelPublicLabel.style.display = "none";
  }
});

document.getElementById("chatAvatarInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) return showAlert("Фото до 500 КБ", "Слишком большое");
  const reader = new FileReader();
  reader.onload = ev => {
    chatAvatarBase64 = ev.target.result;
    const img = document.getElementById("chatAvatarPreview");
    img.src = chatAvatarBase64;
    img.style.display = "block";
    document.getElementById("chatAvatarText").textContent = "Фото выбрано";
  };
  reader.readAsDataURL(file);
});

async function createChat() {
  const name = document.getElementById("chatName").value.trim();
  const description = document.getElementById("chatDescription").value.trim();
  const type = document.getElementById("chatType").value;
  const slugRaw = document.getElementById("chatSlug").value.trim().toLowerCase();
  const userSelect = document.getElementById("userSelect");
  const selected = Array.from(userSelect.selectedOptions).map(o => o.value);

  if (!name) return showAlert("Введите название", "Ошибка");
  if ((type === "private" || type === "group") && selected.length === 0)
    return showAlert("Выберите хотя бы одного пользователя", "Ошибка");
  if (type === "private" && selected.length > 1)
    return showAlert("Приватный чат — только один пользователь", "Ошибка");

  let slug = "";
  if (type === "group" || type === "channel") {
    if (!slugRaw) return showAlert("Введите @юзернейм", "Ошибка");
    if (!/^[a-z0-9_]{3,20}$/.test(slugRaw)) return showAlert("Юзернейм: только латиница, цифры и _, от 3 до 20", "Ошибка");
    if (RESERVED_SLUGS.includes(slugRaw)) return showAlert("Этот юзернейм зарезервирован", "Ошибка");
    slug = slugRaw;
    const allChats = await get(ref(db, "chats"));
    const chats = allChats.val() || {};
    for (const id in chats) if (chats[id].slug === slug) return showAlert("Этот юзернейм уже занят", "Ошибка");
  }

  const members = { [currentUser.uid]: true };
  selected.forEach(id => members[id] = true);

  const newRef = push(ref(db, "chats"));
  const chatData = {
    name, type, members, owner: currentUser.uid,
    description: description || "",
    photo: chatAvatarBase64 || null
  };
  if (slug) chatData.slug = slug;

  if (type === "channel") {
    const isPublic = document.getElementById("channelIsPublic").checked;
    chatData.isPublic = isPublic;
    if (!isPublic) {
      const code = generateInviteCode();
      chatData.inviteCode = code;
      await set(newRef, chatData);
      await set(ref(db, "invites/" + code), newRef.key);
      showInviteLink(code);
    } else {
      await set(newRef, chatData);
    }
  } else if (type === "private" || type === "group") {
    const code = generateInviteCode();
    chatData.inviteCode = code;
    await set(newRef, chatData);
    await set(ref(db, "invites/" + code), newRef.key);
    showInviteLink(code);
  } else {
    await set(newRef, chatData);
  }

  resetCreateForm();
  document.getElementById("modal-create").classList.remove("active");
}

function resetCreateForm() {
  document.getElementById("chatName").value = "";
  document.getElementById("chatDescription").value = "";
  document.getElementById("chatSlug").value = "";
  document.getElementById("chatSlug").style.display = "none";
  document.getElementById("chatSlugHint").style.display = "none";
  document.getElementById("chatAvatarInput").value = "";
  document.getElementById("chatAvatarPreview").style.display = "none";
  document.getElementById("chatAvatarText").textContent = "Фото чата (необязательно)";
  document.getElementById("userSelect").selectedIndex = -1;
  chatAvatarBase64 = null;
}

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function buildInviteLink(code) {
  const base = window.location.origin + window.location.pathname.replace("chat.html", "");
  return base + "chat.html?join=" + code;
}
function buildSlugLink(slug) {
  const base = window.location.origin + window.location.pathname.replace("chat.html", "");
  return base + "chat.html?g=" + slug;
}
function showInviteLink(code) {
  document.getElementById("inviteLink").value = buildInviteLink(code);
  document.getElementById("modal-invite").classList.add("active");
}
document.getElementById("btnCloseInvite").addEventListener("click", () =>
  document.getElementById("modal-invite").classList.remove("active"));
document.getElementById("btnCopyInvite").addEventListener("click", () => {
  copyToClipboard(document.getElementById("inviteLink").value);
});
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showAlert("Скопировано", "Готово"))
      .catch(() => showAlert("Скопируй вручную:\n" + text, "Ссылка"));
  } else showAlert("Скопируй вручную:\n" + text, "Ссылка");
}

// ==== Список чатов ====
function loadChats() {
  const chatList = document.getElementById("chatList");
  if (unsubChats) unsubChats();
  unsubChats = onValue(ref(db, "chats"), (snapshot) => {
    const chats = snapshot.val() || {};
    const search = (document.getElementById("searchInput").value || "").toLowerCase();
    chatList.innerHTML = "";
    for (const chatId in chats) {
      const chat = chats[chatId];
      const isMember = chat.members && chat.members[currentUser.uid];
      const isPublicChat = chat.type === "public";
      if (!isPublicChat && !isMember) continue;
      if (search && !chat.name.toLowerCase().includes(search)) continue;

      const li = document.createElement("li");
      li.dataset.chatId = chatId;
      const isChannel = chat.type === "channel";
      const avatarContent = chat.photo
        ? `<img src="${chat.photo}">`
        : (isChannel ? "📢" : escapeHtml(chat.name.charAt(0).toUpperCase()));

      let subtitle = chat.type;
      if (isChannel) subtitle = chat.isPublic ? "канал · публичный" : "канал · приватный";
      if (chat.slug) subtitle += ` · @${chat.slug}`;

      let nameHTML = escapeHtml(chat.name);
      if (chat.type === "private") {
        const otherUid = Object.keys(chat.members || {}).find(u => u !== currentUser.uid);
        if (otherUid) {
          const ou = userMap[otherUid] || {};
          const isActive = ou.isPlus === true && (!ou.plusUntil || Date.now() < ou.plusUntil);
          if (isActive) nameHTML += ` <span class="plus-star">⭐</span>`;
        }
      }

      li.innerHTML = `
        <div class="avatar">${avatarContent}</div>
        <div class="chat-info">
          <div class="chat-name">${nameHTML}</div>
          <div class="chat-type">${subtitle}</div>
        </div>
      `;
      attachLongPress(li, chatId, chat);
      chatList.appendChild(li);
    }
    setTimeout(renderChatListWithBadges, 100);
  });
}
document.getElementById("searchInput").addEventListener("input", loadChats);

// ==== Счётчики ====
function loadLastRead() {
  if (unsubLastRead) unsubLastRead();
  try {
    unsubLastRead = onValue(ref(db, "lastRead/" + currentUser.uid), (snap) => {
      lastReadMap = snap.val() || {};
      updateUnreadCounts();
    }, (err) => {
      console.warn("lastRead read error:", err.message);
      lastReadMap = {};
    });
  } catch (e) {
    console.warn("loadLastRead error:", e.message);
    lastReadMap = {};
  }
}

async function updateUnreadCounts() {
  const snap = await get(ref(db, "chats"));
  const chats = snap.val() || {};
  const newCounts = {};

  for (const chatId in chats) {
    const chat = chats[chatId];
    const isMember = chat.members && chat.members[currentUser.uid];
    const isPublicChat = chat.type === "public";
    if (!isPublicChat && !isMember) continue;
    if (chatId === currentChatId) continue;

    const lastRead = lastReadMap[chatId] || 0;
    const msgsSnap = await get(ref(db, "messages/" + chatId));
    const msgs = msgsSnap.val() || {};
    let count = 0;
    for (const mid in msgs) {
      const m = msgs[mid];
      if (m.timestamp > lastRead && m.sender !== currentUser.uid) count++;
    }
    if (count > 0) newCounts[chatId] = count;
  }

  unreadCounts = newCounts;
  renderChatListWithBadges();
  updateTitle();
}

function renderChatListWithBadges() {
  const items = document.querySelectorAll("#chatList li");
  items.forEach(li => {
    const chatId = li.dataset.chatId;
    const oldBadge = li.querySelector(".unread-badge");
    if (oldBadge) oldBadge.remove();

    const count = unreadCounts[chatId];
    if (!count) return;

    const info = li.querySelector(".chat-info");
    if (!info) return;

    let topRow = info.querySelector(".chat-top-row");
    if (!topRow) {
      const nameEl = info.querySelector(".chat-name");
      if (!nameEl) return;
      topRow = document.createElement("div");
      topRow.className = "chat-top-row";
      nameEl.parentNode.insertBefore(topRow, nameEl);
      topRow.appendChild(nameEl);
    }

    const badge = document.createElement("div");
    badge.className = "unread-badge";
    badge.textContent = count > 99 ? "99+" : count;
    topRow.appendChild(badge);
  });
}

function updateTitle() {
  const total = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  document.title = total > 0 ? `(${total}) Sqwid` : "Sqwid Messenger";
}

// ==== Слушатель новых сообщений ====
function listenAllNewMessages() {
  if (unsubAllMessages) unsubAllMessages();
  const selfUid = currentUser.uid;
  msgListenerStart = Date.now();

  unsubAllMessages = onChildAdded(ref(db, "messages"), (chatSnap) => {
    const chatId = chatSnap.key;
    onChildAdded(ref(db, "messages/" + chatId), (msgSnap) => {
      const msg = msgSnap.val();
      if (!msg || !msg.timestamp) return;
      if (msg.timestamp < msgListenerStart) return;
      if (msg.sender === selfUid) return;
      if (chatId === currentChatId) return;

      unreadCounts[chatId] = (unreadCounts[chatId] || 0) + 1;
      renderChatListWithBadges();
      updateTitle();
      playBeep();
      const sender = userMap[msg.sender] || {};
      const senderName = sender.name || sender.email || "Сообщение";
      showToast(senderName + ": " + (msg.type === "photo" ? "📷 Фото" : (msg.text || "")));
    });
  });
}

// ==== Долгое нажатие ====
function attachLongPress(li, chatId, chatData) {
  let timer = null;
  let triggered = false;

  const start = () => {
    triggered = false;
    li.classList.add("long-press");
    timer = setTimeout(() => {
      triggered = true;
      li.classList.remove("long-press");
      if (navigator.vibrate) navigator.vibrate(30);
      showChatActions(chatId, chatData);
    }, 500);
  };
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    li.classList.remove("long-press");
  };

  li.addEventListener("touchstart", start, { passive: true });
  li.addEventListener("touchend", cancel);
  li.addEventListener("touchmove", cancel);
  li.addEventListener("touchcancel", cancel);
  li.addEventListener("mousedown", start);
  li.addEventListener("mouseup", cancel);
  li.addEventListener("mouseleave", cancel);
  li.addEventListener("click", (e) => {
    if (triggered) { e.preventDefault(); triggered = false; return; }
    openChat(chatId);
  });
}

function showChatActions(chatId, chat) {
  pendingDeleteChatId = chatId;
  pendingDeleteChatData = chat;
  const title = document.getElementById("chatActionsTitle");
  const list = document.getElementById("chatActionsList");
  list.innerHTML = "";
  title.textContent = chat.name || "Чат";

  const isOwner = chat.owner === currentUser.uid;
  const isMember = chat.members && chat.members[currentUser.uid];
  const isChannel = chat.type === "channel";
  const isGroup = chat.type === "group";
  const isPrivate = chat.type === "private";
  const canDeleteForAll = isOwner && (isChannel || isGroup || isPrivate);
  const canDeleteForMe = isMember || chat.type === "public";

  if (canDeleteForAll) {
    const btn = document.createElement("button");
    btn.className = "action-item danger";
    btn.textContent = "Удалить у всех";
    btn.onclick = () => { hideChatActions(); deleteChatForAll(); };
    list.appendChild(btn);
  }
  if (canDeleteForMe) {
    const btn = document.createElement("button");
    btn.className = "action-item danger";
    btn.textContent = "Удалить у меня";
    btn.onclick = () => { hideChatActions(); deleteChatForMe(); };
    list.appendChild(btn);
  }
  document.getElementById("modal-chatActions").classList.add("active");
}
function hideChatActions() {
  document.getElementById("modal-chatActions").classList.remove("active");
}
document.getElementById("btnChatActionsCancel").addEventListener("click", hideChatActions);

async function deleteChatForMe() {
  if (!pendingDeleteChatId) return;
  const chatId = pendingDeleteChatId;
  const ok = await showConfirm("Чат исчезнет из вашего списка.", "Удалить у меня?");
  if (!ok) return;
  await remove(ref(db, "chats/" + chatId + "/members/" + currentUser.uid));
  pendingDeleteChatId = null;
  pendingDeleteChatData = null;
}

async function deleteChatForAll() {
  if (!pendingDeleteChatId || !pendingDeleteChatData) return;
  const chatId = pendingDeleteChatId;
  const chat = pendingDeleteChatData;
  const ok = await showConfirm("Чат будет удалён у всех без возможности восстановления.", "Удалить у всех?");
  if (!ok) return;
  try {
    if (chat.inviteCode) await remove(ref(db, "invites/" + chat.inviteCode));
    await remove(ref(db, "messages/" + chatId));
    await remove(ref(db, "chats/" + chatId));
    pendingDeleteChatId = null;
    pendingDeleteChatData = null;
    showAlert("Чат удалён у всех участников", "Готово");
  } catch (e) {
    showAlert("Ошибка: " + e.message, "Ошибка");
  }
}

// ==== Открытие чата ====
async function openChat(chatId) {
  const snap = await get(ref(db, "chats/" + chatId));
  const chat = snap.val();
  if (!chat) return;

  currentChatId = chatId;
  currentChatData = chat;

  try {
    await set(ref(db, "lastRead/" + currentUser.uid + "/" + chatId), Date.now());
  } catch (e) {
    console.warn("Не удалось сохранить lastRead:", e.message);
  }
  delete unreadCounts[chatId];
  renderChatListWithBadges();
  updateTitle();

  document.getElementById("chatTitle").textContent = chat.name;
  document.getElementById("messages").innerHTML = "";
  document.title = "Sqwid Messenger";
  showScreen("screen-messages");

  const inputArea = document.getElementById("inputArea");
  if (chat.type === "channel" && chat.owner !== currentUser.uid) {
    inputArea.style.display = "none";
  } else {
    inputArea.style.display = "flex";
  }

  if (unsubMessages) unsubMessages();
  unsubMessages = onChildAdded(ref(db, "messages/" + chatId), (snapshot) => {
    const msg = snapshot.val();
    msg.id = snapshot.key;
    renderMessage(msg);
  });
}

document.getElementById("chatTitle").addEventListener("click", () => {
  if (currentChatId) openChatProfile();
});

// ==== Профиль чата ====
function openChatProfile() {
  if (!currentChatData) return;
  try {
    const chat = currentChatData;
    const photo = document.getElementById("cpPhoto");
    if (chat.photo) {
      photo.src = chat.photo;
      photo.classList.remove("rounded-square");
    } else {
      photo.src = svgAvatar(chat.name);
      if (chat.type === "channel") photo.classList.add("rounded-square");
      else photo.classList.remove("rounded-square");
    }

    document.getElementById("cpName").textContent = chat.name;
    let typeLabel = chat.type;
    if (chat.type === "channel") typeLabel = chat.isPublic ? "публичный канал" : "приватный канал";
    else if (chat.type === "public") typeLabel = "публичный чат";
    else if (chat.type === "private") typeLabel = "приватный чат";
    else if (chat.type === "group") typeLabel = "группа";
    if (chat.slug) typeLabel += ` · @${chat.slug}`;
    document.getElementById("cpType").textContent = typeLabel;

    document.getElementById("cpDescription").textContent = chat.description || "—";

    const linkSection = document.getElementById("cpLinkSection");
    const isOwner = chat.owner === currentUser.uid;
    if (chat.slug) {
      linkSection.style.display = "block";
      document.getElementById("cpInvite").value = buildSlugLink(chat.slug);
    } else if (chat.inviteCode && isOwner) {
      linkSection.style.display = "block";
      document.getElementById("cpInvite").value = buildInviteLink(chat.inviteCode);
    } else {
      linkSection.style.display = "none";
    }

    const membersDiv = document.getElementById("cpMembers");
    membersDiv.innerHTML = "";
    const members = chat.members || {};
    const uids = Object.keys(members);
    if (uids.length === 0) membersDiv.textContent = "—";
    else {
      uids.forEach(uid => {
        const u = userMap[uid] || {};
        let name = u.name || u.email || "Пользователь";
        if (u.showUsername !== false && u.username) name = name + " @" + u.username;
        const isActive = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
        if (isActive) name = "⭐ " + name;
        const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml(name.charAt(0).toUpperCase());
        const row = document.createElement("div");
        row.className = "cp-member";
        row.innerHTML = `<div class="cp-member-avatar">${avatarContent}</div><div>${escapeHtml(name)}${uid === chat.owner ? " 👑" : ""}</div>`;
        membersDiv.appendChild(row);
      });
    }

    const leaveBtn = document.getElementById("btnLeaveChat");
    if (members[currentUser.uid]) {
      leaveBtn.style.display = "block";
      leaveBtn.textContent = isOwner ? "Удалить чат" : "Выйти из чата";
    } else leaveBtn.style.display = "none";

    showScreen("screen-chat-profile");
  } catch (e) {
    console.error("Ошибка в openChatProfile:", e);
    showAlert("Не удалось открыть профиль: " + e.message, "Ошибка");
  }
}

document.getElementById("btnCpCopy").addEventListener("click", () => {
  copyToClipboard(document.getElementById("cpInvite").value);
});

document.getElementById("btnLeaveChat").addEventListener("click", async () => {
  if (!currentChatData) return;
  const isOwner = currentChatData.owner === currentUser.uid;
  const ok = await showConfirm(isOwner ? "Удалить чат для всех?" : "Выйти из чата?", isOwner ? "Удалить чат" : "Выйти");
  if (!ok) return;

  const chatId = currentChatId;
  if (isOwner) {
    if (currentChatData.inviteCode) await remove(ref(db, "invites/" + currentChatData.inviteCode));
    await remove(ref(db, "messages/" + chatId));
    await remove(ref(db, "chats/" + chatId));
  } else {
    await remove(ref(db, "chats/" + chatId + "/members/" + currentUser.uid));
  }
  currentChatId = null;
  currentChatData = null;
  showScreen("screen-chats");
});

// ==== Рендер сообщения ====
function renderMessage(msg) {
  const msgDiv = document.getElementById("messages");
  const isOwn = msg.sender === currentUser.uid;
  const msgDate = new Date(msg.timestamp);
  const time = formatTime(msgDate);
  const sender = userMap[msg.sender] || {};

  let senderName = sender.name || sender.email || "Пользователь";
  if (sender.showUsername !== false && sender.username) {
    senderName = sender.name + " @" + sender.username;
  }
  const isSenderPlus = sender.isPlus === true && (!sender.plusUntil || Date.now() < sender.plusUntil);
  if (isSenderPlus) senderName = "⭐ " + senderName;

  // Дата-разделитель
  const dateLabel = formatDate(msgDate);
  const lastChild = msgDiv.lastElementChild;
  if (!lastChild || lastChild.dataset.dateLabel !== dateLabel) {
    const sep = document.createElement("div");
    sep.className = "date-separator";
    sep.textContent = dateLabel;
    sep.dataset.dateLabel = dateLabel;
    msgDiv.appendChild(sep);
  }

  const div = document.createElement("div");
  div.className = "msg " + (isOwn ? "own" : "other");
  div.dataset.msgId = msg.id || "";

  let replyHTML = "";
  if (msg.replyTo) {
    replyHTML = `
      <div class="msg-reply">
        <div class="msg-reply-name">${escapeHtml(msg.replyTo.senderName || "")}</div>
        <div class="msg-reply-text">${escapeHtml(msg.replyTo.text || "")}</div>
      </div>
    `;
  }

  let content = "";
  if (msg.type === "photo" && msg.photo) {
    content = `<img class="msg-photo" src="${msg.photo}" alt="фото">`;
  } else {
    content = `<div>${escapeHtml(msg.text || "")}</div>`;
  }

  div.innerHTML = `
    <div class="msg-reply-icon">↩</div>
    ${!isOwn ? `<div class="sender">${escapeHtml(senderName)}</div>` : ""}
    ${replyHTML}
    ${content}
    <div class="time">${time}</div>
  `;

  const img = div.querySelector(".msg-photo");
  if (img) {
    img.addEventListener("click", () => {
      document.getElementById("photoViewerImg").src = msg.photo;
      document.getElementById("photoViewer").classList.add("active");
    });
  }

  attachSwipeReply(div, msg, senderName);
  msgDiv.appendChild(div);
  msgDiv.scrollTop = msgDiv.scrollHeight;
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameDay(d, today)) return "Сегодня";
  if (sameDay(d, yesterday)) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

// ==== Свайп-ответ ====
function attachSwipeReply(div, msg, senderName) {
  const isOwn = msg.sender === currentUser.uid;
  let startX = 0;
  let currentX = 0;
  let swiping = false;
  const threshold = 70;

  div.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    currentX = startX;
    swiping = true;
    div.classList.add("swiping");
  }, { passive: true });

  div.addEventListener("touchmove", (e) => {
    if (!swiping) return;
    currentX = e.touches[0].clientX;
    let delta = currentX - startX;
    if (isOwn && delta < 0) delta = 0;
    if (!isOwn && delta > 0) delta = 0;
    const max = 90;
    if (delta > max) delta = max;
    if (delta < -max) delta = -max;
    div.style.transform = `translateX(${delta}px)`;
    if (Math.abs(delta) > threshold) div.classList.add("reply-trigger");
    else div.classList.remove("reply-trigger");
  });

  div.addEventListener("touchend", () => {
    if (!swiping) return;
    swiping = false;
    div.classList.remove("swiping");
    const delta = currentX - startX;
    const absDelta = Math.abs(delta);
    div.style.transform = "";
    div.classList.remove("reply-trigger");
    if (absDelta > threshold) {
      if (navigator.vibrate) navigator.vibrate(20);
      setReplyTo(msg, senderName);
    }
  });

  div.addEventListener("touchcancel", () => {
    swiping = false;
    div.classList.remove("swiping", "reply-trigger");
    div.style.transform = "";
  });
}

function setReplyTo(msg, senderName) {
  replyTo = {
    msgId: msg.id,
    text: msg.type === "photo" ? "📷 Фото" : (msg.text || ""),
    senderName: senderName || "Пользователь"
  };
  document.getElementById("replyPreviewName").textContent = replyTo.senderName;
  document.getElementById("replyPreviewText").textContent = replyTo.text;
  document.getElementById("replyPreview").classList.add("active");
  document.getElementById("msgInput").focus();
}

document.getElementById("btnCancelReply").addEventListener("click", () => {
  replyTo = null;
  document.getElementById("replyPreview").classList.remove("active");
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function svgAvatar(text) {
  try {
    let ch = "?";
    const str = (text || "").toString().trim();
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (/[\p{L}\p{N}]/u.test(c)) { ch = c.toUpperCase(); break; }
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">' +
      '<rect width="100%" height="100%" fill="#00a884"/>' +
      '<text x="50%" y="55%" font-size="36" fill="#fff" text-anchor="middle" font-family="Arial">' +
      ch + '</text></svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  } catch (e) {
    console.error("svgAvatar error:", e);
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#00a884"/></svg>'
    );
  }
}

// ==== Отправка ====
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!currentChatId || !text) return;
  if (currentChatData.type === "channel" && currentChatData.owner !== currentUser.uid) {
    showAlert("В этом канале может писать только владелец", "Ошибка");
    return;
  }

  const data = { sender: currentUser.uid, type: "text", text, timestamp: Date.now() };
  if (replyTo) data.replyTo = { msgId: replyTo.msgId, text: replyTo.text, senderName: replyTo.senderName };

  await push(ref(db, "messages/" + currentChatId), data);
  input.value = "";
  replyTo = null;
  document.getElementById("replyPreview").classList.remove("active");
}
document.getElementById("btnSend").addEventListener("click", sendMessage);
document.getElementById("msgInput").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

// ==== Отправка фото ====
document.getElementById("btnAttach").addEventListener("click", () => {
  if (!currentChatId) return showAlert("Откройте чат", "Ошибка");
  if (currentChatData.type === "channel" && currentChatData.owner !== currentUser.uid) {
    return showAlert("В этом канале может писать только владелец", "Ошибка");
  }
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";

  if (!file.type.startsWith("image/")) return showAlert("Только изображения", "Ошибка");
  const maxSize = isPlusActive() ? 2 * 1024 * 1024 : 500 * 1024;
  const limitText = isPlusActive() ? "2 МБ" : "500 КБ";
  if (file.size > maxSize) {
    if (!isPlusActive()) return showAlert(`Фото больше ${limitText}.\n\nОформите Sqwid+ ⭐ — там лимит 2 МБ.`, "Лимит");
    return showAlert(`Фото больше ${limitText}`, "Лимит");
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const data = { sender: currentUser.uid, type: "photo", photo: ev.target.result, timestamp: Date.now() };
    if (replyTo) data.replyTo = { msgId: replyTo.msgId, text: replyTo.text, senderName: replyTo.senderName };
    await push(ref(db, "messages/" + currentChatId), data);
    replyTo = null;
    document.getElementById("replyPreview").classList.remove("active");
  };
  reader.readAsDataURL(file);
});

document.getElementById("photoViewer").addEventListener("click", () => {
  document.getElementById("photoViewer").classList.remove("active");
  document.getElementById("photoViewerImg").src = "";
});

// ==== Ссылка ====
async function checkInvite() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("join");
  if (code) {
    try {
      const inviteSnap = await get(ref(db, "invites/" + code));
      const chatId = inviteSnap.val();
      if (!chatId) {
        showAlert("Ссылка недействительна", "Ошибка");
        window.history.replaceState({}, "", "chat.html");
        return;
      }
      const memberSnap = await get(ref(db, "chats/" + chatId + "/members/" + currentUser.uid));
      if (!memberSnap.exists()) {
        await update(ref(db, "chats/" + chatId + "/members"), { [currentUser.uid]: true });
        showAlert("Вы присоединились!", "Готово");
      }
      window.history.replaceState({}, "", "chat.html");
      await openChat(chatId);
    } catch (err) {
      console.error(err);
      showAlert("Ошибка ссылки", "Ошибка");
    }
    return;
  }

  const slug = params.get("g");
  if (slug) {
    try {
      const allChats = await get(ref(db, "chats"));
      const chats = allChats.val() || {};
      let foundChatId = null;
      for (const id in chats) if (chats[id].slug === slug) { foundChatId = id; break; }
      if (!foundChatId) {
        showAlert("Группа или канал не найден", "Ошибка");
        window.history.replaceState({}, "", "chat.html");
        return;
      }
      window.history.replaceState({}, "", "chat.html");
      currentChatId = foundChatId;
      currentChatData = chats[foundChatId];
      openChatProfile();
    } catch (err) {
      console.error(err);
      showAlert("Ошибка ссылки", "Ошибка");
    }
  }
}

// ==== Поиск ====
document.getElementById("btnSearchUsers").addEventListener("click", () => {
  document.getElementById("userSearchInput").value = "";
  document.getElementById("userSearchList").innerHTML = "";
  document.getElementById("chatSearchList").innerHTML = "";
  searchTab = "people";
  document.querySelectorAll(".search-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === "people"));
  document.getElementById("userSearchList").style.display = "block";
  document.getElementById("chatSearchList").style.display = "none";
  showScreen("screen-search-users");
});

document.querySelectorAll(".search-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    searchTab = tab.dataset.tab;
    document.querySelectorAll(".search-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === searchTab));
    document.getElementById("userSearchList").style.display = searchTab === "people" ? "block" : "none";
    document.getElementById("chatSearchList").style.display = searchTab === "chats" ? "block" : "none";
    document.getElementById("userSearchInput").value = "";
    document.getElementById("userSearchList").innerHTML = "";
    document.getElementById("chatSearchList").innerHTML = "";
  });
});

document.getElementById("userSearchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (searchTab === "people") renderPeopleSearch(q);
  else renderChatsSearch(q);
});

function renderPeopleSearch(q) {
  const list = document.getElementById("userSearchList");
  list.innerHTML = "";
  if (!q) return;
  for (const uid in userMap) {
    if (uid === currentUser.uid) continue;
    const u = userMap[uid] || {};
    const name = (u.name || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    if (!name.includes(q) && !username.includes(q) && !email.includes(q)) continue;

    const li = document.createElement("li");
    li.className = "user-result";
    const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml((u.name || "?").charAt(0).toUpperCase());
    let displayName = u.name || u.email || "Пользователь";
    let subText = "";
    if (u.showUsername !== false && u.username) subText = "@" + u.username;

    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${escapeHtml(displayName)}</div>${subText ? `<div class="username">${escapeHtml(subText)}</div>` : ""}</div>`;
    li.onclick = () => startPrivateChatWith(uid, displayName);
    list.appendChild(li);
  }
}

async function renderChatsSearch(q) {
  const list = document.getElementById("chatSearchList");
  list.innerHTML = "";
  if (!q) return;
  const snap = await get(ref(db, "chats"));
  const chats = snap.val() || {};
  for (const chatId in chats) {
    const chat = chats[chatId];
    if (chat.type !== "group" && chat.type !== "channel") continue;
    const isMember = chat.members && chat.members[currentUser.uid];
    if (isMember) continue;
    const nameMatch = chat.name.toLowerCase().includes(q);
    const slugMatch = (chat.slug || "").toLowerCase().includes(q);
    if (!nameMatch && !slugMatch) continue;

    const li = document.createElement("li");
    li.className = "user-result";
    const avatarContent = chat.photo ? `<img src="${chat.photo}">` : escapeHtml(chat.name.charAt(0).toUpperCase());
    let subtitle = chat.type === "channel" ? "канал" : "группа";
    if (chat.slug) subtitle += ` · @${chat.slug}`;
    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${escapeHtml(chat.name)}</div><div class="username">${subtitle}</div></div><button class="join-btn" data-chat-id="${chatId}">Войти</button>`;
    li.querySelector(".join-btn").addEventListener("click", async (e) => { e.stopPropagation(); await joinChat(chatId); });
    list.appendChild(li);
  }
  if (list.children.length === 0) list.innerHTML = `<li style="padding:20px;text-align:center;color:#8696a0;">Ничего не найдено</li>`;
}

async function joinChat(chatId) {
  await update(ref(db, "chats/" + chatId + "/members"), { [currentUser.uid]: true });
  showAlert("Вы присоединились к чату!", "Готово");
  document.getElementById("chatSearchList").innerHTML = "";
  document.getElementById("userSearchInput").value = "";
  openChat(chatId);
}

async function startPrivateChatWith(uid, displayName) {
  const snap = await get(ref(db, "chats"));
  const chats = snap.val() || {};
  let existingChatId = null;
  for (const chatId in chats) {
    const c = chats[chatId];
    if (c.type !== "private") continue;
    const m = c.members || {};
    if (m[currentUser.uid] && m[uid] && Object.keys(m).length === 2) { existingChatId = chatId; break; }
  }
  if (existingChatId) openChat(existingChatId);
  else {
    const newRef = push(ref(db, "chats"));
    await set(newRef, {
      name: displayName, type: "private",
      members: { [currentUser.uid]: true, [uid]: true },
      owner: currentUser.uid, description: "", photo: null
    });
    openChat(newRef.key);
  }
}

// ==== Sqwid+ ====
document.getElementById("btnSqwidPlus").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  showScreen("screen-plus");
});

document.querySelectorAll(".tariff-card:not(.give-plus-option)").forEach(card => {
  card.addEventListener("click", () => {
    selectedTariff = card.dataset.period;
    openBot();
  });
});

function openBot() {
  botStarted = false;
  const msgDiv = document.getElementById("botMessages");
  msgDiv.innerHTML = "";
  const periodText = selectedTariff === "1" ? "1 месяц" : selectedTariff === "3" ? "3 месяца" : "6 месяцев";
  const welcome = document.createElement("div");
  welcome.className = "msg other";
  welcome.innerHTML = `<div class="sender">@sqwid</div><div>Здравствуйте! Я бот Sqwid.</div><div>Вы выбрали тариф: <b>${periodText}</b></div><div style="margin-top:8px;">Нажмите кнопку ниже.</div><button class="bot-start-btn" id="botStartBtn">▶ Старт</button>`;
  msgDiv.appendChild(welcome);
  document.getElementById("botStartBtn").addEventListener("click", showBotInstructions);
  showScreen("screen-bot");
}

function showBotInstructions() {
  if (botStarted) return;
  botStarted = true;
  const msgDiv = document.getElementById("botMessages");
  const periodText = selectedTariff === "1" ? "1 месяц" : selectedTariff === "3" ? "3 месяца" : "6 месяцев";
  const instruction = document.createElement("div");
  instruction.className = "msg other";
  instruction.innerHTML = `<div class="sender">@sqwid</div><div>Для получения премиума на <b>${periodText}</b> напиши мне:<br><br><b style="color:#f7b500;font-size:16px;">@sqwid</b><br><br>После договора вы получите свой Sqwid+ 🎉</div><div class="bot-message-buttons"><button class="bot-btn" id="botBtnWrite">Написать</button><button class="bot-btn secondary" id="botBtnChange">Выбрать другой тариф</button></div>`;
  msgDiv.appendChild(instruction);
  msgDiv.scrollTop = msgDiv.scrollHeight;
  document.getElementById("botBtnWrite").addEventListener("click", () => {
    document.getElementById("botInput").value = "@sqwid";
    document.getElementById("botInput").focus();
  });
  document.getElementById("botBtnChange").addEventListener("click", () => showScreen("screen-plus"));
}

document.getElementById("btnBotSend").addEventListener("click", sendBotMessage);
document.getElementById("botInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendBotMessage(); });

async function sendBotMessage() {
  const input = document.getElementById("botInput");
  const text = input.value.trim();
  if (!text) return;
  const msgDiv = document.getElementById("botMessages");
  const userMsg = document.createElement("div");
  userMsg.className = "msg own";
  userMsg.innerHTML = `<div>${escapeHtml(text)}</div>`;
  msgDiv.appendChild(userMsg);
  msgDiv.scrollTop = msgDiv.scrollHeight;
  input.value = "";
  if (text.toLowerCase().includes("@sqwid")) {
    setTimeout(() => {
      const reply = document.createElement("div");
      reply.className = "msg other";
      reply.innerHTML = `<div class="sender">@sqwid</div><div>Принято! Заявка отправлена.<br><br>Ожидайте связи.</div>`;
      msgDiv.appendChild(reply);
      msgDiv.scrollTop = msgDiv.scrollHeight;
    }, 1000);
  }
}

// ==== Админ ====
document.getElementById("btnAdminPanel").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  document.getElementById("adminSearch").value = "";
  renderAdminUsers("");
  showScreen("screen-admin");
});

document.getElementById("adminSearch").addEventListener("input", (e) => {
  renderAdminUsers(e.target.value.trim().toLowerCase());
});

function renderAdminUsers(query) {
  const list = document.getElementById("adminUserList");
  list.innerHTML = "";
  for (const uid in userMap) {
    if (uid === currentUser.uid) continue;
    const u = userMap[uid] || {};
    const name = (u.name || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    if (query && !name.includes(query) && !username.includes(query) && !email.includes(query)) continue;

    const li = document.createElement("li");
    li.className = "admin-user-row";
    const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml((u.name || "?").charAt(0).toUpperCase());
    let displayName = u.name || u.email || "Пользователь";
    let subText = "";
    if (u.username) subText = "@" + u.username;
    const isActivePlus = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
    const badge = isActivePlus ? `<div class="plus-badge">⭐</div>` : "";
    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${escapeHtml(displayName)}</div>${subText ? `<div class="username">${escapeHtml(subText)}</div>` : ""}</div>${badge}`;
    li.onclick = () => openGivePlusModal(uid, displayName, u.username, isActivePlus);
    list.appendChild(li);
  }
  if (list.children.length === 0) list.innerHTML = `<li style="padding:20px;text-align:center;color:#8696a0;">Никого не найдено</li>`;
}

function openGivePlusModal(uid, name, username, isActivePlus) {
  pendingGivePlusUid = uid;
  pendingGivePlusName = name;
  pendingGivePlusPeriod = null;
  const info = document.getElementById("givePlusUser");
  let text = `Пользователь: ${name}`;
  if (username) text += ` (@${username})`;
  if (isActivePlus) text += "\n⭐ Уже имеет активный Sqwid+";
  info.textContent = text;
  document.querySelectorAll(".give-plus-option").forEach(btn => {
    btn.style.borderColor = "#2a3942";
    btn.style.background = "#1f2c34";
  });
  document.getElementById("modal-givePlus").classList.add("active");
}

document.querySelectorAll(".give-plus-option").forEach(btn => {
  btn.addEventListener("click", () => {
    pendingGivePlusPeriod = btn.dataset.period;
    document.querySelectorAll(".give-plus-option").forEach(b => {
      b.style.borderColor = "#2a3942";
      b.style.background = "#1f2c34";
    });
    btn.style.borderColor = "#f7b500";
    btn.style.background = "#2a3942";
  });
});

document.getElementById("btnGivePlusCancel").addEventListener("click", () => {
  document.getElementById("modal-givePlus").classList.remove("active");
  pendingGivePlusUid = null;
  pendingGivePlusPeriod = null;
});

document.getElementById("btnGivePlusConfirm").addEventListener("click", async () => {
  if (!pendingGivePlusUid) return;
  if (!pendingGivePlusPeriod) return showAlert("Выберите срок", "Ошибка");
  const days = pendingGivePlusPeriod === "1" ? 30 : pendingGivePlusPeriod === "3" ? 90 : 180;
  const now = Date.now();
  const userSnap = await get(ref(db, "users/" + pendingGivePlusUid));
  const u = userSnap.val() || {};
  let baseTime = now;
  if (u.isPlus && u.plusUntil && u.plusUntil > now) baseTime = u.plusUntil;
  const plusUntil = baseTime + days * 24 * 60 * 60 * 1000;
  await update(ref(db, "users/" + pendingGivePlusUid), {
    isPlus: true, plusUntil, plusGivenBy: "sqwid", plusGivenAt: now
  });
  document.getElementById("modal-givePlus").classList.remove("active");
  showAlert(`Sqwid+ выдан: ${pendingGivePlusName}\nСрок: ${pendingGivePlusPeriod} мес.`, "Готово");
  pendingGivePlusUid = null;
  pendingGivePlusPeriod = null;
});

function isPlusActive() {
  if (!currentUserData || !currentUserData.isPlus) return false;
  if (!currentUserData.plusUntil) return true;
  return Date.now() < currentUserData.plusUntil;
}

console.log("chat.js загружен");