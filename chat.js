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
const STAR_IMG = '<img src="sqwidstar.png" class="plus-inline-icon" alt="">';

const THEMES = {
  green:  { accent: "#00a884", light: "#00c99e", glow: "rgba(0,168,132,0.35)" },
  blue:   { accent: "#3b82f6", light: "#60a5fa", glow: "rgba(59,130,246,0.35)" },
  purple: { accent: "#a855f7", light: "#c084fc", glow: "rgba(168,85,247,0.35)" },
  orange: { accent: "#f97316", light: "#fb923c", glow: "rgba(249,115,22,0.35)" },
  red:    { accent: "#ef4444", light: "#f87171", glow: "rgba(239,68,68,0.35)" },
  pink:   { accent: "#ec4899", light: "#f472b6", glow: "rgba(236,72,153,0.35)" }
};

const SHOP_ITEMS = [
  { id: "nickColor_gold", name: "Золотой ник", price: 100, type: "nickColor", value: "#f7b500", icon: "🎨", preview: "Цвет: золото" },
  { id: "nickColor_red", name: "Красный ник", price: 100, type: "nickColor", value: "#ef4444", icon: "🎨", preview: "Цвет: красный" },
  { id: "nickColor_blue", name: "Синий ник", price: 100, type: "nickColor", value: "#3b82f6", icon: "🎨", preview: "Цвет: синий" },
  { id: "nickColor_purple", name: "Фиолетовый ник", price: 150, type: "nickColor", value: "#a855f7", icon: "🎨", preview: "Цвет: фиолетовый" },
  { id: "emoji_fire", name: "Огненный значок", price: 150, type: "emoji", value: "🔥", icon: "🔥", preview: "Значок рядом с именем" },
  { id: "emoji_diamond", name: "Алмаз", price: 200, type: "emoji", value: "💎", icon: "💎", preview: "Значок рядом с именем" },
  { id: "emoji_crown", name: "Корона", price: 250, type: "emoji", value: "👑", icon: "👑", preview: "Значок рядом с именем" },
  { id: "frame_gold", name: "Золотая рамка", price: 200, type: "frame", value: "gold", icon: "🖼", preview: "Золотое кольцо вокруг авы" },
  { id: "frame_fire", name: "Огненная рамка", price: 300, type: "frame", value: "fire", icon: "🖼", preview: "Огненное кольцо вокруг авы" },
  { id: "frame_rainbow", name: "Радужная рамка", price: 500, type: "frame", value: "rainbow", icon: "🖼", preview: "Радужное кольцо вокруг авы" },

  { id: "uname_piska67", name: "@piska67", price: 2500, type: "username", value: "piska67", icon: "🏷", preview: "Уникальный юзернейм" },
  { id: "uname_fanat", name: "@fanat", price: 1500, type: "username", value: "fanat", icon: "🏷", preview: "Уникальный юзернейм" },
  { id: "uname_BOG", name: "@BOG", price: 2000, type: "username", value: "BOG", icon: "🏷", preview: "Уникальный юзернейм" },
  { id: "uname_durov", name: "@durov", price: 5000, type: "username", value: "durov", icon: "👑", preview: "Легендарный" },
  { id: "uname_sqwidfan", name: "@sqwidfan", price: 800, type: "username", value: "sqwidfan", icon: "🏷", preview: "Уникальный" },
  { id: "uname_sqwidplus", name: "@sqwid+", price: 1500, type: "username", value: "sqwid+", icon: "⭐", preview: "Уникальный" },
  { id: "uname_fire", name: "@fire", price: 1200, type: "username", value: "fire", icon: "🔥", preview: "Уникальный" },
  { id: "uname_god", name: "@god", price: 2000, type: "username", value: "god", icon: "🏷", preview: "Короткий" },
  { id: "uname_king", name: "@king", price: 1800, type: "username", value: "king", icon: "👑", preview: "Короткий" },
  { id: "uname_boss", name: "@boss", price: 1500, type: "username", value: "boss", icon: "🏷", preview: "Короткий" },
  { id: "uname_pro", name: "@pro", price: 1500, type: "username", value: "pro", icon: "🏷", preview: "Короткий" },
  { id: "uname_top", name: "@top", price: 1200, type: "username", value: "top", icon: "🏷", preview: "Короткий" },
  { id: "uname_vip", name: "@vip", price: 1500, type: "username", value: "vip", icon: "💎", preview: "Короткий" },
  { id: "uname_op", name: "@op", price: 1000, type: "username", value: "op", icon: "🏷", preview: "Короткий" },
  { id: "uname_shadow", name: "@shadow", price: 1200, type: "username", value: "shadow", icon: "🌑", preview: "Красивый" },
  { id: "uname_ghost", name: "@ghost", price: 1200, type: "username", value: "ghost", icon: "👻", preview: "Красивый" },
  { id: "uname_phoenix", name: "@phoenix", price: 1500, type: "username", value: "phoenix", icon: "🦅", preview: "Красивый" },
  { id: "uname_dragon", name: "@dragon", price: 1500, type: "username", value: "dragon", icon: "🐉", preview: "Красивый" },
  { id: "uname_ninja", name: "@ninja", price: 1200, type: "username", value: "ninja", icon: "🥷", preview: "Красивый" },
  { id: "uname_wolf", name: "@wolf", price: 1200, type: "username", value: "wolf", icon: "🐺", preview: "Красивый" },
  { id: "uname_storm", name: "@storm", price: 1200, type: "username", value: "storm", icon: "⚡", preview: "Красивый" },
  { id: "uname_frost", name: "@frost", price: 1200, type: "username", value: "frost", icon: "❄️", preview: "Красивый" },
  { id: "uname_sqwidceo", name: "@sqwidceo", price: 3000, type: "username", value: "sqwidceo", icon: "👑", preview: "Sqwid-CEO" },
  { id: "uname_sqwidteam", name: "@sqwidteam", price: 2000, type: "username", value: "sqwidteam", icon: "⭐", preview: "Команда Sqwid" },
  { id: "uname_sigma", name: "@sigma", price: 1500, type: "username", value: "sigma", icon: "🗿", preview: "Мемный" },
  { id: "uname_chad", name: "@chad", price: 1800, type: "username", value: "chad", icon: "💪", preview: "Мемный" },
  { id: "uname_gigachad", name: "@gigachad", price: 2500, type: "username", value: "gigachad", icon: "🗿", preview: "Мемный" }
];

let currentUser = null;
let currentUserData = {};
let currentChatId = null;
let currentChatData = null;
let userMap = {};
let unsubMessages = null;
let unsubChats = null;
let unsubLastRead = null;
let unsubAllMessages = null;
let unsubTheme = null;
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
let pendingGiveCoinsUid = null;
let pendingGiveCoinsName = "";
let pendingSellItem = null;
let searchTab = "people";
let lastReadMap = {};
let unreadCounts = {};
let toastTimer = null;
let msgListenerStart = 0;
let replyTo = null;
let firstChatsLoad = true;
let currentTheme = "green";

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
  } catch (e) {}
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  currentUser = user;
  loadMyProfile();
  loadUsers();
  showChatSkeleton();
  loadChats();
  loadLastRead();
  loadTheme();
  await checkInvite();
  await checkUserLink();
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

/* ===== ТЕМА ===== */
function loadTheme() {
  if (unsubTheme) unsubTheme();
  unsubTheme = onValue(ref(db, "users/" + currentUser.uid + "/theme"), (snap) => {
    currentTheme = snap.val() || "green";
    applyTheme(currentTheme);
    updateThemePicker();
  });
}
function applyTheme(name) {
  const t = THEMES[name] || THEMES.green;
  document.documentElement.style.setProperty("--accent", t.accent);
  document.documentElement.style.setProperty("--accent-light", t.light);
  document.documentElement.style.setProperty("--accent-glow", t.glow);
}
function updateThemePicker() {
  document.querySelectorAll(".theme-swatch").forEach(sw => {
    sw.classList.toggle("selected", sw.dataset.theme === currentTheme);
  });
}
document.querySelectorAll(".theme-swatch").forEach(sw => {
  sw.addEventListener("click", async () => {
    if (!isPlusActive()) return showAlert("Смена темы доступна только Sqwid+", "Только Sqwid+");
    await update(ref(db, "users/" + currentUser.uid), { theme: sw.dataset.theme });
  });
});

/* ===== ПРОФИЛЬ ===== */
function loadMyProfile() {
  onValue(ref(db, "users/" + currentUser.uid), (snapshot) => {
    currentUserData = snapshot.val() || {};
    updateMyProfileUI();
    updateEmailVisibility();
    updateCoinsUI();
  });
}

function updateMyProfileUI() {
  let myName = currentUserData.name || currentUser.email.split("@")[0];
  const isMePlus = currentUserData.isPlus === true &&
    (!currentUserData.plusUntil || Date.now() < currentUserData.plusUntil);
  const nickColor = currentUserData.nickColor;
  const emoji = currentUserData.nickEmoji;

  let nameHTML = "";
  if (isMePlus) nameHTML += STAR_IMG + " ";
  if (nickColor) nameHTML += `<span style="color:${nickColor}">${escapeHtml(myName)}</span>`;
  else nameHTML += escapeHtml(myName);
  if (emoji) nameHTML += ` <span class="nick-emoji">${emoji}</span>`;
  document.getElementById("profileName").innerHTML = nameHTML;

  const photo = document.getElementById("profilePhoto");
  if (currentUserData.photo) photo.src = currentUserData.photo;
  else photo.src = svgAvatar(myName);
}

function updateCoinsUI() {
  const coins = currentUserData.coins || 0;
  const burgerEl = document.getElementById("burgerCoins");
  if (burgerEl) burgerEl.textContent = coins;
  const shopEl = document.getElementById("shopBalance");
  if (shopEl) shopEl.textContent = "🪙 " + coins + " SQ";
  const shopBig = document.getElementById("shopBalanceBig");
  if (shopBig) shopBig.textContent = "🪙 " + coins + " SQ";
  const shopBig2 = document.getElementById("shopBalanceBig2");
  if (shopBig2) shopBig2.textContent = "🪙 " + coins + " SQ";
  const mpEl = document.getElementById("mpCoins");
  if (mpEl) mpEl.textContent = "🪙 " + coins + " SQ";
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

document.getElementById("btnMyProfile").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  openMyProfile();
});
document.getElementById("btnBackMyProfile").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnEditProfile").addEventListener("click", () => openSettings());
document.getElementById("btnMySqwidPlus").addEventListener("click", () => showScreen("screen-plus"));
document.getElementById("btnAboutFromSettings").addEventListener("click", () => {
  document.getElementById("modal-about").classList.add("active");
});
document.getElementById("btnOpenShop").addEventListener("click", () => openShop());
document.getElementById("btnOpenShopBurger").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  openShop();
});
document.getElementById("btnOpenInventory").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  openInventory();
});

async function openMyProfile() {
  showScreen("screen-my-profile");
  const photo = document.getElementById("mpPhoto");
  if (currentUserData.photo) photo.src = currentUserData.photo;
  else photo.src = svgAvatar(currentUserData.name || "?");

  let myName = currentUserData.name || currentUser.email.split("@")[0];
  const isMePlus = isPlusActive();
  const nickColor = currentUserData.nickColor;
  const emoji = currentUserData.nickEmoji;

  let nameHTML = "";
  if (isMePlus) nameHTML += STAR_IMG + " ";
  if (nickColor) nameHTML += `<span style="color:${nickColor}">${escapeHtml(myName)}</span>`;
  else nameHTML += escapeHtml(myName);
  if (emoji) nameHTML += ` <span class="nick-emoji">${emoji}</span>`;
  document.getElementById("mpName").innerHTML = nameHTML;

  document.getElementById("mpUsername").textContent =
    currentUserData.username ? "@" + currentUserData.username : "нет юзернейма";
  document.getElementById("mpBio").textContent =
    currentUserData.bio || "Расскажите о себе в настройках";
  updateCoinsUI();

  const chatsSnap = await get(ref(db, "chats"));
  const chats = chatsSnap.val() || {};
  let myChats = 0;
  for (const id in chats) {
    const c = chats[id];
    if (c.members && c.members[currentUser.uid]) myChats++;
  }
  document.getElementById("mpStatChats").textContent = myChats;

  const msgsSnap = await get(ref(db, "messages"));
  const allMsgs = msgsSnap.val() || {};
  let myMessages = 0, myPhotos = 0;
  for (const chatId in allMsgs) {
    const msgs = allMsgs[chatId] || {};
    for (const mid in msgs) {
      const m = msgs[mid];
      if (m.sender === currentUser.uid) {
        myMessages++;
        if (m.type === "photo") myPhotos++;
      }
    }
  }
  document.getElementById("mpStatMessages").textContent = myMessages;
  document.getElementById("mpStatPhotos").textContent = myPhotos;
}

document.getElementById("mpPhoto").addEventListener("click", () => {
  if (!currentUserData.photo) return;
  document.getElementById("photoViewerImg").src = currentUserData.photo;
  document.getElementById("photoViewer").classList.add("active");
});

document.getElementById("btnShareProfile").addEventListener("click", () => {
  const base = window.location.origin + window.location.pathname.replace("chat.html", "");
  const link = currentUserData.username
    ? base + "chat.html?u=" + currentUserData.username
    : base + "chat.html?uid=" + currentUser.uid;
  document.getElementById("shareLink").value = link;
  document.getElementById("modal-share").classList.add("active");
});
document.getElementById("btnCloseShare").addEventListener("click", () => {
  document.getElementById("modal-share").classList.remove("active");
});
document.getElementById("btnCopyShare").addEventListener("click", () => {
  copyToClipboard(document.getElementById("shareLink").value);
});

/* ===== МАГАЗИН ===== */
document.getElementById("btnBackShop").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackInventory").addEventListener("click", () => showScreen("screen-shop"));

document.querySelectorAll(".shop-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    document.querySelectorAll(".shop-tab").forEach(t => t.classList.toggle("active", t === tab));
    document.getElementById("shopTabShop").style.display = target === "shop" ? "block" : "none";
    document.getElementById("shopTabMarket").style.display = target === "market" ? "block" : "none";
    document.getElementById("shopTabMy").style.display = target === "my" ? "block" : "none";
    if (target === "market") renderMarket();
    if (target === "my") renderMyUsernames();
    if (target === "shop") renderShop();
  });
});

function openShop() {
  renderShop();
  updateCoinsUI();
  document.querySelectorAll(".shop-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === "shop"));
  document.getElementById("shopTabShop").style.display = "block";
  document.getElementById("shopTabMarket").style.display = "none";
  document.getElementById("shopTabMy").style.display = "none";
  showScreen("screen-shop");
}

async function renderShop() {
  const nicks = SHOP_ITEMS.filter(i => i.type === "nickColor");
  const emojis = SHOP_ITEMS.filter(i => i.type === "emoji");
  const frames = SHOP_ITEMS.filter(i => i.type === "frame");
  const usernames = SHOP_ITEMS.filter(i => i.type === "username");
  await renderShopGrid("shopGridNicks", nicks);
  await renderShopGrid("shopGridEmojis", emojis);
  await renderShopGrid("shopGridFrames", frames);
  await renderShopGrid("shopGridUsernames", usernames);
}

async function renderShopGrid(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const inv = currentUserData.inventory || {};

  const allUsersSnap = await get(ref(db, "users"));
  const allUsers = allUsersSnap.val() || {};
  const takenUsernames = {};
  for (const uid in allUsers) {
    if (allUsers[uid].username) takenUsernames[allUsers[uid].username] = uid;
  }

  items.forEach(item => {
    const owned = inv[item.id] === true;
    let isEquipped = false;
    if (item.type === "nickColor") isEquipped = currentUserData.nickColor === item.value;
    else if (item.type === "emoji") isEquipped = currentUserData.nickEmoji === item.value;
    else if (item.type === "frame") isEquipped = currentUserData.avatarFrame === item.value;
    else if (item.type === "username") isEquipped = currentUserData.username === item.value;

    let sold = false;
    if (item.type === "username") {
      const ownerUid = takenUsernames[item.value];
      if (ownerUid && ownerUid !== currentUser.uid) sold = true;
    }

    const el = document.createElement("div");
    el.className = "shop-item" + (sold ? " sold" : "");
    let btnHTML = "", btnClass = "";
    if (!sold) {
      if (isEquipped) { btnHTML = "✓ Активен"; btnClass = "equipped"; }
      else if (owned) { btnHTML = "Куплено"; btnClass = "owned"; }
      else btnHTML = "Купить";
    }

    el.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${escapeHtml(item.name)}</div>
        <div class="shop-item-preview">${escapeHtml(item.preview)}</div>
        <div class="shop-item-price">🪙 ${item.price} SQ</div>
      </div>
      ${!sold ? `<button class="shop-item-btn ${btnClass}">${btnHTML}</button>` : ""}
    `;
    const btn = el.querySelector(".shop-item-btn");
    if (btn) {
      if (!owned) btn.addEventListener("click", () => buyItem(item));
      else if (!isEquipped) btn.addEventListener("click", () => equipItem(item));
    }
    container.appendChild(el);
  });
}

async function buyItem(item) {
  const coins = currentUserData.coins || 0;
  if (coins < item.price) return showAlert(`Недостаточно SQ.\n\nНужно: ${item.price}\nУ вас: ${coins}`, "Мало монет");

  if (item.type === "username") {
    const allUsers = await get(ref(db, "users"));
    const users = allUsers.val() || {};
    for (const uid in users) {
      if (uid !== currentUser.uid && users[uid].username === item.value) {
        return showAlert(`@${item.value} уже занят`, "Занято");
      }
    }
  }

  const ok = await showConfirm(`Купить «${item.name}» за ${item.price} SQ?`, "Покупка");
  if (!ok) return;

  const updates = { coins: coins - item.price };
  updates[`inventory/${item.id}`] = true;

  // Юзернейм сразу становится основным
  if (item.type === "username") {
    updates.username = item.value;
  }

  try {
    await update(ref(db, "users/" + currentUser.uid), updates);
    showAlert(`Куплено: ${item.name}`, "Готово");
    await renderShop();
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
}

async function equipItem(item, silent = false) {
  const updates = {};
  if (item.type === "nickColor") updates.nickColor = item.value;
  else if (item.type === "emoji") updates.nickEmoji = item.value;
  else if (item.type === "frame") updates.avatarFrame = item.value;
  else if (item.type === "username") {
    const allUsers = await get(ref(db, "users"));
    const users = allUsers.val() || {};
    for (const uid in users) {
      if (uid !== currentUser.uid && users[uid].username === item.value) {
        return showAlert(`@${item.value} занят`, "Занято");
      }
    }
    updates.username = item.value;
  }
  try {
    await update(ref(db, "users/" + currentUser.uid), updates);
    if (!silent) showToast("Активировано: " + item.name);
    await renderShop();
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
}

/* ===== МАРКЕТ ===== */
async function renderMarket() {
  const grid = document.getElementById("marketGrid");
  grid.innerHTML = `<div style="padding:40px;text-align:center;color:#8696a0;">Загрузка...</div>`;
  const snap = await get(ref(db, "market"));
  const listings = snap.val() || {};
  grid.innerHTML = "";
  const ids = Object.keys(listings);
  if (ids.length === 0) {
    grid.innerHTML = `<div style="padding:40px 20px;text-align:center;color:#8696a0;">Пока никто не продаёт юзернеймы</div>`;
    return;
  }
  ids.forEach(itemId => {
    const listing = listings[itemId];
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    const isOwn = listing.sellerUid === currentUser.uid;
    const el = document.createElement("div");
    el.className = "shop-item on-sale";
    el.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">@${escapeHtml(listing.username)}</div>
        <div class="shop-item-preview">Продавец: ${escapeHtml(listing.sellerName || "—")}</div>
        <div class="shop-item-price">🪙 ${listing.price} SQ</div>
      </div>
      ${!isOwn ? `<button class="shop-item-btn buy-market">Купить</button>` : `<button class="shop-item-btn sell" data-cancel="1">Снять</button>`}
    `;
    if (!isOwn) el.querySelector(".buy-market").addEventListener("click", () => buyFromMarket(itemId, listing, item));
    else el.querySelector('[data-cancel]').addEventListener("click", () => cancelListing(itemId));
    grid.appendChild(el);
  });
}

async function buyFromMarket(itemId, listing, item) {
  const coins = currentUserData.coins || 0;
  if (coins < listing.price) return showAlert(`Недостаточно SQ.\n\nНужно: ${listing.price}\nУ вас: ${coins}`, "Мало монет");
  const ok = await showConfirm(`Купить @${listing.username} за ${listing.price} SQ?`, "Покупка");
  if (!ok) return;

  try {
    await update(ref(db, "users/" + currentUser.uid), {
      coins: coins - listing.price,
      [`inventory/${itemId}`]: true,
      username: listing.username
    });
    const sellerSnap = await get(ref(db, "users/" + listing.sellerUid + "/coins"));
    const sellerCoins = sellerSnap.val() || 0;
    await update(ref(db, "users/" + listing.sellerUid), {
      coins: sellerCoins + listing.price,
      [`inventory/${itemId}`]: null,
      username: null
    });
    await remove(ref(db, "market/" + itemId));
    showAlert(`Куплено: @${listing.username}`, "Готово");
    renderMarket();
    renderShop();
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
}

async function cancelListing(itemId) {
  const ok = await showConfirm("Снять лот с продажи?", "Отмена продажи");
  if (!ok) return;
  await remove(ref(db, "market/" + itemId));
  showToast("Лот снят");
  renderMarket();
  renderMyUsernames();
}

/* ===== МОИ ЮЗЕРНЕЙМЫ ===== */
async function renderMyUsernames() {
  const grid = document.getElementById("myUsernamesGrid");
  grid.innerHTML = "";
  const inv = currentUserData.inventory || {};
  const myNames = SHOP_ITEMS.filter(i => i.type === "username" && inv[i.id] === true);
  if (myNames.length === 0) {
    grid.innerHTML = `<div style="padding:40px 20px;text-align:center;color:#8696a0;">У вас нет купленных юзернеймов</div>`;
    return;
  }
  const snap = await get(ref(db, "market"));
  const listings = snap.val() || {};
  myNames.forEach(item => {
    const isActive = currentUserData.username === item.value;
    const onSale = listings[item.id] !== undefined;
    const el = document.createElement("div");
    el.className = "shop-item" + (isActive ? " on-sale" : "");
    let statusText = isActive ? "● Активен" : onSale ? "🏪 На продаже" : "Не активен";
    el.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">@${escapeHtml(item.value)}</div>
        <div class="shop-item-preview">${statusText}</div>
      </div>
      ${!onSale ? `<button class="shop-item-btn sell">Продать</button>` : `<button class="shop-item-btn sell" data-cancel="1">Снять</button>`}
    `;
    if (!onSale) el.querySelector(".sell").addEventListener("click", () => openSellModal(item));
    else el.querySelector('[data-cancel]').addEventListener("click", () => cancelListing(item.id));
    grid.appendChild(el);
  });
}

function openSellModal(item) {
  pendingSellItem = item;
  document.getElementById("sellItemName").textContent = "@" + item.value;
  document.getElementById("sellPrice").value = item.price || 1000;
  document.getElementById("modal-sell").classList.add("active");
}

document.getElementById("btnSellCancel").addEventListener("click", () => {
  document.getElementById("modal-sell").classList.remove("active");
  pendingSellItem = null;
});

document.getElementById("btnSellConfirm").addEventListener("click", async () => {
  if (!pendingSellItem) return;
  const price = parseInt(document.getElementById("sellPrice").value);
  if (isNaN(price) || price <= 0) return showAlert("Введи цену больше 0", "Ошибка");
  try {
    await set(ref(db, "market/" + pendingSellItem.id), {
      sellerUid: currentUser.uid,
      sellerName: currentUserData.name || currentUser.email,
      username: pendingSellItem.value,
      price: price,
      listedAt: Date.now()
    });
    document.getElementById("modal-sell").classList.remove("active");
    showAlert(`@${pendingSellItem.value} выставлен за ${price} SQ`, "Готово");
    pendingSellItem = null;
    renderMyUsernames();
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
});

/* ===== ИНВЕНТАРЬ ===== */
function openInventory() {
  renderInventory();
  showScreen("screen-inventory");
}

async function renderInventory() {
  const all = document.getElementById("inventoryAll");
  const active = document.getElementById("inventoryActive");
  all.innerHTML = "";
  active.innerHTML = "";

  const inv = currentUserData.inventory || {};
  const ids = Object.keys(inv);
  if (ids.length === 0) {
    all.innerHTML = `<div style="padding:40px 20px;text-align:center;color:#8696a0;">Пусто. Купи что-нибудь в магазине.</div>`;
    return;
  }

  const marketSnap = await get(ref(db, "market"));
  const market = marketSnap.val() || {};

  ids.forEach(id => {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    let isEquipped = false;
    if (item.type === "nickColor") isEquipped = currentUserData.nickColor === item.value;
    else if (item.type === "emoji") isEquipped = currentUserData.nickEmoji === item.value;
    else if (item.type === "frame") isEquipped = currentUserData.avatarFrame === item.value;
    else if (item.type === "username") isEquipped = currentUserData.username === item.value;

    const onSale = market[item.id] !== undefined;

    const el = document.createElement("div");
    el.className = "inventory-item" + (isEquipped ? " active" : "");

    let statusText = item.preview;
    if (item.type === "username" && isEquipped) statusText = "● Активен";
    else if (isEquipped) statusText = "● Активно";

    let actions = "";
    if (item.type === "username") {
      if (isEquipped) {
        actions = `<button class="inventory-item-btn" disabled>● Активен</button>`;
      } else {
        actions = `<button class="inventory-item-btn" data-action="activate">Сделать активным</button>`;
      }
      if (!onSale) {
        actions += `<button class="inventory-item-btn sell" data-action="sell">Продать</button>`;
      } else {
        actions += `<button class="inventory-item-btn sell" data-action="cancel-sale">Снять</button>`;
      }
    } else {
      if (isEquipped) {
        actions = `<button class="inventory-item-btn remove" data-action="remove">Снять</button>`;
      } else {
        actions = `<button class="inventory-item-btn" data-action="activate">Надеть</button>`;
      }
    }

    el.innerHTML = `
      <div class="inventory-item-icon">${item.icon}</div>
      <div class="inventory-item-info">
        <div class="inventory-item-name">${escapeHtml(item.name)}</div>
        <div class="inventory-item-status">${statusText}</div>
      </div>
      <div class="inventory-item-actions">${actions}</div>
    `;

    el.querySelectorAll("[data-action]").forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener("click", async () => {
        if (action === "activate") await equipItem(item, false).then(renderInventory);
        else if (action === "remove") await unequipItem(item).then(renderInventory);
        else if (action === "sell") openSellModal(item);
        else if (action === "cancel-sale") await cancelListing(item.id).then(renderInventory);
      });
    });

    all.appendChild(el);
    if (isEquipped) active.appendChild(el.cloneNode(true));
  });

  if (active.children.length === 0) {
    active.innerHTML = `<div style="padding:20px;text-align:center;color:#8696a0;">Ничего не надето</div>`;
  }
}

async function unequipItem(item) {
  const updates = {};
  if (item.type === "nickColor") updates.nickColor = null;
  else if (item.type === "emoji") updates.nickEmoji = null;
  else if (item.type === "frame") updates.avatarFrame = null;
  else if (item.type === "username") updates.username = null;
  try {
    await update(ref(db, "users/" + currentUser.uid), updates);
    showToast("Снято: " + item.name);
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
}

/* ===== ССЫЛКА НА ПРОФИЛЬ ===== */
async function checkUserLink() {
  const params = new URLSearchParams(window.location.search);
  const username = params.get("u");
  const uid = params.get("uid");
  if (!username && !uid) return;

  let targetUid = uid;
  if (username && !targetUid) {
    const usersSnap = await get(ref(db, "users"));
    const users = usersSnap.val() || {};
    for (const u in users) {
      if (users[u].username && users[u].username.toLowerCase() === username.toLowerCase()) {
        targetUid = u;
        break;
      }
    }
  }
  if (!targetUid) {
    showAlert("Пользователь не найден", "Ошибка");
    window.history.replaceState({}, "", "chat.html");
    return;
  }
  const userSnap = await get(ref(db, "users/" + targetUid));
  const u = userSnap.val();
  if (!u) {
    showAlert("Пользователь не найден", "Ошибка");
    window.history.replaceState({}, "", "chat.html");
    return;
  }
  window.history.replaceState({}, "", "chat.html");
  showUserProfile(targetUid, u);
}

function showUserProfile(uid, u) {
  const photo = document.getElementById("upPhoto");
  if (u.photo) photo.src = u.photo;
  else photo.src = svgAvatar(u.name || "?");

  const wrap = document.getElementById("upFrameWrap");
  wrap.classList.remove("frame-gold", "frame-fire", "frame-rainbow");
  if (u.avatarFrame) wrap.classList.add("frame-" + u.avatarFrame);

  let name = u.name || u.email || "Пользователь";
  const isPlus = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
  let nameHTML = "";
  if (isPlus) nameHTML += STAR_IMG + " ";
  if (u.nickColor) nameHTML += `<span style="color:${u.nickColor}">${escapeHtml(name)}</span>`;
  else nameHTML += escapeHtml(name);
  if (u.nickEmoji) nameHTML += ` <span class="nick-emoji">${u.nickEmoji}</span>`;
  document.getElementById("upName").innerHTML = nameHTML;

  document.getElementById("upUsername").textContent = u.username ? "@" + u.username : "";
  document.getElementById("upBio").textContent = u.bio || "Без описания";

  document.getElementById("btnUpWrite").onclick = () => {
    startPrivateChatWith(uid, name);
  };
  showScreen("screen-user-profile");
}
document.getElementById("btnBackUserProfile").addEventListener("click", () => showScreen("screen-chats"));

/* ===== МЕНЮ ===== */
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

/* ===== НАВИГАЦИЯ ===== */
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
  } else showScreen("screen-chats");
});
document.getElementById("btnBackSettings").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackMemory").addEventListener("click", () => showScreen("screen-settings"));
document.getElementById("btnBackPlus").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackBot").addEventListener("click", () => showScreen("screen-plus"));
document.getElementById("btnBackSearch").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackAdmin").addEventListener("click", () => showScreen("screen-chats"));
document.getElementById("btnBackAccounts").addEventListener("click", () => showScreen("screen-chats"));

/* ===== НАСТРОЙКИ ===== */
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
  document.getElementById("settingsHideOnline").checked = currentUserData.hideOnline === true;
  updateSettingsEmailBtn();
  updateThemePicker();
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
  const hideOnline = document.getElementById("settingsHideOnline").checked;
  if (!name) return showAlert("Имя не может быть пустым", "Ошибка");

  let username = "";
  if (usernameRaw) {
    if (!/^[a-z0-9_]{3,20}$/.test(usernameRaw)) return showAlert("Ник: только латиница, цифры и _, от 3 до 20", "Ошибка");
    username = usernameRaw;

    const PREMIUM = SHOP_ITEMS.filter(i => i.type === "username").map(i => i.value.toLowerCase());
    if (PREMIUM.includes(username.toLowerCase())) {
      return showAlert("Этот юзернейм можно только купить в магазине", "Занято");
    }

    const allUsers = await get(ref(db, "users"));
    const users = allUsers.val() || {};
    for (const uid in users) {
      if (uid !== currentUser.uid && users[uid].username && users[uid].username.toLowerCase() === username.toLowerCase()) {
        return showAlert("Этот ник уже занят", "Ошибка");
      }
    }
  }

  const updates = { name, bio, showUsername, hideOnline };
  if (username) updates.username = username;
  if (settingsAvatarChanged && settingsAvatarBase64) updates.photo = settingsAvatarBase64;

  try {
    await update(ref(db, "users/" + currentUser.uid), updates);
    showAlert("Профиль сохранён", "Готово");
    showScreen("screen-chats");
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
}

/* ===== ПАМЯТЬ ===== */
document.getElementById("btnMemory").addEventListener("click", () => openMemoryScreen());

async function openMemoryScreen() {
  document.getElementById("memoryTotal").textContent = "Считаем...";
  document.getElementById("memoryPhotos").textContent = "—";
  document.getElementById("memoryTexts").textContent = "—";
  showScreen("screen-memory");
  const snap = await get(ref(db, "messages"));
  const allChats = snap.val() || {};
  let photoBytes = 0, photoCount = 0, textCount = 0;
  for (const chatId in allChats) {
    const msgs = allChats[chatId] || {};
    for (const mid in msgs) {
      const m = msgs[mid];
      if (m.type === "photo" && m.photo) { photoCount++; photoBytes += m.photo.length; }
      else textCount++;
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
  const ok = await showConfirm("Все фото во всех чатах будут удалены. Текст останется.", "Очистить фото?");
  if (!ok) return;
  const snap = await get(ref(db, "messages"));
  const allChats = snap.val() || {};
  let removed = 0;
  for (const chatId in allChats) {
    const msgs = allChats[chatId] || {};
    for (const mid in msgs) {
      const m = msgs[mid];
      if (m.type === "photo" && m.photo) {
        await update(ref(db, "messages/" + chatId + "/" + mid), { type: "text", text: "[фото удалено]", photo: null });
        removed++;
      }
    }
  }
  showAlert(`Удалено фото: ${removed}`, "Готово");
  openMemoryScreen();
});

/* ===== АККАУНТЫ ===== */
function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); } catch { return []; }
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
  const accounts = getSavedAccounts().filter(a => a.email !== currentUser.email);
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
  const ok = await showConfirm("Текущий аккаунт будет сохранён. Вы выйдете и войдёте заново.", "Добавить аккаунт?");
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
  } catch (e) { showAlert("Не удалось войти: " + e.message, "Ошибка"); }
}

/* ===== СОЗДАНИЕ ЧАТА ===== */
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
  if ((type === "private" || type === "group") && selected.length === 0) return showAlert("Выберите хотя бы одного", "Ошибка");
  if (type === "private" && selected.length > 1) return showAlert("Только один пользователь", "Ошибка");

  let slug = "";
  if (type === "group" || type === "channel") {
    if (!slugRaw) return showAlert("Введите @юзернейм", "Ошибка");
    if (!/^[a-z0-9_]{3,20}$/.test(slugRaw)) return showAlert("Юзернейм: только латиница, цифры и _", "Ошибка");
    if (RESERVED_SLUGS.includes(slugRaw)) return showAlert("Зарезервирован", "Ошибка");
    slug = slugRaw;
    const allChats = await get(ref(db, "chats"));
    const chats = allChats.val() || {};
    for (const id in chats) if (chats[id].slug === slug) return showAlert("Этот юзернейм уже занят", "Ошибка");
  }

  const members = { [currentUser.uid]: true };
  selected.forEach(id => members[id] = true);

  const newRef = push(ref(db, "chats"));
  const chatData = { name, type, members, owner: currentUser.uid, description: description || "", photo: chatAvatarBase64 || null };
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
    } else await set(newRef, chatData);
  } else if (type === "private" || type === "group") {
    const code = generateInviteCode();
    chatData.inviteCode = code;
    await set(newRef, chatData);
    await set(ref(db, "invites/" + code), newRef.key);
    showInviteLink(code);
  } else await set(newRef, chatData);

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

/* ===== SKELETON + СПИСОК ===== */
function showChatSkeleton() {
  const chatList = document.getElementById("chatList");
  chatList.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="skeleton skeleton-avatar"></div>
      <div style="flex:1;">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `;
    chatList.appendChild(li);
  }
}

function showEmptyChats() {
  const chatList = document.getElementById("chatList");
  chatList.innerHTML = `
    <div class="empty-state">
      <div class="emoji">💬</div>
      <div class="title">У вас ещё нет чатов</div>
      <div class="sub">Нажмите + внизу, чтобы создать</div>
    </div>
  `;
}

function buildNickHTML(u, baseName) {
  let html = "";
  const isPlus = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
  if (isPlus) html += STAR_IMG + " ";
  if (u.nickColor) html += `<span style="color:${u.nickColor}">${escapeHtml(baseName)}</span>`;
  else html += escapeHtml(baseName);
  if (u.nickEmoji) html += ` <span class="nick-emoji">${u.nickEmoji}</span>`;
  return html;
}

function loadChats() {
  const chatList = document.getElementById("chatList");
  if (unsubChats) unsubChats();
  unsubChats = onValue(ref(db, "chats"), (snapshot) => {
    const chats = snapshot.val() || {};
    const search = (document.getElementById("searchInput").value || "").toLowerCase();
    const hasAny = Object.keys(chats).length > 0;
    if (!hasAny && firstChatsLoad) {
      showEmptyChats();
      firstChatsLoad = false;
      return;
    }
    firstChatsLoad = false;

    chatList.innerHTML = "";
    let visibleCount = 0;
    for (const chatId in chats) {
      const chat = chats[chatId];
      const isMember = chat.members && chat.members[currentUser.uid];
      const isPublicChat = chat.type === "public";
      if (!isPublicChat && !isMember) continue;
      if (search && !chat.name.toLowerCase().includes(search)) continue;
      visibleCount++;

      const li = document.createElement("li");
      li.dataset.chatId = chatId;
      const isChannel = chat.type === "channel";
      const avatarContent = chat.photo ? `<img src="${chat.photo}">`
        : (isChannel ? "📢" : escapeHtml(chat.name.charAt(0).toUpperCase()));

      let subtitle = chat.type;
      if (isChannel) subtitle = chat.isPublic ? "канал · публичный" : "канал · приватный";
      if (chat.slug) subtitle += ` · @${chat.slug}`;

      let nameHTML = escapeHtml(chat.name);
      if (chat.type === "private") {
        const otherUid = Object.keys(chat.members || {}).find(u => u !== currentUser.uid);
        if (otherUid) {
          const ou = userMap[otherUid] || {};
          nameHTML = buildNickHTML(ou, ou.name || ou.email || chat.name);
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
    if (visibleCount === 0 && !search) showEmptyChats();
    setTimeout(renderChatListWithBadges, 100);
  });
}
document.getElementById("searchInput").addEventListener("input", loadChats);

/* ===== СЧЁТЧИКИ ===== */
function loadLastRead() {
  if (unsubLastRead) unsubLastRead();
  try {
    unsubLastRead = onValue(ref(db, "lastRead/" + currentUser.uid), (snap) => {
      lastReadMap = snap.val() || {};
      updateUnreadCounts();
    }, (err) => { lastReadMap = {}; });
  } catch (e) { lastReadMap = {}; }
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

/* ===== ДОЛГОЕ НАЖАТИЕ ===== */
function attachLongPress(li, chatId, chatData) {
  let timer = null, triggered = false;
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
    btn.className = "action-item danger ripple";
    btn.textContent = "Удалить у всех";
    btn.onclick = () => { hideChatActions(); deleteChatForAll(); };
    list.appendChild(btn);
  }
  if (canDeleteForMe) {
    const btn = document.createElement("button");
    btn.className = "action-item danger ripple";
    btn.textContent = "Удалить у меня";
    btn.onclick = () => { hideChatActions(); deleteChatForMe(); };
    list.appendChild(btn);
  }
  document.getElementById("modal-chatActions").classList.add("active");
}
function hideChatActions() { document.getElementById("modal-chatActions").classList.remove("active"); }
document.getElementById("btnChatActionsCancel").addEventListener("click", hideChatActions);

async function deleteChatForMe() {
  if (!pendingDeleteChatId) return;
  const ok = await showConfirm("Чат исчезнет из вашего списка.", "Удалить у меня?");
  if (!ok) return;
  await remove(ref(db, "chats/" + pendingDeleteChatId + "/members/" + currentUser.uid));
  pendingDeleteChatId = null;
  pendingDeleteChatData = null;
}

async function deleteChatForAll() {
  if (!pendingDeleteChatId || !pendingDeleteChatData) return;
  const chat = pendingDeleteChatData;
  const ok = await showConfirm("Чат будет удалён у всех без возможности восстановления.", "Удалить у всех?");
  if (!ok) return;
  try {
    if (chat.inviteCode) await remove(ref(db, "invites/" + chat.inviteCode));
    await remove(ref(db, "messages/" + pendingDeleteChatId));
    await remove(ref(db, "chats/" + pendingDeleteChatId));
    pendingDeleteChatId = null;
    pendingDeleteChatData = null;
    showAlert("Чат удалён у всех", "Готово");
  } catch (e) { showAlert("Ошибка: " + e.message, "Ошибка"); }
}

/* ===== ОТКРЫТИЕ ЧАТА ===== */
async function openChat(chatId) {
  const snap = await get(ref(db, "chats/" + chatId));
  const chat = snap.val();
  if (!chat) return;
  currentChatId = chatId;
  currentChatData = chat;
  try { await set(ref(db, "lastRead/" + currentUser.uid + "/" + chatId), Date.now()); } catch (e) {}
  delete unreadCounts[chatId];
  renderChatListWithBadges();
  updateTitle();
  document.getElementById("chatTitle").textContent = chat.name;
  document.getElementById("messages").innerHTML = "";
  document.title = "Sqwid Messenger";
  showScreen("screen-messages");
  const inputArea = document.getElementById("inputArea");
  if (chat.type === "channel" && chat.owner !== currentUser.uid) inputArea.style.display = "none";
  else inputArea.style.display = "flex";
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
    } else linkSection.style.display = "none";

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
        const nameHTML = buildNickHTML(u, name);
        const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml(name.charAt(0).toUpperCase());
        const row = document.createElement("div");
        row.className = "cp-member";
        row.innerHTML = `<div class="cp-member-avatar">${avatarContent}</div><div>${nameHTML}${uid === chat.owner ? " 👑" : ""}</div>`;
        membersDiv.appendChild(row);
      });
    }

    const leaveBtn = document.getElementById("btnLeaveChat");
    if (members[currentUser.uid]) {
      leaveBtn.style.display = "block";
      leaveBtn.textContent = isOwner ? "Удалить чат" : "Выйти из чата";
    } else leaveBtn.style.display = "none";
    showScreen("screen-chat-profile");
  } catch (e) { showAlert("Не удалось открыть профиль: " + e.message, "Ошибка"); }
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

/* ===== СООБЩЕНИЯ ===== */
function renderMessage(msg) {
  const msgDiv = document.getElementById("messages");
  const isOwn = msg.sender === currentUser.uid;
  const msgDate = new Date(msg.timestamp);
  const time = formatTime(msgDate);
  const sender = userMap[msg.sender] || {};

  let senderName = sender.name || sender.email || "Пользователь";
  if (sender.showUsername !== false && sender.username) senderName = sender.name + " @" + sender.username;
  const senderHTML = buildNickHTML(sender, senderName);

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
    replyHTML = `<div class="msg-reply"><div class="msg-reply-name">${escapeHtml(msg.replyTo.senderName || "")}</div><div class="msg-reply-text">${escapeHtml(msg.replyTo.text || "")}</div></div>`;
  }

  let content = "";
  if (msg.type === "photo" && msg.photo) content = `<img class="msg-photo" src="${msg.photo}" alt="фото">`;
  else content = `<div>${escapeHtml(msg.text || "")}</div>`;

  div.innerHTML = `
    <div class="msg-reply-icon">↩</div>
    ${!isOwn ? `<div class="sender">${senderHTML}</div>` : ""}
    ${replyHTML}
    ${content}
    <div class="time">${time}</div>
  `;

  const img = div.querySelector(".msg-photo");
  if (img) img.addEventListener("click", () => {
    document.getElementById("photoViewerImg").src = msg.photo;
    document.getElementById("photoViewer").classList.add("active");
  });

  attachSwipeReply(div, msg, senderName);
  msgDiv.appendChild(div);
  msgDiv.scrollTop = msgDiv.scrollHeight;
}

function formatTime(d) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formatDate(d) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameDay(d, today)) return "Сегодня";
  if (sameDay(d, yesterday)) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function attachSwipeReply(div, msg, senderName) {
  const isOwn = msg.sender === currentUser.uid;
  let startX = 0, currentX = 0, swiping = false;
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
    if (delta > 90) delta = 90;
    if (delta < -90) delta = -90;
    div.style.transform = `translateX(${delta}px)`;
    if (Math.abs(delta) > threshold) div.classList.add("reply-trigger");
    else div.classList.remove("reply-trigger");
  });
  div.addEventListener("touchend", () => {
    if (!swiping) return;
    swiping = false;
    div.classList.remove("swiping");
    const absDelta = Math.abs(currentX - startX);
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
  replyTo = { msgId: msg.id, text: msg.type === "photo" ? "📷 Фото" : (msg.text || ""), senderName: senderName || "Пользователь" };
  document.getElementById("replyPreviewName").textContent = replyTo.senderName.replace(/<[^>]*>/g, "");
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
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#00a884"/></svg>'
    );
  }
}

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
document.getElementById("msgInput").addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

document.getElementById("btnAttach").addEventListener("click", () => {
  if (!currentChatId) return showAlert("Откройте чат", "Ошибка");
  if (currentChatData.type === "channel" && currentChatData.owner !== currentUser.uid) {
    return showAlert("Только владелец может писать в канал", "Ошибка");
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
    if (!isPlusActive()) return showAlert(`Фото больше ${limitText}.\n\nОформите Sqwid+`, "Лимит");
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

/* ===== ССЫЛКИ ===== */
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
    } catch (err) { showAlert("Ошибка ссылки", "Ошибка"); }
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
    } catch (err) { showAlert("Ошибка ссылки", "Ошибка"); }
  }
}

/* ===== ПОИСК ===== */
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
    const email = (u.email || "").toLowerCase();
    const uname = (u.username || "").toLowerCase();
    if (!name.includes(q) && !email.includes(q) && !uname.includes(q)) continue;
    const li = document.createElement("li");
    li.className = "user-result";
    const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml((u.name || "?").charAt(0).toUpperCase());
    let displayName = u.name || u.email || "Пользователь";
    let subText = "";
    if (u.showUsername !== false && u.username) subText = "@" + u.username;
    const nameHTML = buildNickHTML(u, displayName);
    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${nameHTML}</div>${subText ? `<div class="username">${escapeHtml(subText)}</div>` : ""}</div>`;
    li.onclick = () => showUserProfile(uid, u);
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
    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${escapeHtml(chat.name)}</div><div class="username">${subtitle}</div></div><button class="join-btn ripple" data-chat-id="${chatId}">Войти</button>`;
    li.querySelector(".join-btn").addEventListener("click", async (e) => { e.stopPropagation(); await joinChat(chatId); });
    list.appendChild(li);
  }
  if (list.children.length === 0) list.innerHTML = `<li style="padding:20px;text-align:center;color:#8696a0;">Ничего не найдено</li>`;
}

async function joinChat(chatId) {
  await update(ref(db, "chats/" + chatId + "/members"), { [currentUser.uid]: true });
  showAlert("Вы присоединились!", "Готово");
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

/* ===== SQWID+ ===== */
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
  welcome.innerHTML = `<div class="sender">@sqwid</div><div>Здравствуйте! Я бот Sqwid.</div><div>Вы выбрали тариф: <b>${periodText}</b></div><div style="margin-top:8px;">Нажмите кнопку.</div><button class="bot-start-btn ripple" id="botStartBtn">▶ Старт</button>`;
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
  instruction.innerHTML = `<div class="sender">@sqwid</div><div>Для получения премиума на <b>${periodText}</b> напиши:<br><br><b style="color:#f7b500;font-size:16px;">@sqwid</b><br><br>После договора вы получите Sqwid+ 🎉</div><div class="bot-message-buttons"><button class="bot-btn ripple" id="botBtnWrite">Написать</button><button class="bot-btn secondary ripple" id="botBtnChange">Другой тариф</button></div>`;
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

/* ===== АДМИН ===== */
document.getElementById("btnAdminPanel").addEventListener("click", () => {
  document.getElementById("profileMenu").classList.remove("active");
  document.getElementById("adminSearch").value = "";
  document.getElementById("adminSearchCoins").value = "";
  renderAdminUsers("");
  renderAdminCoins("");
  showScreen("screen-admin");
});

document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t === tab));
    const target = tab.dataset.tab;
    document.getElementById("adminTabPlus").style.display = target === "plus" ? "block" : "none";
    document.getElementById("adminTabCoins").style.display = target === "coins" ? "block" : "none";
  });
});

document.getElementById("adminSearch").addEventListener("input", (e) => {
  renderAdminUsers(e.target.value.trim().toLowerCase());
});
document.getElementById("adminSearchCoins").addEventListener("input", (e) => {
  renderAdminCoins(e.target.value.trim().toLowerCase());
});

function renderAdminUsers(query) {
  const list = document.getElementById("adminUserList");
  list.innerHTML = "";
  for (const uid in userMap) {
    if (uid === currentUser.uid) continue;
    const u = userMap[uid] || {};
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const uname = (u.username || "").toLowerCase();
    if (query && !name.includes(query) && !email.includes(query) && !uname.includes(query)) continue;
    const li = document.createElement("li");
    li.className = "admin-user-row";
    const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml((u.name || "?").charAt(0).toUpperCase());
    let displayName = u.name || u.email || "Пользователь";
    let subText = "";
    if (u.username) subText = "@" + u.username;
    const isActivePlus = u.isPlus === true && (!u.plusUntil || Date.now() < u.plusUntil);
    const badge = isActivePlus ? `<div class="plus-badge">${STAR_IMG}</div>` : "";
    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${escapeHtml(displayName)}</div>${subText ? `<div class="username">${escapeHtml(subText)}</div>` : ""}</div>${badge}`;
    li.onclick = () => openGivePlusModal(uid, displayName, u.username || "", isActivePlus);
    list.appendChild(li);
  }
  if (list.children.length === 0) list.innerHTML = `<li style="padding:20px;text-align:center;color:#8696a0;">Никого не найдено</li>`;
}

function renderAdminCoins(query) {
  const list = document.getElementById("adminCoinsList");
  list.innerHTML = "";
  for (const uid in userMap) {
    if (uid === currentUser.uid) continue;
    const u = userMap[uid] || {};
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const uname = (u.username || "").toLowerCase();
    if (query && !name.includes(query) && !email.includes(query) && !uname.includes(query)) continue;
    const li = document.createElement("li");
    li.className = "admin-user-row";
    const avatarContent = u.photo ? `<img src="${u.photo}">` : escapeHtml((u.name || "?").charAt(0).toUpperCase());
    let displayName = u.name || u.email || "Пользователь";
    const coins = u.coins || 0;
    li.innerHTML = `<div class="avatar">${avatarContent}</div><div class="info"><div class="name">${escapeHtml(displayName)}</div></div><div class="coins-badge">🪙 ${coins}</div>`;
    li.onclick = () => openGiveCoinsModal(uid, displayName, coins);
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
  if (isActivePlus) text += "\n★ Уже имеет активный Sqwid+";
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

function openGiveCoinsModal(uid, name, coins) {
  pendingGiveCoinsUid = uid;
  pendingGiveCoinsName = name;
  document.getElementById("giveCoinsUser").textContent = "Пользователь: " + name;
  document.getElementById("giveCoinsCurrent").textContent = "Текущий баланс: 🪙 " + coins + " SQ";
  document.getElementById("giveCoinsAmount").value = 100;
  document.getElementById("modal-giveCoins").classList.add("active");
}

document.getElementById("btnGiveCoinsCancel").addEventListener("click", () => {
  document.getElementById("modal-giveCoins").classList.remove("active");
  pendingGiveCoinsUid = null;
});

document.getElementById("btnGiveCoinsConfirm").addEventListener("click", async () => {
  if (!pendingGiveCoinsUid) return;
  const amount = parseInt(document.getElementById("giveCoinsAmount").value);
  if (isNaN(amount) || amount === 0) return showAlert("Введи число, не равное 0", "Ошибка");

  const userSnap = await get(ref(db, "users/" + pendingGiveCoinsUid));
  const u = userSnap.val() || {};
  const currentCoins = u.coins || 0;
  const newCoins = currentCoins + amount;

  if (newCoins < 0) return showAlert("Нельзя уйти в минус. Текущий баланс: " + currentCoins, "Ошибка");

  await update(ref(db, "users/" + pendingGiveCoinsUid), { coins: newCoins });
  document.getElementById("modal-giveCoins").classList.remove("active");
  const action = amount > 0 ? "Выдано" : "Списано";
  showAlert(`${action}: ${Math.abs(amount)} SQ\nПользователь: ${pendingGiveCoinsName}\nНовый баланс: 🪙 ${newCoins} SQ`, "Готово");
  pendingGiveCoinsUid = null;
});

function isPlusActive() {
  if (!currentUserData || !currentUserData.isPlus) return false;
  if (!currentUserData.plusUntil) return true;
  return Date.now() < currentUserData.plusUntil;
}

console.log("chat.js загружен");