import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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

// ⚠️ ЗАМЕНИ НА СВОЙ UID ИЗ FIREBASE AUTHENTICATION
 const ADMIN_EMAIL = "artemkau714@gmail.com";

let currentUser = null;
let currentUserData = {};
let currentChatId = null;
let currentChatData = null;
let userMap = {};
let unsubMessages = null;
let unsubChats = null;
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

// ==== Свои модалки ====
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

// ==== Авторизация ====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  currentUser = user;
  loadMyProfile();
  loadUsers();
  loadChats();
  await checkInvite();
  checkAdmin();
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
document.getElementById("btnAbout").addEventListener("click", () =>
  document.getElementById("modal-about").classList.add("active"));
document.getElementById("btnCloseAbout").addEventListener("click", () =>
  document.getElementById("modal-about").classList.remove("active"));
document.getElementById("btnLogout").addEventListener("click", () => signOut(auth));

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
document.getElementById("btnBackPlus").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackBot").addEventListener("click", () => showScreen("screen-plus"));
document.getElementById("btnBackSearch").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackAdmin").addEventListener("click", () => showScreen("screen-chats"));

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

// ==== Модалка создания ====
document.getElementById("btnCreateChat").addEventListener("click", () =>
  document.getElementById("modal-create").classList.add("active"));
document.getElementById("btnCancel").addEventListener("click", () => {
  document.getElementById("modal-create").classList.remove("active");
  resetCreateForm();
});
document.getElementById("btnCreate").addEventListener("click", createChat);

// ==== Пользователи ====
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

// ==== Тип чата ====
document.getElementById("chatType").addEventListener("change", function () {
  const userSelect = document.getElementById("userSelect");
  const channelPublicLabel = document.getElementById("channelPublicLabel");
  if (this.value === "private") {
    userSelect.style.display = "block";
    userSelect.multiple = false;
    channelPublicLabel.style.display = "none";
  } else if (this.value === "group") {
    userSelect.style.display = "block";
    userSelect.multiple = true;
    channelPublicLabel.style.display = "none";
  } else if (this.value === "channel") {
    userSelect.style.display = "none";
    channelPublicLabel.style.display = "flex";
  } else {
    userSelect.style.display = "none";
    channelPublicLabel.style.display = "none";
  }
});

// ==== Аватарка чата ====
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

// ==== Создание ====
async function createChat() {
  const name = document.getElementById("chatName").value.trim();
  const description = document.getElementById("chatDescription").value.trim();
  const type = document.getElementById("chatType").value;
  const userSelect = document.getElementById("userSelect");
  const selected = Array.from(userSelect.selectedOptions).map(o => o.value);

  if (!name) return showAlert("Введите название", "Ошибка");
  if ((type === "private" || type === "group") && selected.length === 0)
    return showAlert("Выберите хотя бы одного пользователя", "Ошибка");
  if (type === "private" && selected.length > 1)
    return showAlert("Приватный чат — только один пользователь", "Ошибка");

  const members = { [currentUser.uid]: true };
  selected.forEach(id => members[id] = true);

  const newRef = push(ref(db, "chats"));
  const chatData = {
    name, type, members,
    owner: currentUser.uid,
    description: description || "",
    photo: chatAvatarBase64 || null
  };

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
  } else {
    showAlert("Скопируй вручную:\n" + text, "Ссылка");
  }
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
      const isPublicChannel = chat.type === "channel" && chat.isPublic;
      if (!isPublicChat && !isPublicChannel && !isMember) continue;
      if (search && !chat.name.toLowerCase().includes(search)) continue;

      const li = document.createElement("li");
      const isChannel = chat.type === "channel";
      const avatarContent = chat.photo
        ? `<img src="${chat.photo}">`
        : (isChannel ? "📢" : escapeHtml(chat.name.charAt(0).toUpperCase()));

      let subtitle = chat.type;
      if (isChannel) subtitle = chat.isPublic ? "канал · публичный" : "канал · приватный";

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
  });
}
document.getElementById("searchInput").addEventListener("input", loadChats);

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
  const canDeleteForMe = isMember || chat.type === "public" || (isChannel && chat.isPublic);

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
  const ok = await showConfirm(
    "Чат исчезнет из вашего списка. У других участников он останется.",
    "Удалить у меня?"
  );
  if (!ok) return;
  await remove(ref(db, "chats/" + chatId + "/members/" + currentUser.uid));
  pendingDeleteChatId = null;
  pendingDeleteChatData = null;
}

async function deleteChatForAll() {
  if (!pendingDeleteChatId || !pendingDeleteChatData) return;
  const chatId = pendingDeleteChatId;
  const chat = pendingDeleteChatData;
  const ok = await showConfirm(
    "Чат будет удалён у всех участников без возможности восстановления.",
    "Удалить у всех?"
  );
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
  document.getElementById("chatTitle").textContent = chat.name;
  document.getElementById("messages").innerHTML = "";
  showScreen("screen-messages");

  const inputArea = document.getElementById("inputArea");
  if (chat.type === "channel" && chat.owner !== currentUser.uid) {
    inputArea.style.display = "none";
  } else {
    inputArea.style.display = "flex";
  }

  if (unsubMessages) unsubMessages();
  unsubMessages = onChildAdded(ref(db, "messages/" + chatId), (snapshot) => {
    renderMessage(snapshot.val());
  });
}

document.getElementById("chatTitle").addEventListener("click", () => {
  if (currentChatId) openChatProfile();
});

// ==== Профиль чата ====
function openChatProfile() {
  if (!currentChatData) return;
  const chat = currentChatData;
  const photo = document.getElementById("cpPhoto");
  if (chat.photo) {
    photo.src = chat.photo;
  } else if (chat.type === "channel") {
    photo.src = svgAvatar("📢");
    photo.classList.add("rounded-square");
  } else {
    photo.src = svgAvatar(chat.name);
  }
  if (chat.type !== "channel") photo.classList.remove("rounded-square");

  document.getElementById("cpName").textContent = chat.name;
  let typeLabel = chat.type;
  if (chat.type === "channel") typeLabel = chat.isPublic ? "публичный канал" : "приватный канал";
  else if (chat.type === "public") typeLabel = "публичный чат";
  else if (chat.type === "private") typeLabel = "приватный чат";
  else if (chat.type === "group") typeLabel = "группа";
  document.getElementById("cpType").textContent = typeLabel;
  document.getElementById("cpDescription").textContent = chat.description || "—";

  const linkSection = document.getElementById("cpLinkSection");
  const isOwner = chat.owner === currentUser.uid;
  if (chat.inviteCode && isOwner) {
    linkSection.style.display = "block";
    document.getElementById("cpInvite").value = buildInviteLink(chat.inviteCode);
  } else {
    linkSection.style.display = "none";
  }

  const membersDiv = document.getElementById("cpMembers");
  membersDiv.innerHTML = "";
  const members = chat.members || {};
  const uids = Object.keys(members);
  if (uids.length === 0) {
    membersDiv.textContent = "—";
  } else {
    uids.forEach(uid => {
      const u = userMap[uid] || {};
      let name = u.name || u.email || "Пользователь";
      if (u.showUsername !== false && u.username) name = name + " @" + u.username;
      const isActive = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
      if (isActive) name = "⭐ " + name;

      const avatarContent = u.photo
        ? `<img src="${u.photo}">`
        : escapeHtml(name.charAt(0).toUpperCase());
      const row = document.createElement("div");
      row.className = "cp-member";
      row.innerHTML = `
        <div class="cp-member-avatar">${avatarContent}</div>
        <div>${escapeHtml(name)}${uid === chat.owner ? " 👑" : ""}</div>
      `;
      membersDiv.appendChild(row);
    });
  }

  const leaveBtn = document.getElementById("btnLeaveChat");
  if (members[currentUser.uid]) {
    leaveBtn.style.display = "block";
    leaveBtn.textContent = isOwner ? "Удалить чат" : "Выйти из чата";
  } else {
    leaveBtn.style.display = "none";
  }
  showScreen("screen-chat-profile");
}

document.getElementById("btnCpCopy").addEventListener("click", () => {
  copyToClipboard(document.getElementById("cpInvite").value);
});

document.getElementById("btnLeaveChat").addEventListener("click", async () => {
  if (!currentChatData) return;
  const isOwner = currentChatData.owner === currentUser.uid;
  const confirmMsg = isOwner ? "Удалить чат для всех?" : "Выйти из чата?";
  const ok = await showConfirm(confirmMsg, isOwner ? "Удалить чат" : "Выйти");
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
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sender = userMap[msg.sender] || {};

  let senderName = sender.name || sender.email || "Пользователь";
  if (sender.showUsername !== false && sender.username) {
    senderName = sender.name + " @" + sender.username;
  }
  const isSenderPlus = sender.isPlus === true &&
    (!sender.plusUntil || Date.now() < sender.plusUntil);
  if (isSenderPlus) senderName = "⭐ " + senderName;

  const div = document.createElement("div");
  div.className = "msg " + (isOwn ? "own" : "other");
  div.innerHTML = `
    ${!isOwn ? `<div class="sender">${escapeHtml(senderName)}</div>` : ""}
    <div>${escapeHtml(msg.text)}</div>
    <div class="time">${time}</div>
  `;
  msgDiv.appendChild(div);
  msgDiv.scrollTop = msgDiv.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function svgAvatar(letter) {
  const ch = (letter || "?").toString().charAt(0).toUpperCase();
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
      <rect width='100%' height='100%' fill='#00a884'/>
      <text x='50%' y='55%' font-size='36' fill='#fff' text-anchor='middle'
        font-family='Arial'>${ch}</text>
    </svg>`
  );
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
  await push(ref(db, "messages/" + currentChatId), {
    sender: currentUser.uid,
    text,
    timestamp: Date.now()
  });
  input.value = "";
}
document.getElementById("btnSend").addEventListener("click", sendMessage);
document.getElementById("msgInput").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

// ==== Вход по ссылке ====
async function checkInvite() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("join");
  if (!code) return;
  try {
    const inviteSnap = await get(ref(db, "invites/" + code));
    const chatId = inviteSnap.val();
    if (!chatId) {
      showAlert("Ссылка недействительна или устарела", "Ошибка");
      window.history.replaceState({}, "", "chat.html");
      return;
    }
    const memberSnap = await get(ref(db, "chats/" + chatId + "/members/" + currentUser.uid));
    if (!memberSnap.exists()) {
      await update(ref(db, "chats/" + chatId + "/members"), { [currentUser.uid]: true });
      showAlert("Вы присоединились к чату!", "Готово");
    }
    window.history.replaceState({}, "", "chat.html");
    await openChat(chatId);
  } catch (err) {
    console.error(err);
    showAlert("Ошибка при обработке ссылки", "Ошибка");
  }
}

// ==== Поиск пользователей ====
document.getElementById("btnSearchUsers").addEventListener("click", () => {
  document.getElementById("userSearchInput").value = "";
  document.getElementById("userSearchList").innerHTML = "";
  showScreen("screen-search-users");
});

document.getElementById("userSearchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
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
    const avatarContent = u.photo
      ? `<img src="${u.photo}">`
      : escapeHtml((u.name || "?").charAt(0).toUpperCase());
    let displayName = u.name || u.email || "Пользователь";
    let subText = "";
    if (u.showUsername !== false && u.username) subText = "@" + u.username;

    li.innerHTML = `
      <div class="avatar">${avatarContent}</div>
      <div class="info">
        <div class="name">${escapeHtml(displayName)}</div>
        ${subText ? `<div class="username">${escapeHtml(subText)}</div>` : ""}
      </div>
    `;
    li.onclick = () => startPrivateChatWith(uid, displayName);
    list.appendChild(li);
  }
});

async function startPrivateChatWith(uid, displayName) {
  const snap = await get(ref(db, "chats"));
  const chats = snap.val() || {};
  let existingChatId = null;
  for (const chatId in chats) {
    const c = chats[chatId];
    if (c.type !== "private") continue;
    const m = c.members || {};
    if (m[currentUser.uid] && m[uid] && Object.keys(m).length === 2) {
      existingChatId = chatId;
      break;
    }
  }
  if (existingChatId) {
    openChat(existingChatId);
  } else {
    const newRef = push(ref(db, "chats"));
    await set(newRef, {
      name: displayName,
      type: "private",
      members: { [currentUser.uid]: true, [uid]: true },
      owner: currentUser.uid,
      description: "",
      photo: null
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

  const periodText = selectedTariff === "1" ? "1 месяц"
    : selectedTariff === "3" ? "3 месяца" : "6 месяцев";

  const welcome = document.createElement("div");
  welcome.className = "msg other";
  welcome.innerHTML = `
    <div class="sender">@sqwid</div>
    <div>Здравствуйте! Я бот Sqwid.</div>
    <div>Вы выбрали тариф: <b>${periodText}</b></div>
    <div style="margin-top:8px;">Нажмите кнопку ниже, чтобы начать.</div>
    <button class="bot-start-btn" id="botStartBtn">▶ Старт</button>
  `;
  msgDiv.appendChild(welcome);
  document.getElementById("botStartBtn").addEventListener("click", showBotInstructions);
  showScreen("screen-bot");
}

function showBotInstructions() {
  if (botStarted) return;
  botStarted = true;
  const msgDiv = document.getElementById("botMessages");
  const periodText = selectedTariff === "1" ? "1 месяц"
    : selectedTariff === "3" ? "3 месяца" : "6 месяцев";

  const instruction = document.createElement("div");
  instruction.className = "msg other";
  instruction.innerHTML = `
    <div class="sender">@sqwid</div>
    <div>
      Для получения премиума на <b>${periodText}</b> нужно написать мне:
      <br><br>
      <b style="color:#f7b500;font-size:16px;">@sqwid</b>
      <br><br>
      После договора вы получите свой Sqwid+ 🎉
    </div>
    <div class="bot-message-buttons">
      <button class="bot-btn" id="botBtnWrite">Написать</button>
      <button class="bot-btn secondary" id="botBtnChange">Выбрать другой тариф</button>
    </div>
  `;
  msgDiv.appendChild(instruction);
  msgDiv.scrollTop = msgDiv.scrollHeight;

  document.getElementById("botBtnWrite").addEventListener("click", () => {
    document.getElementById("botInput").value = "@sqwid";
    document.getElementById("botInput").focus();
  });
  document.getElementById("botBtnChange").addEventListener("click", () => {
    showScreen("screen-plus");
  });
}

document.getElementById("btnBotSend").addEventListener("click", sendBotMessage);
document.getElementById("botInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBotMessage();
});

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
      reply.innerHTML = `
        <div class="sender">@sqwid</div>
        <div>
          Принято! Заявка на <b>${selectedTariff === "1" ? "1 месяц" : selectedTariff === "3" ? "3 месяца" : "6 месяцев"}</b> отправлена.
          <br><br>
          Ожидайте связи. Мы активируем Sqwid+ в ближайшее время.
        </div>
      `;
      msgDiv.appendChild(reply);
      msgDiv.scrollTop = msgDiv.scrollHeight;
    }, 1000);
  }
}

// ==== Админ-панель ====
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

    const avatarContent = u.photo
      ? `<img src="${u.photo}">`
      : escapeHtml((u.name || "?").charAt(0).toUpperCase());

    let displayName = u.name || u.email || "Пользователь";
    let subText = "";
    if (u.username) subText = "@" + u.username;

    const isActivePlus = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
    const badge = isActivePlus ? `<div class="plus-badge">⭐</div>` : "";

    li.innerHTML = `
      <div class="avatar">${avatarContent}</div>
      <div class="info">
        <div class="name">${escapeHtml(displayName)}</div>
        ${subText ? `<div class="username">${escapeHtml(subText)}</div>` : ""}
      </div>
      ${badge}
    `;
    li.onclick = () => openGivePlusModal(uid, displayName, u.username, isActivePlus);
    list.appendChild(li);
  }

  if (list.children.length === 0) {
    list.innerHTML = `<li style="padding:20px;text-align:center;color:#8696a0;">Никого не найдено</li>`;
  }
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
  if (!pendingGivePlusPeriod) {
    return showAlert("Выберите срок", "Ошибка");
  }

  const days = pendingGivePlusPeriod === "1" ? 30
    : pendingGivePlusPeriod === "3" ? 90
    : 180;

  const now = Date.now();
  const userSnap = await get(ref(db, "users/" + pendingGivePlusUid));
  const u = userSnap.val() || {};

  let baseTime = now;
  if (u.isPlus && u.plusUntil && u.plusUntil > now) baseTime = u.plusUntil;

  const plusUntil = baseTime + days * 24 * 60 * 60 * 1000;

  await update(ref(db, "users/" + pendingGivePlusUid), {
    isPlus: true,
    plusUntil: plusUntil,
    plusGivenBy: "sqwid",
    plusGivenAt: now
  });

  document.getElementById("modal-givePlus").classList.remove("active");
  showAlert(
    `Sqwid+ выдан пользователю ${pendingGivePlusName}\nСрок: ${pendingGivePlusPeriod} мес.`,
    "Готово"
  );
  pendingGivePlusUid = null;
  pendingGivePlusPeriod = null;
});

console.log("chat.js загружен");