"use strict";
(() => {
  const arena = document.querySelector(".arena");
  const button = document.getElementById("fullscreen");
  const labels = {
    en: ["⛶ Full screen", "⛶ Exit full screen"],
    ru: ["⛶ На весь экран", "⛶ Выйти из полного экрана"],
    "zh-CN": ["⛶ 全屏", "⛶ 退出全屏"],
  };
  const active = () =>
    document.fullscreenElement === arena ||
    arena.classList.contains("expanded");
  function sync() {
    const expanded = active();
    document.body.classList.toggle("game-expanded", expanded);
    button.textContent = (labels[document.documentElement.lang] || labels.en)[
      expanded ? 1 : 0
    ];
    button.setAttribute("aria-pressed", String(expanded));
  }
  async function enter() {
    if (active()) return;
    try {
      if (!arena.requestFullscreen) throw new Error("Fullscreen unavailable");
      await arena.requestFullscreen();
    } catch {
      // Mobile browsers without Fullscreen API still get an edge-to-edge arena.
      arena.classList.add("expanded");
    }
    sync();
    document.getElementById("world").focus({ preventScroll: true });
  }
  async function exit() {
    if (document.fullscreenElement === arena) {
      try {
        await document.exitFullscreen();
      } catch {
        return;
      }
    }
    arena.classList.remove("expanded");
    sync();
    document.getElementById("world").focus({ preventScroll: true });
  }
  button.addEventListener("click", () => (active() ? exit() : enter()));
  document.getElementById("start").addEventListener("click", enter);
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && active()) exit();
  });
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  sync();
})();
