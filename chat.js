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

// ==== Авторизация ====
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  currentUser = user;
  loadMyProfile();
  loadUsers();
  loadChats();
  await checkInvite();
});

// ==== Мой профиль ====
function loadMyProfile() {
  onValue(ref(db, "users/" + currentUser.uid), (snapshot) => {
    currentUserData = snapshot.val() || {};
    document.getElementById("profileName").textContent =
      currentUserData.name || currentUser.email.split("@")[0];

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
document.getElementById("btnBackSettings").addEventListener("click", () => {
  showScreen("screen-chats");
});

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
  document.getElementById("settingsShowUsername").checked =
    currentUserData.showUsername !== false;

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
  if (file.size > 500 * 1024) return alert("Фото до 500 КБ");
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

  if (!name) return alert("Имя не может быть пустым");

  let username = "";
  if (usernameRaw) {
    if (!/^[a-z0-9_]{3,20}$/.test(usernameRaw)) {
      return alert("Ник: только латиница, цифры и _, от 3 до 20 символов");
    }
    username = usernameRaw;

    const allUsers = await get(ref(db, "users"));
    const users = allUsers.val() || {};
    for (const uid in users) {
      if (uid !== currentUser.uid && users[uid].username === username) {
        return alert("Этот ник уже занят");
      }
    }
  }

  const updates = { name, username, bio, showUsername };
  if (settingsAvatarChanged && settingsAvatarBase64) {
    updates.photo = settingsAvatarBase64;
  }

  try {
    await update(ref(db, "users/" + currentUser.uid), updates);
    alert("Профиль сохранён");
    showScreen("screen-chats");
  } catch (e) {
    alert("Ошибка: " + e.message);
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
  if (file.size > 500 * 1024) return alert("Фото до 500 КБ");
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

  if (!name) return alert("Введите название");
  if ((type === "private" || type === "group") && selected.length === 0)
    return alert("Выберите хотя бы одного пользователя");
  if (type === "private" && selected.length > 1)
    return alert("Приватный чат — только один пользователь");

  const members = { [currentUser.uid]: true };
  selected.forEach(id => members[id] = true);

  const newRef = push(ref(db, "chats"));
  const chatData = {
    name,
    type,
    members,
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

// ==== Код-приглашение ====
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
    navigator.clipboard.writeText(text).then(() => alert("Скопировано"))
      .catch(() => alert("Скопируй вручную:\n" + text));
  } else {
    alert("Скопируй вручную:\n" + text);
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
        ? `<img src="${chat.photo}" style="width:100%;height:100%;object-fit:cover;">`
        : (isChannel ? "📢" : escapeHtml(chat.name.charAt(0).toUpperCase()));

      let subtitle = chat.type;
      if (isChannel) subtitle = chat.isPublic ? "канал · публичный" : "канал · приватный";

      li.innerHTML = `
        <div class="avatar">${avatarContent}</div>
        <div class="chat-info">
          <div class="chat-name">${escapeHtml(chat.name)}</div>
          <div class="chat-type">${subtitle}</div>
        </div>
      `;
      li.onclick = () => openChat(chatId);
      chatList.appendChild(li);
    }
  });
}
document.getElementById("searchInput").addEventListener("input", loadChats);

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
      if (u.showUsername !== false && u.username) {
        name = name + " @" + u.username;
      }
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
  if (!confirm(confirmMsg)) return;

  const chatId = currentChatId;

  if (isOwner) {
    if (currentChatData.inviteCode) {
      await remove(ref(db, "invites/" + currentChatData.inviteCode));
    }
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
    alert("В этом канале может писать только владелец");
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
      alert("Ссылка недействительна или устарела");
      window.history.replaceState({}, "", "chat.html");
      return;
    }

    const memberSnap = await get(ref(db, "chats/" + chatId + "/members/" + currentUser.uid));
    if (!memberSnap.exists()) {
      await update(ref(db, "chats/" + chatId + "/members"), {
        [currentUser.uid]: true
      });
      alert("Вы присоединились к чату!");
    }

    window.history.replaceState({}, "", "chat.html");
    await openChat(chatId);
  } catch (err) {
    console.error(err);
    alert("Ошибка при обработке ссылки");
  }
}

console.log("chat.js загружен");