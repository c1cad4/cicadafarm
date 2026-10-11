import { Journey, COSTS, GOALS, weather } from "./model.mjs";
import { Renderer } from "./renderer.mjs";
import { t, translate } from "./i18n.mjs";
import { setupShop } from "./shop.mjs";
const $ = (s) => document.querySelector(s);
let saved = null;
try {
  saved = localStorage.getItem("egolution-journey");
} catch {}
const journey = new Journey(saved),
  renderer = new Renderer($("#world"));
let started = false,
  paused = false,
  bigBang = 0,
  last = 0,
  lastHud = 0,
  lastSave = 0,
  shell = null,
  preview = null,
  sound = false,
  audio = null,
  completed = journey.save.stage === 6 && journey.finished();
const keys = new Set();
let pointer = null,
  vector = { x: 0, y: 0 };
function persist() {
  try {
    localStorage.setItem("egolution-journey", JSON.stringify(journey.save));
  } catch {}
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function hud() {
  const s = journey.save.stage;
  $("#stageCount").textContent = `0${s + 1} / 07`;
  $("#stageName").textContent = t("stages")[s];
  $("#mission").textContent = t("tasks")[s];
  $("#objectiveStatus").textContent =
    `${t("objectives")}: ${journey.save.objective} / ${GOALS[s]}${s === 3 && journey.warmth > 0 ? " · " + journey.warmth.toFixed(1) + " / 3 s" : ""}`;
  const event = weather(journey.time);
  $("#eventStatus").textContent = `${t(event.kind)} · ${event.remaining}s`;
  $("#boost").disabled =
    journey.cooldown > 0 ||
    paused ||
    !started ||
    !!document.querySelector("dialog[open]") ||
    !!preview;
  $("#boost").textContent =
    journey.cooldown > 0
      ? `${t("boost")} · ${Math.ceil(journey.cooldown)}s`
      : `${t("boost")} · E`;
  $("#energy").textContent =
    `${journey.save.energy} / ${COSTS[s]} ${t("light")}`;
  $("#total").textContent = `${journey.save.total} ${t("gathered")}`;
  $("#fill").style.width = `${(journey.save.energy / COSTS[s]) * 100}%`;
  $("#forms").textContent = `${t("forms")}: ${t("stages")
    .slice(0, journey.save.cycles ? 7 : s + 1)
    .join(" → ")}`;
  $("#rebirth").disabled = !(s === 6 && journey.finished());
  $("#nextStage").textContent = t("stages")[Math.min(6, s + 1)];
  $("#start").textContent = t(saved ? "resume" : "begin");
}
function stop() {
  keys.clear();
  pointer = null;
  vector = { x: 0, y: 0 };
  $("#joystick").hidden = true;
}
function tone(freq = 400) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      freq * 0.65,
      audio.currentTime + 0.22,
    );
    g.gain.setValueAtTime(0.025, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.3);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.32);
  } catch {
    sound = false;
  }
}
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = sound ? "♫" : "♪";
  $("#sound").ariaPressed = String(sound);
  tone(220);
};
$("#start").onclick = () => {
  started = true;
  $("#intro").close();
  bigBang = journey.save.stage === 0 ? 0.01 : 0;
  last = 0;
  if (journey.ready) $("#evolution").showModal();
  tone(120);
};
$("#pause").onclick = () => {
  paused = !paused;
  $("#pause").textContent = paused ? "▶" : "Ⅱ";
  $("#pause").ariaPressed = String(paused);
  stop();
  if (paused) toast(t("paused"));
};
$("#helpOpen").onclick = () => {
  stop();
  hud();
  $("#help").showModal();
};
$("#shopOpen").onclick = () => {
  stop();
  $("#shop").showModal();
};
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
$("#evolution").addEventListener("cancel", (e) => e.preventDefault());
document.querySelectorAll("[data-trait]").forEach(
  (b) =>
    (b.onclick = () => {
      if (journey.evolve(b.dataset.trait)) {
        persist();
        hud();
        $("#evolution").close();
        tone(660);
        toast(t("stages")[journey.save.stage]);
      }
    }),
);
$("#rebirth").onclick = () => {
  if (journey.rebirth()) {
    completed = false;
    persist();
    hud();
    $("#help").close();
    bigBang = 0.01;
    tone(120);
  }
};
$("#language").onchange = (e) => {
  translate(e.target.value);
  hud();
  shop.refresh();
};
const shop = setupShop({
  toast,
  setShell: (v) => (shell = v),
  setPreview: (v) => {
    preview = v;
    stop();
  },
});
$("#boost").onclick = () => {
  if (
    !paused &&
    started &&
    !preview &&
    !document.querySelector("dialog[open]") &&
    journey.boost()
  )
    tone(300);
};
window.addEventListener("keydown", (e) => {
  if (
    e.key.toLowerCase() === "e" &&
    !e.repeat &&
    !document.querySelector("dialog[open]")
  ) {
    e.preventDefault();
    $("#boost").click();
    return;
  }
  if (document.querySelector("dialog[open]")) return;
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
      "W",
      "A",
      "S",
      "D",
      " ",
    ].includes(e.key)
  ) {
    e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key === " " && !e.repeat) $("#pause").click();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
const canvas = $("#world");
canvas.addEventListener("pointerdown", (e) => {
  if (!started || paused || pointer || document.querySelector("dialog[open]"))
    return;
  pointer = {
    id: e.pointerId,
    type: e.pointerType,
    startX: e.clientX,
    startY: e.clientY,
    x: e.clientX,
    y: e.clientY,
  };
  canvas.setPointerCapture(e.pointerId);
  if (e.pointerType !== "mouse") {
    $("#joystick").hidden = false;
    $("#joystick").style.left = `${e.clientX - 54}px`;
    $("#joystick").style.top = `${e.clientY - 54}px`;
  }
  updateVector(e);
});
function updateVector(e) {
  if (!pointer || pointer.id !== e.pointerId) return;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  const dx =
      e.clientX - (pointer.type === "mouse" ? innerWidth / 2 : pointer.startX),
    dy =
      e.clientY -
      (pointer.type === "mouse" ? innerHeight / 2 + 30 : pointer.startY),
    len = Math.hypot(dx, dy),
    scale = Math.min(1, len / 45);
  vector =
    len < 5 ? { x: 0, y: 0 } : { x: (dx / len) * scale, y: (dy / len) * scale };
  if (pointer.type !== "mouse")
    $("#joystick span").style.transform =
      `translate(${vector.x * 32}px,${vector.y * 32}px)`;
}
canvas.addEventListener("pointermove", updateVector);
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(name, (e) => {
    if (pointer?.id === e.pointerId) stop();
  });
window.addEventListener("blur", () => {
  stop();
  persist();
});
document.addEventListener("visibilitychange", () => {
  last = 0;
  stop();
  persist();
});
window.addEventListener("pagehide", persist);
window.addEventListener("resize", () => {
  renderer.resize();
  stop();
});
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) {
    last = 0;
    return;
  }
  const modal = !!document.querySelector("dialog[open]") || !!preview;
  if (now - last < (modal || paused || !started ? 100 : 16)) return;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  if (started && !paused && !modal) {
    let dx = vector.x,
      dy = vector.y;
    if (keys.size) {
      dx =
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
      dy =
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    }
    const result = journey.step(dt, dx, dy);
    if (result.objective) {
      toast(t("objectiveDone"));
      tone(740);
      persist();
    }
    if (result.collected) tone(420 + journey.save.stage * 45);
    if (result.hit) {
      tone(95);
      toast(t("hit"));
    }
    if (journey.ready) {
      stop();
      hud();
      persist();
      $("#evolution").showModal();
    }
    if (!completed && journey.save.stage === 6 && journey.finished()) {
      completed = true;
      persist();
      hud();
      toast(t("complete"));
    }
    if (bigBang) {
      bigBang += dt;
      if (bigBang > 2) bigBang = 0;
    }
  }
  if (now - lastHud > 200) {
    hud();
    lastHud = now;
  }
  if (now - lastSave > 2500) {
    persist();
    lastSave = now;
  }
  renderer.draw(journey, shell, bigBang, preview);
}
translate();
hud();
$("#intro").showModal();
requestAnimationFrame(frame);
