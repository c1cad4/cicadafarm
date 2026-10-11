import { camera, screenPoint, touchTarget, pixelRatio } from "./viewport.mjs";
import { audioUI, sound } from "./audio.js";
import { socialUI } from "./social.js";
import { profileUI } from "./profile.js";
import { drawScene } from "./renderer.js";
import { flag } from "../multiplayer/profile.js";
("use strict");
const text = {
  en: {
    eyebrow: "A SMALL SWARM. A LIVING WORLD.",
    title: "Bring the farm to life.",
    subtitle:
      "Collect. Return. Grow. A three-minute journey through a luminous garden.",
    farm: "YOUR FARM",
    cargo: "SWARM CARGO",
    harvest: "DELIVERED",
    time: "ROUND",
    weather: "WEATHER",
    sun: "Sunshine",
    rain: "Rain",
    wind: "Wind",
    dry: "Drought",
    welcome: "Every seed starts something.",
    instructions:
      "Guide your cicada with the mouse, a finger or arrow keys. Collect glowing resources and return to the central farm to bank your harvest.",
    start: "Enter the garden →",
    again: "Play again →",
    finished: "The garden is growing.",
    result: "Harvest delivered this round:",
    paused: "Take a breath.",
    resume: "Continue →",
    pause: "Pause",
    bots: "Solo prototype · blue cicadas are computer-controlled bots",
    collect: "Gather a glowing swarm",
    collectDesc:
      "Seeds, nectar and dew become your cargo. Blue bots collect too. Keep an eye on your capacity.",
    deliver: "Bring it home",
    deliverDesc:
      "Enter the green farm circle to deliver. Touching a red thorn spills part of your unbanked cargo.",
    grow: "Make a living garden",
    growDesc:
      "Delivered harvest adds trees and flowers. Rain replenishes resources; drought slows the swarm.",
    local: "Progress saved on this browser",
    market: "Explore the real farm ↗",
    tokens:
      "Free prototype. Harvest is a game score, not a token or a real farm measurement. Token purchases and online multiplayer are planned; no payments are collected here.",
    hint: "Follow the light • return to the central farm",
    full: "Cargo full! Return to the central farm.",
    saving: "Saving is unavailable. Progress lasts for this session.",
    total: "seeds delivered",
    best: "best",
    deposit: "Harvest delivered",
  },
  ru: {
    eyebrow: "МАЛЕНЬКИЙ РОЙ. ЖИВОЙ МИР.",
    title: "Оживи свою ферму.",
    subtitle: "Собирай. Возвращайся. Выращивай. Три минуты в светящемся саду.",
    farm: "ТВОЯ ФЕРМА",
    cargo: "ГРУЗ РОЯ",
    harvest: "ДОСТАВЛЕНО",
    time: "РАУНД",
    weather: "ПОГОДА",
    sun: "Солнце",
    rain: "Дождь",
    wind: "Ветер",
    dry: "Засуха",
    welcome: "Всё начинается с семечка.",
    instructions:
      "Веди цикаду мышью, пальцем или стрелками. Собирай светящиеся ресурсы и возвращайся на ферму в центре, чтобы сохранить урожай.",
    start: "Войти в сад →",
    again: "Играть снова →",
    finished: "Сад становится больше.",
    result: "Урожай за этот раунд:",
    paused: "Передохни.",
    resume: "Продолжить →",
    pause: "Пауза",
    bots: "Одиночный прототип · синие цикады управляются компьютером",
    collect: "Собери светящийся рой",
    collectDesc:
      "Семена, нектар и роса наполняют груз. Синие боты тоже собирают ресурсы. Следи за вместимостью.",
    deliver: "Доставь на ферму",
    deliverDesc:
      "Залети в зелёный круг фермы. Красные колючки отнимают часть недоставленного груза.",
    grow: "Вырасти живой сад",
    growDesc:
      "Доставленный урожай добавляет деревья и цветы. Дождь пополняет ресурсы, засуха замедляет рой.",
    local: "Прогресс сохранён в этом браузере",
    market: "Посетить настоящую ферму ↗",
    tokens:
      "Бесплатный прототип. Урожай — игровые очки, а не токены или показатели настоящей фермы. Покупки за токены и онлайн-режим запланированы; здесь оплата не принимается.",
    hint: "Следуй за светом • возвращайся на ферму в центре",
    full: "Груз заполнен! Вернись на ферму в центре.",
    saving: "Сохранение недоступно. Прогресс останется только в этой сессии.",
    total: "семян доставлено",
    best: "рекорд",
    deposit: "Урожай доставлен",
  },
  "zh-CN": {
    eyebrow: "小小虫群，生机世界。",
    title: "让农场焕发生机。",
    subtitle: "收集、返回、种植。在发光花园中体验三分钟冒险。",
    farm: "你的农场",
    cargo: "虫群载荷",
    harvest: "已送达",
    time: "回合",
    weather: "天气",
    sun: "晴天",
    rain: "下雨",
    wind: "有风",
    dry: "干旱",
    welcome: "一切从一颗种子开始。",
    instructions:
      "用鼠标、手指或方向键引导蝉。收集发光资源并返回中央农场，保存收获。",
    start: "进入花园 →",
    again: "再玩一次 →",
    finished: "花园正在成长。",
    result: "本回合送达的收获：",
    paused: "休息一下。",
    resume: "继续 →",
    pause: "暂停",
    bots: "单人原型 · 蓝色蝉由电脑控制",
    collect: "收集发光虫群",
    collectDesc: "种子、花蜜和露水成为载荷。蓝色电脑角色也会收集，请注意容量。",
    deliver: "带回农场",
    deliverDesc: "进入绿色农场圆圈即可交付。碰到红色荆棘会损失部分未交付资源。",
    grow: "培育生机花园",
    growDesc: "交付收获会增加树木和花朵。雨水补充资源，干旱使虫群减速。",
    local: "进度保存在此浏览器",
    market: "探索真实农场 ↗",
    tokens:
      "免费原型。收获只是游戏分数，不是代币或真实农场数据。代币购买和在线多人模式正在规划中；此处不收取付款。",
    hint: "跟随光芒 • 返回中央农场",
    full: "载荷已满！返回中央农场。",
    saving: "无法保存。进度仅在本次会话中保留。",
    total: "颗种子已送达",
    best: "最佳",
    deposit: "收获已送达",
  },
};
const additions = {
  en: {
    title: "Grow a garden together.",
    subtitle: "Live players. One garden. Bring your harvest home.",
    collectDesc:
      "Collect seeds, nectar and dew. Other players share these resources. Watch your capacity.",
    bots: "Online beta · real players · up to 12 per garden",
    instructions:
      "Choose a nickname and garden, then join. Collect resources and deliver them to the centre. Share the garden link with friends.",
    start: "Join the garden →",
    farm: "SHARED GARDEN",
    local: "Room progress lasts while the server is active",
    tokens:
      "Free multiplayer beta. No token payments or redeemable rewards. Scores are server-checked; this is not a permanent global ranking.",
    pause: "Leave",
    welcome: "A garden for all of us.",
    connecting: "Connecting…",
    offline: "Connection lost. Rejoin to reconnect.",
    failed: "Unable to join. The garden may be full or the server unavailable.",
    nick: "Nickname",
    room: "Garden",
    invite: "Invite ↗",
    solo: "Solo ↗",
    copied: "Garden link copied",
    ended: "Next round starts shortly.",
    you: "you",
  },
  ru: {
    title: "Вырастим сад вместе.",
    subtitle: "Живые игроки. Общий сад. Доставляй урожай домой.",
    collectDesc:
      "Собирай семена, нектар и росу. Ресурсы общие для всех игроков. Следи за вместимостью.",
    bots: "Онлайн-бета · живые игроки · до 12 в комнате",
    instructions:
      "Выбери ник и сад, затем подключись. Собирай ресурсы и доставляй в центр. Пригласи друзей ссылкой на сад.",
    start: "Войти в общий сад →",
    farm: "ОБЩИЙ САД",
    local: "Прогресс комнаты живёт, пока активен сервер",
    tokens:
      "Бесплатная онлайн-бета. Оплаты и выдачи токенов нет. Очки проверяет сервер; постоянного глобального рейтинга пока нет.",
    pause: "Выйти",
    welcome: "Сад для всех нас.",
    connecting: "Подключение…",
    offline: "Связь потеряна. Подключись повторно.",
    failed: "Не удалось войти. Комната заполнена или сервер недоступен.",
    nick: "Никнейм",
    room: "Сад",
    invite: "Пригласить ↗",
    solo: "Одиночная ↗",
    copied: "Ссылка на сад скопирована",
    ended: "Скоро начнётся следующий раунд.",
    you: "ты",
  },
  "zh-CN": {
    title: "一起培育花园。",
    subtitle: "真实玩家，共享花园。把收获带回家。",
    collectDesc: "收集种子、花蜜和露水。资源由所有玩家共享，请注意容量。",
    bots: "在线测试版 · 真实玩家 · 每个花园最多12人",
    instructions:
      "选择昵称和花园，然后加入。收集资源并交付到中央。分享花园链接邀请朋友。",
    start: "加入花园 →",
    farm: "共享花园",
    local: "房间进度仅在服务器活动期间保留",
    tokens:
      "免费多人测试版。不收取代币，不发放奖励。分数由服务器验证，尚无永久全球排行榜。",
    pause: "离开",
    welcome: "属于大家的花园。",
    connecting: "连接中…",
    offline: "连接中断，请重新加入。",
    failed: "无法加入，房间已满或服务器不可用。",
    nick: "昵称",
    room: "花园",
    invite: "邀请 ↗",
    solo: "单人 ↗",
    copied: "已复制花园链接",
    ended: "下一回合即将开始。",
    you: "你",
  },
};
for (const l of Object.keys(text)) Object.assign(text[l], additions[l]);
for (const [l, v] of Object.entries({
  en: {
    mass: "POLLEN MASS",
    safe: "SAFE HIVE",
    hint: "Collect pollen, grow and absorb smaller cicadas • the farm is safe",
    full: "Cargo full — pollen still grows your cicada. Return to bank it!",
    instructions:
      "Choose your nickname, flag and colour. Collect pollen to grow. A cicada at least 25% heavier can absorb a smaller one outside the safe farm. Purple nectar is worth 5; thorns reduce mass. Respawn preserves banked harvest.",
    collectDesc:
      "Pollen grows your cicada. Purple nectar is worth 5. Bigger cicadas are slower, so smaller players can escape.",
    deliverDesc:
      "Deliver at the central farm. Inside its green circle, everyone is protected from absorption. Banked harvest survives respawn.",
    growDesc:
      "Grow the shared garden with banked harvest. Choose when to gather, bank or chase. Rain replenishes pollen; drought slows movement.",
    respawn: "Respawned — banked harvest preserved.",
    shield: "Respawn protection",
    total: "harvest banked",
  },
  ru: {
    mass: "МАССА ПЫЛЬЦЫ",
    safe: "ЗАЩИТНЫЙ УЛЕЙ",
    hint: "Собирай пыльцу, расти и поглощай меньших цикад • на ферме безопасно",
    full: "Груз полон — пыльца продолжает увеличивать цикаду. Доставь урожай!",
    instructions:
      "Выбери имя, флаг и цвет. Пыльца увеличивает цикаду. За пределами безопасной фермы цикада минимум на 25% тяжелее может поглотить меньшую. Фиолетовый нектар стоит 5; колючки уменьшают массу. Доставленный урожай сохраняется после возрождения.",
    collectDesc:
      "Пыльца увеличивает цикаду. Фиолетовый нектар стоит 5. Большие цикады медленнее — маленькие могут убежать.",
    deliverDesc:
      "Доставляй урожай на ферму в центре. Зелёный круг защищает всех от поглощения. Доставленный урожай сохраняется после возрождения.",
    growDesc:
      "Общий сад растёт от доставленного урожая. Выбирай: собирать, доставлять или догонять. Дождь пополняет пыльцу, засуха замедляет движение.",
    respawn: "Ты возродился — доставленный урожай сохранён.",
    shield: "Защита после возрождения",
    total: "урожая доставлено",
  },
  "zh-CN": {
    mass: "花粉质量",
    safe: "安全蜂箱",
    hint: "收集花粉，成长并吸收较小的蝉 · 农场内安全",
    full: "载荷已满，花粉仍使蝉成长。返回农场交付！",
    instructions:
      "选择昵称、国旗和颜色。花粉使蝉成长。安全农场外，质量至少多25%的蝉可以吸收较小的蝉。紫色花蜜价值5，荆棘减少质量。重生保留已交付收获。",
    collectDesc:
      "花粉使蝉成长。紫色花蜜价值5。较大的蝉移动更慢，小蝉可以逃跑。",
    deliverDesc:
      "向中央农场交付收获。绿色圆圈保护所有玩家免于吸收，重生保留已交付收获。",
    growDesc:
      "交付收获培育共享花园。选择收集、交付或追逐。雨水补充花粉，干旱减慢移动。",
    respawn: "已重生，交付收获保留。",
    shield: "重生保护",
    total: "已交付收获",
  },
}))
  Object.assign(text[l], v);
text.en.tokens =
  "Free to play. Wallet-signed room chat and optional permanent cosmetics paid in SOL, CICADAFARM or ROBOTCYB. No token rewards or paid gameplay advantage.";
text.ru.tokens =
  "Игра бесплатна. Чат — после подписи кошельком. Постоянные украшения оплачиваются в SOL, CICADAFARM или ROBOTCYB. Нет наград токенами или платного преимущества.";
text["zh-CN"].tokens =
  "免费游戏。钱包签名后可发言，可用 SOL、CICADAFARM 或 ROBOTCYB 购买永久装饰，无代币奖励或付费游戏优势。";
for (const [language, help] of Object.entries({
  en: "On touch screens: drag anywhere to steer; release to stop. The small map points to safe hives.",
  ru: "На телефоне: тяни пальцем в любом месте, чтобы двигаться; отпусти для остановки. Мини-карта показывает безопасные ульи.",
  "zh-CN":
    "触屏操作：在任意位置拖动来控制方向，松开即可停止。小地图显示安全蜂箱。",
}))
  text[language].instructions += " " + help;
const $ = (id) => document.getElementById(id),
  canvas = $("world"),
  ctx = canvas.getContext("2d"),
  C = SwarmCore;
let lang = "en";
try {
  lang = localStorage.getItem("cicadaLanguage") || "en";
} catch {}
if (!text[lang]) lang = "en";
const t = (k) => text[lang][k];
let w = 1000,
  h = 540,
  dpr = 1,
  state = "idle",
  elapsed = 0,
  score = 0,
  cargo = 0,
  sharedTotal = 0,
  hit = 0,
  flash = 0,
  player = { x: 500, y: 270, angle: 0 },
  target = null,
  trail = [],
  resources = [],
  bots = [],
  thorns = [],
  keys = new Set(),
  socket = null,
  identity = null,
  session = null,
  lastSend = 0,
  snapshot = null,
  previousSnapshot = null,
  snapshotAt = 0,
  error = null;
try {
  session = sessionStorage.getItem("swarmSession");
} catch {}
if (!/^[a-f0-9-]{36}$/.test(session || "")) {
  session = crypto.randomUUID();
  try {
    sessionStorage.setItem("swarmSession", session);
  } catch {}
}
const profile = profileUI();
audioUI();
const social = socialUI(() => socket);
let lastRespawn = 0,
  boardAt = 0,
  profileLocked = null;
const room = new URLSearchParams(location.search).get("room");
if (/^(?:[1-9]|1[0-9]|20)$/.test(room || "")) $("room").value = room;
function translate() {
  document.documentElement.lang = lang;
  $("language").value = lang;
  document
    .querySelectorAll("[data-text]")
    .forEach((e) => (e.textContent = t(e.dataset.text)));
  $("nickLabel").textContent = t("nick");
  $("roomLabel").textContent = t("room");
  $("invite").textContent = t("invite");
  $("soloLink").textContent = t("solo");
  hud();
  overlay();
}
function overlay() {
  const show = state !== "running";
  $("overlay").hidden = !show;
  if (!show) return;
  $("message").textContent = error
    ? t(error)
    : t(state === "connecting" ? "connecting" : "welcome");
  $("description").textContent = t("instructions");
  $("start").textContent = t(state === "connecting" ? "connecting" : "start");
  $("start").disabled = state === "connecting";
}
function hud() {
  $("mass").textContent = Math.round(player.mass || 20);
  $("cargo").textContent = `${cargo} / 20`;
  $("score").textContent = score;
  const remain = Math.max(0, Math.ceil(180 - elapsed));
  $("time").textContent =
    `${String(Math.floor(remain / 60)).padStart(2, "0")}:${String(remain % 60).padStart(2, "0")}`;
  $("weather").textContent = t(C.weather(elapsed));
  $("level").textContent = String(C.level(sharedTotal)).padStart(2, "0");
  $("total").textContent =
    `${sharedTotal} ${t("total")} · ${snapshot?.players.length || 0}/12 · ${snapshot?.width || 1000} × ${snapshot?.height || 540} · ⌂ ${snapshot?.homes?.length || 1}`;
  $("hint").textContent =
    elapsed >= 180
      ? t("ended")
      : player.shield > 0
        ? `${t("shield")}: ${Math.ceil(player.shield)}s`
        : cargo === 20
          ? t("full")
          : t("hint");
  $("pause").disabled = state !== "running";
  $("room").disabled = state === "running" || state === "connecting";
  if (profileLocked !== $("room").disabled) {
    profileLocked = $("room").disabled;
    profile.lock(profileLocked);
  }
}
function join() {
  if (socket) socket.close();
  error = null;
  state = "connecting";
  overlay();
  hud();
  const u = new URL(
    location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8768/"
      : "https://cicadafarm-swarm.dmitry-suh.workers.dev/",
  );
  u.protocol = u.protocol === "http:" ? "ws:" : "wss:";
  u.searchParams.set("room", $("room").value);
  u.searchParams.set("name", $("nickname").value || "Cicada");
  const style = profile.value();
  u.searchParams.set("country", style.country);
  u.searchParams.set("color", style.color);
  u.searchParams.set("session", session);
  const ws = new WebSocket(u);
  socket = ws;
  const timeout = setTimeout(() => {
    if (socket === ws && state === "connecting") {
      error = "failed";
      ws.close();
      state = "idle";
      overlay();
      hud();
    }
  }, 12000);
  ws.onmessage = (event) => {
    if (socket !== ws) return;
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    social.message(data);
    if (data.type === "welcome") {
      social.ready();
      sound("join");
      identity = data.id;
      state = "running";
      error = null;
      canvas.focus({ preventScroll: true });
      overlay();
      return;
    }
    if (data.type === "world") {
      const previous = snapshot?.players.find((p) => p.id === identity);
      previousSnapshot = snapshot;
      snapshotAt = performance.now();
      snapshot = data;
      elapsed = data.elapsed;
      sharedTotal = data.total;
      const mine = data.players.find((p) => p.id === identity);
      if (mine) {
        if (previous) {
          if (mine.respawns > previous.respawns) sound("respawn");
          else if (mine.absorbed > previous.absorbed) sound("absorb");
          else if (mine.score > previous.score) sound("bank");
          else if (mine.mass > previous.mass) sound("pollen");
        }
        player = {
          ...mine,
          x: (mine.x * w) / (snapshot?.width || 1000),
          y: (mine.y * h) / (snapshot?.height || 540),
        };
        score = mine.score;
        cargo = mine.cargo;
        if (mine.respawns !== lastRespawn) {
          lastRespawn = mine.respawns;
          target = null;
          trail = [];
          $("status").textContent = t("respawn");
        }
      }
      if (performance.now() - boardAt > 1000) {
        renderBoard(data.players);
        boardAt = performance.now();
      }
      hud();
    }
  };
  ws.onerror = () => {
    error = "failed";
  };
  ws.onclose = () => {
    clearTimeout(timeout);
    if (socket !== ws) return;
    socket = null;
    target = null;
    keys.clear();
    state = "idle";
    error = error || "offline";
    overlay();
    hud();
  };
}
function renderBoard(players) {
  $("leaderboard").replaceChildren(
    ...[...players]
      .sort((a, b) => (b.mass || 20) - (a.mass || 20) || b.score - a.score)
      .map((p) => {
        const row = document.createElement("article"),
          n = document.createElement("strong"),
          v = document.createElement("p");
        n.textContent =
          flag(p.country) +
          " " +
          p.name +
          (p.agent ? " [AI]" : "") +
          (p.id === identity ? ` (${t("you")})` : "");
        v.textContent = `${Math.round(p.mass || 20)} · ${t("mass")} / ${p.score} · ${t("harvest")}`;
        row.append(n, v);
        return row;
      }),
  );
}
$("start").onclick = join;
$("pause").onclick = () => {
  const ws = socket;
  socket = null;
  ws?.close();
  state = "idle";
  error = null;
  keys.clear();
  target = null;
  overlay();
  hud();
};
canvas.tabIndex = 0;
$("language").onchange = (e) => {
  lang = e.target.value;
  try {
    localStorage.setItem("cicadaLanguage", lang);
  } catch {}
  translate();
  if (snapshot) renderBoard(snapshot.players);
};
$("invite").onclick = async () => {
  const url = new URL(location.href);
  url.searchParams.set("room", $("room").value);
  try {
    await navigator.clipboard.writeText(url.href);
    $("status").textContent = t("copied");
    $("invite").textContent = "✓ " + t("copied");
  } catch {
    $("status").textContent = url.href;
  }
};
let touchOrigin = null,
  touchPoint = null,
  activePointer = null;
function pointer(e) {
  const r = canvas.getBoundingClientRect();
  const point = { x: e.clientX - r.left, y: e.clientY - r.top };
  const mine = snapshot?.players.find((p) => p.id === identity) || {
    x: 500,
    y: 270,
  };
  const mapW = snapshot?.width || 1000,
    mapH = snapshot?.height || 540;
  const view = camera(w, h, mapW, mapH, mine);
  if (e.pointerType && e.pointerType !== "mouse") touchPoint = point;
  const q =
    touchOrigin && e.pointerType && e.pointerType !== "mouse"
      ? touchTarget(mine, touchOrigin, point)
      : screenPoint(view, point.x, point.y);
  target = q && { x: (q.x * w) / mapW, y: (q.y * h) / mapH };
}
canvas.addEventListener("pointerdown", (e) => {
  if (activePointer !== null) return;
  activePointer = e.pointerId;
  canvas.setPointerCapture(e.pointerId);
  if (e.pointerType && e.pointerType !== "mouse") {
    const r = canvas.getBoundingClientRect();
    touchOrigin = { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  pointer(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "mouse" || e.pointerId === activePointer) pointer(e);
});

function refreshTouch() {
  if (!touchOrigin || !touchPoint) return;
  const mine = snapshot?.players.find((p) => p.id === identity);
  if (!mine) return;
  const q = touchTarget(mine, touchOrigin, touchPoint);
  target = q && {
    x: (q.x * w) / snapshot.width,
    y: (q.y * h) / snapshot.height,
  };
}
function releasePointer(e) {
  if (e.pointerId !== activePointer) return;
  activePointer = null;
  touchOrigin = touchPoint = null;
  if (e.pointerType && e.pointerType !== "mouse") target = null;
}
canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("lostpointercapture", releasePointer);
window.addEventListener("blur", () => {
  touchOrigin = touchPoint = null;
  activePointer = null;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    touchOrigin = touchPoint = null;
    activePointer = null;
  }
});
window.addEventListener("keydown", (e) => {
  if (e.target.closest("select,button,a,input,textarea")) return;
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "w",
      "a",
      "s",
      "d",
    ].includes(e.key) &&
    state === "running"
  ) {
    e.preventDefault();
    keys.add(e.key);
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key));
function stop() {
  keys.clear();
  target = null;
  if (socket?.readyState === 1)
    socket.send(JSON.stringify({ type: "input", target: null }));
}
window.addEventListener("blur", stop);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
window.addEventListener("pagehide", () => socket?.close());
function resize() {
  const r = canvas.getBoundingClientRect();
  w = r.width;
  h = r.height;
  dpr = pixelRatio(w, h, devicePixelRatio);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  target = null;
}
new ResizeObserver(resize).observe(canvas);
function draw(now) {
  const alpha = Math.min(1, Math.max(0, (now - snapshotAt) / 100));
  const rendered = snapshot && {
    ...snapshot,
    players: snapshot.players.map((p) => {
      const before = previousSnapshot?.players.find((q) => q.id === p.id);
      if (
        !before ||
        before.respawns !== p.respawns ||
        Math.hypot(before.x - p.x, before.y - p.y) > 80
      )
        return p;
      return {
        ...p,
        x: before.x + (p.x - before.x) * alpha,
        y: before.y + (p.y - before.y) * alpha,
      };
    }),
  };
  drawScene(
    ctx,
    w,
    h,
    dpr,
    rendered || { players: [], resources: [], thorns: [], elapsed: 0 },
    identity,
    now,
    {
      trail: trail.map((p) => ({
        x: (p.x * (snapshot?.width || 1000)) / w,
        y: (p.y * (snapshot?.height || 540)) / h,
      })),
      target:
        target && state === "running"
          ? {
              x: (target.x * (snapshot?.width || 1000)) / w,
              y: (target.y * (snapshot?.height || 540)) / h,
            }
          : null,
      safeLabel: t("safe"),
      touchOrigin,
      touchPoint,
    },
  );
}
let drawAt = 0,
  idleDrawAt = 0;
function loop(now) {
  if (document.hidden) {
    requestAnimationFrame(loop);
    return;
  }
  if (now - drawAt < 1000 / 60 - 1) {
    requestAnimationFrame(loop);
    return;
  }
  drawAt = now;
  refreshTouch();
  if (
    state === "running" &&
    !document.hidden &&
    socket?.readyState === 1 &&
    now - lastSend >= 100
  ) {
    lastSend = now;
    let q = target;
    let dx =
        (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) -
        (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0),
      dy =
        (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) -
        (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
    if (dx || dy) q = { x: player.x + dx * 100, y: player.y + dy * 100 };
    socket.send(
      JSON.stringify({
        type: "input",
        target: q
          ? {
              x: (q.x * (snapshot?.width || 1000)) / w,
              y: (q.y * (snapshot?.height || 540)) / h,
            }
          : null,
      }),
    );
    trail.unshift({ x: player.x, y: player.y });
    if (trail.length > 130) trail.pop();
  }
  if (state === "running" || now - idleDrawAt > 250) {
    draw(now);
    idleDrawAt = now;
  }
  requestAnimationFrame(loop);
}
translate();
resize();
requestAnimationFrame(loop);
