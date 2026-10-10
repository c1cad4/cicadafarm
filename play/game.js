import { audioUI, sound } from "./audio.js";
import { World, safe } from "../multiplayer/model.js";
import { profileUI } from "./profile.js";
import { drawScene } from "./renderer.js";
import { seeded, day, readGarden, objectives, garden } from "./garden-core.mjs";
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
      "Free prototype. Harvest is a game score, not a token or a real farm measurement. Multiplayer is available through the link above. No payments are collected here.",
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
      "Бесплатный прототип. Урожай — игровые очки, а не токены или показатели настоящей фермы. Мультиплеер доступен по ссылке сверху. Здесь оплата не принимается.",
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
      "免费原型。收获只是游戏分数，不是代币或真实农场数据。通过上方链接进入多人模式。此处不收取付款。",
    hint: "跟随光芒 • 返回中央农场",
    full: "载荷已满！返回中央农场。",
    saving: "无法保存。进度仅在本次会话中保留。",
    total: "颗种子已送达",
    best: "最佳",
    deposit: "收获已送达",
  },
};
text.en.online = "◎ MULTIPLAYER ↗";
text.ru.online = "◎ ОБЩИЙ САД ↗";
text["zh-CN"].online = "◎ 多人游戏 ↗";
const extra = {
  en: {
    mass: "POLLEN MASS",
    localUnverified: "Local, unverified result",
    mode: "Mode",
    free: "Free garden",
    daily: "Garden of the day",
    personal: "YOUR LASTING GARDEN",
    trees: "trees",
    flowers: "flowers",
    hives: "hives",
    missions: "completed missions",
    next: "Harvest until the next hive",
    dailyBest: "Daily best",
    localDaily:
      "Same starting map for everyone · UTC · local, unverified result",
    goalHarvest: "Deliver harvest",
    goalDelivery: "Return home",
    goalRare: "Deliver rare nectar",
    safe: "SAFE FARM",
    bot: "Bot",
    share: "Share this result",
    copied: "Result copied — send it to a friend.",
    copyManual: "Copy the result below.",
    shield: "Protected after respawn",
    respawn: "Respawned. Banked harvest is safe.",
    hint: "Collect pollen, grow and absorb smaller cicadas • the farm protects everyone",
    full: "Cargo full — extra pollen still grows your cicada. Bank your harvest!",
    instructions:
      "Choose your name, flag and colour. Collect pollen to grow; purple nectar is worth 5 near the dangerous outer edge. A cicada at least 25% heavier can absorb a smaller one. The farm is safe. Deliver cargo and complete all three goals.",
    collectDesc:
      "Every pollen grain grows your cicada. Rare purple nectar adds 5 mass and 5 harvest when delivered. Bigger cicadas move more slowly.",
    deliverDesc:
      "Bank cargo at the central farm. This zone prevents absorption. Thorns spill cargo and reduce mass. After absorption, respawn with banked harvest intact.",
    growDesc:
      "Delivered harvest plants your lasting garden. Each 100 harvest adds a hive. Finish three goals for a mission badge; try the same daily map as friends.",
    total: "harvest banked",
    result: "Banked harvest",
    finished: "Your garden remembers.",
    missionDone: "Mission complete!",
    roundLost: "respawns",
    absorbed: "absorptions",
    peak: "peak mass",
  },
  ru: {
    mass: "МАССА ПЫЛЬЦЫ",
    localUnverified: "Локальный, непроверенный результат",
    mode: "Режим",
    free: "Свободный сад",
    daily: "Сад дня",
    personal: "ТВОЙ ПОСТОЯННЫЙ САД",
    trees: "деревьев",
    flowers: "цветов",
    hives: "ульев",
    missions: "выполненных миссий",
    next: "Урожай до следующего улья",
    dailyBest: "Рекорд дня",
    localDaily:
      "Одинаковая стартовая карта для всех · UTC · локальный, непроверенный результат",
    goalHarvest: "Доставь урожай",
    goalDelivery: "Вернись домой",
    goalRare: "Доставь редкий нектар",
    safe: "БЕЗОПАСНАЯ ФЕРМА",
    bot: "Бот",
    share: "Поделиться результатом",
    copied: "Результат скопирован — отправь другу.",
    copyManual: "Скопируй результат ниже.",
    shield: "Защита после возрождения",
    respawn: "Ты возродился. Доставленный урожай сохранён.",
    hint: "Собирай пыльцу, расти и поглощай меньших цикад • ферма защищает всех",
    full: "Груз полон — пыльца продолжает увеличивать цикаду. Доставь урожай!",
    instructions:
      "Выбери имя, флаг и цвет. Пыльца увеличивает цикаду; фиолетовый нектар у опасного края даёт 5 единиц. Цикада минимум на 25% тяжелее может поглотить меньшую. На ферме безопасно. Доставляй груз и выполни три цели.",
    collectDesc:
      "Каждая пыльца увеличивает цикаду. Редкий фиолетовый нектар даёт 5 массы и 5 урожая при доставке. Большие цикады двигаются медленнее.",
    deliverDesc:
      "Доставляй груз на ферму в центре: здесь нельзя поглощать. Колючки отнимают груз и массу. После поглощения ты возродишься, сохранив доставленный урожай.",
    growDesc:
      "Урожай выращивает твой постоянный сад. Каждые 100 единиц добавляют улей. Три цели дают значок миссии; в саду дня можно сравнить результат с друзьями.",
    total: "урожая доставлено",
    result: "Доставленный урожай",
    finished: "Твой сад помнит.",
    missionDone: "Миссия выполнена!",
    roundLost: "возрождений",
    absorbed: "поглощений",
    peak: "максимальная масса",
  },
  "zh-CN": {
    mass: "花粉质量",
    localUnverified: "本地未验证成绩",
    mode: "模式",
    free: "自由花园",
    daily: "每日花园",
    personal: "你的永久花园",
    trees: "棵树",
    flowers: "朵花",
    hives: "个蜂箱",
    missions: "已完成任务",
    next: "下一个蜂箱所需收获",
    dailyBest: "今日最佳",
    localDaily: "所有人起始地图相同 · UTC · 本地未验证成绩",
    goalHarvest: "交付收获",
    goalDelivery: "返回农场",
    goalRare: "交付稀有花蜜",
    safe: "安全农场",
    bot: "电脑",
    share: "分享成绩",
    copied: "成绩已复制，发送给朋友吧。",
    copyManual: "复制下方成绩。",
    shield: "重生保护",
    respawn: "已重生，交付收获已保留。",
    hint: "收集花粉，成长并吸收较小的蝉 · 农场保护所有人",
    full: "载荷已满，花粉仍会让你成长。交付收获！",
    instructions:
      "选择昵称、国旗和颜色。花粉使蝉成长；危险边缘的紫色花蜜价值5。质量至少多25%的蝉可以吸收较小的蝉。农场是安全区。交付载荷并完成三个目标。",
    collectDesc:
      "每粒花粉使蝉成长。紫色稀有花蜜增加5质量，交付时增加5收获。较大的蝉移动更慢。",
    deliverDesc:
      "将载荷交付中央农场，安全区内不能吸收。荆棘减少载荷和质量。被吸收后重生，已交付收获保留。",
    growDesc:
      "交付收获培育永久花园。每100收获增加一个蜂箱。完成三个目标获得任务徽章；与朋友挑战每日地图。",
    total: "已交付收获",
    result: "已交付收获",
    finished: "花园记住你的努力。",
    missionDone: "任务完成！",
    roundLost: "次重生",
    absorbed: "次吸收",
    peak: "最高质量",
  },
};
for (const l of Object.keys(extra)) Object.assign(text[l], extra[l]);
const $ = (id) => document.getElementById(id),
  canvas = $("world"),
  ctx = canvas.getContext("2d"),
  C = SwarmCore;
let lang = "en",
  progress = { total: 0, best: 0 },
  meta = readGarden(null),
  saveOK = true;
try {
  lang = localStorage.getItem("cicadaLanguage") || "en";
  progress = C.readProgress(localStorage.getItem("cicadaSwarm"));
  meta = readGarden(localStorage.getItem("swarmGarden"));
} catch {
  saveOK = false;
}
if (!text[lang]) lang = "en";
let width = 1000,
  height = 540,
  dpr = 1,
  state = "idle",
  world,
  player,
  target = null,
  trail = [],
  last = 0,
  accumulator = 0,
  lastScore = 0,
  lastRespawn = 0,
  missionAwarded = false,
  roundDay = day(),
  hudAt = 0;
const keys = new Set(),
  t = (k) => text[lang][k] || text.en[k] || k;
const profile = profileUI();
audioUI();
$("mode").value =
  new URLSearchParams(location.search).get("daily") === "1" ? "daily" : "free";
function save() {
  try {
    localStorage.setItem("cicadaSwarm", JSON.stringify(progress));
    localStorage.setItem("swarmGarden", JSON.stringify(meta));
  } catch {
    saveOK = false;
  }
}
function setup() {
  roundDay = day();
  const daily = $("mode").value === "daily";
  const rng = daily ? seeded("cicadafarm-v2-" + roundDay) : Math.random;
  world = new World(rng);
  const style = profile.value();
  player = world.join("solo", style.name, style);
  for (let i = 0; i < 3; i++) {
    const b = world.join("bot" + i, `${t("bot")} ${i + 1}`, {
      color: ["#79dce7", "#b59deb", "#e7b479"][i],
    });
    b.x = 480 + rng() * 40;
    b.y = 250 + rng() * 40;
  }
  target = null;
  trail = [];
  keys.clear();
  last = accumulator = lastScore = lastRespawn = 0;
  missionAwarded = false;
  $("shareStatus").textContent = "";
  $("shareFallback").hidden = true;
}
function translate() {
  document.documentElement.lang = lang;
  $("language").value = lang;
  document
    .querySelectorAll("[data-text]")
    .forEach((e) => (e.textContent = t(e.dataset.text)));
  $("freeOption").textContent = t("free");
  $("dailyOption").textContent = t("daily") + " · " + day();
  if (world)
    for (let i = 0; i < 3; i++)
      world.players.get("bot" + i).name = `${t("bot")} ${i + 1}`;
  hud();
  overlay();
}
function overlay() {
  $("overlay").hidden = state === "running";
  if (state === "running") return;
  $("message").textContent = t(
    state === "idle" ? "welcome" : state === "paused" ? "paused" : "finished",
  );
  $("description").textContent =
    state === "ended"
      ? `${t("result")}: ${player.score} · ${t("peak")}: ${Math.round(player.peak)} · ${t("absorbed")}: ${player.absorbed} · ${t("roundLost")}: ${player.respawns}${missionAwarded ? " · " + t("missionDone") : ""}`
      : t("instructions");
  $("start").textContent = t(
    state === "paused" ? "resume" : state === "ended" ? "again" : "start",
  );
  $("share").hidden = state !== "ended";
  $("share").textContent = t("share");
}
function hud() {
  if (!player) return;
  $("mass").textContent = Math.round(player.mass);
  $("cargo").textContent = `${player.cargo} / 20`;
  $("score").textContent = player.score;
  const remain = Math.max(0, Math.ceil(180 - world.elapsed));
  $("time").textContent =
    `${String(Math.floor(remain / 60)).padStart(2, "0")}:${String(remain % 60).padStart(2, "0")}`;
  $("weather").textContent = t(C.weather(world.elapsed));
  $("level").textContent = String(C.level(progress.total)).padStart(2, "0");
  $("total").textContent = `${progress.total} ${t("total")}`;
  $("hint").textContent = !saveOK
    ? t("saving")
    : player.shield > 0
      ? `${t("shield")}: ${Math.ceil(player.shield)}s`
      : player.cargo === 20
        ? t("full")
        : t("hint");
  $("pause").disabled = state !== "running";
  const locked = state === "running" || state === "paused";
  profile.lock(locked);
  $("mode").disabled = locked;
  const values = objectives(player),
    labels = ["goalHarvest", "goalDelivery", "goalRare"],
    ids = ["harvest", "delivery", "rare"],
    max = [40, 3, 3];
  values.forEach((v, i) => {
    $("goal" + ["Harvest", "Delivery", "Rare"][i]).textContent =
      `${v === max[i] ? "✓ " : ""}${t(labels[i])}: ${v}/${max[i]}`;
    $(ids[i] + "Progress").value = v;
    $(ids[i] + "Progress").setAttribute("aria-label", t(labels[i]));
  });
  const g = garden(progress.total);
  $("gardenSummary").textContent =
    `${g.trees} ${t("trees")} · ${g.flowers} ${t("flowers")} · ${g.hives} ${t("hives")}`;
  $("gardenDetail").textContent =
    `${meta.missions} ${t("missions")} · ${t("local")}`;
  $("nextUnlock").textContent =
    g.hives === 8
      ? `${g.hives} ${t("hives")} ✓`
      : `${t("next")}: ${100 - (progress.total % 100)}`;
  $("gardenProgress").value = g.hives === 8 ? 100 : progress.total % 100;
  $("gardenProgress").setAttribute("aria-label", t("next"));
  $("dailySummary").textContent =
    `${t("dailyBest")}: ${meta.daily.date === day() ? meta.daily.best : 0} · ${day()} UTC · ${t("localDaily")}`;
}
function pause() {
  if (state === "running") {
    state = "paused";
    keys.clear();
    target = null;
    last = accumulator = 0;
    overlay();
    hud();
  }
}
canvas.tabIndex = 0;
$("start").onclick = () => {
  canvas.focus({ preventScroll: true });
  if (state !== "paused") setup();
  state = "running";
  last = accumulator = 0;
  overlay();
  hud();
};
$("pause").onclick = pause;
$("mode").onchange = () => {
  state = "idle";
  setup();
  hud();
  overlay();
};
$("language").onchange = (e) => {
  lang = e.target.value;
  try {
    localStorage.setItem("cicadaLanguage", lang);
  } catch {}
  translate();
};
for (const id of ["nickname", "country", "color"])
  $(id).addEventListener("change", () => {
    if (state === "idle" || state === "ended") {
      const v = profile.value();
      Object.assign(player, v);
    }
  });
function pointer(e) {
  const r = canvas.getBoundingClientRect();
  target = {
    x: ((e.clientX - r.left) * 1000) / r.width,
    y: ((e.clientY - r.top) * 540) / r.height,
  };
}
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointer(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "mouse" || e.buttons) pointer(e);
});
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType !== "mouse") target = null;
});
canvas.addEventListener("pointercancel", () => (target = null));
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
  if (e.key === "Escape") pause();
});
window.addEventListener("keyup", (e) => keys.delete(e.key));
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
function resize() {
  const r = canvas.getBoundingClientRect();
  width = r.width;
  height = r.height;
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  target = null;
}
new ResizeObserver(resize).observe(canvas);
function update(dt) {
  const dx =
    (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) -
    (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const ky =
    (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) -
    (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
  world.input(
    "solo",
    dx || ky ? { x: player.x + dx * 100, y: player.y + ky * 100 } : target,
  );
  for (let i = 0; i < 3; i++) {
    const b = world.players.get("bot" + i);
    let q;
    if (b.cargo >= 9) q = { x: 500, y: 270 };
    else {
      const prey = [...world.players.values()].find(
        (p) =>
          p !== b &&
          !safe(p) &&
          !p.shield &&
          b.mass > p.mass * 1.4 &&
          Math.hypot(p.x - b.x, p.y - b.y) < 90,
      );
      if (prey) q = prey;
      else
        for (const r of world.resources)
          if (
            !q ||
            Math.hypot(b.x - r.x, b.y - r.y) < Math.hypot(b.x - q.x, b.y - q.y)
          )
            q = r;
    }
    world.input(b.id, q || null);
  }
  const beforeMass = player.mass,
    beforeAbsorbed = player.absorbed;
  world.step(dt);
  if (player.absorbed > beforeAbsorbed) sound("absorb");
  else if (player.mass > beforeMass) sound("pollen");
  trail.unshift({ x: player.x, y: player.y });
  if (trail.length > 130) trail.pop();
  if (player.respawns !== lastRespawn) {
    trail = [];
    target = null;
    lastRespawn = player.respawns;
    sound("respawn");
    $("status").textContent = t("respawn");
  }
  if (player.score > lastScore) {
    sound("bank");
    progress.total = Math.min(1e9, progress.total + player.score - lastScore);
    progress.best = Math.max(progress.best, player.score);
    lastScore = player.score;
    save();
    $("status").textContent = `${t("deposit")}: ${player.score}`;
  }
  if (
    !missionAwarded &&
    objectives(player).every((v, i) => v === [40, 3, 3][i])
  ) {
    missionAwarded = true;
    meta.missions++;
    save();
    $("status").textContent = t("missionDone");
  }
  if (world.elapsed >= 180) {
    state = "ended";
    keys.clear();
    target = null;
    if ($("mode").value === "daily") {
      if (meta.daily.date !== roundDay)
        meta.daily = { date: roundDay, best: 0 };
      meta.daily.best = Math.max(meta.daily.best, player.score);
    }
    save();
    overlay();
    hud();
  }
}
$("share").onclick = async () => {
  const url = new URL(location.href);
  url.search = "";
  if ($("mode").value === "daily") url.searchParams.set("daily", "1");
  const message = `CicadaFarm · ${$("mode").value === "daily" ? t("daily") + " " + roundDay + " UTC" : t("free")}\n${player.name} · ${t("result")}: ${player.score} · ${t("peak")}: ${Math.round(player.peak)}\n${t($("mode").value === "daily" ? "localDaily" : "localUnverified")}\n${url.href}`;
  try {
    await navigator.clipboard.writeText(message);
    $("shareStatus").textContent = t("copied");
  } catch {
    $("shareFallback").value = message;
    $("shareFallback").hidden = false;
    $("shareFallback").select();
    $("shareStatus").textContent = t("copyManual");
  }
};
function loop(now) {
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  if (state === "running") {
    accumulator += dt;
    while (accumulator >= 1 / 60 && state === "running") {
      update(1 / 60);
      accumulator -= 1 / 60;
    }
  }
  if (now - hudAt > 100) {
    hud();
    hudAt = now;
  }
  drawScene(ctx, width, height, dpr, world.snapshot(), "solo", now, {
    total: progress.total,
    trail,
    target: state === "running" ? target : null,
    safeLabel: t("safe"),
  });
  requestAnimationFrame(loop);
}
setup();
translate();
resize();
requestAnimationFrame(loop);
