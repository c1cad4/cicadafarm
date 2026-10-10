const test = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
test("a completed solo daily round saves delivered harvest, restores its garden and shares an honest result", async () => {
  const { World, safe } = await import("../multiplayer/model.js");
  const garden = await import("../play/garden-core.mjs");
  const code = fs
    .readFileSync(require.resolve("../play/game.js"), "utf8")
    .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "");
  const storage = new Map();
  let world,
    shared = "";
  function boot() {
    const elements = new Map();
    let frame,
      time = 0;
    function el(id) {
      if (!elements.has(id))
        elements.set(id, {
          id,
          value: "",
          textContent: "",
          hidden: false,
          dataset: {},
          listeners: {},
          setAttribute() {},
          focus() {},
          getContext() {
            return {};
          },
          getBoundingClientRect() {
            return { left: 0, top: 0, width: 1000, height: 540 };
          },
          addEventListener(k, fn) {
            this.listeners[k] = fn;
          },
          setPointerCapture() {},
          select() {},
        });
      return elements.get(id);
    }
    class TestWorld extends World {
      constructor(rng) {
        super(rng);
        world = this;
      }
      input(id, q) {
        if (id === "solo") super.input(id, q);
      }
    }
    vm.runInNewContext(code, {
      World: TestWorld,
      safe,
      ...garden,
      profileUI: () => ({
        value: () => ({ name: "Garden test", country: "RU", color: "#39bfff" }),
        lock() {},
      }),
      drawScene() {},
      audioUI() {},
      sound() {},
      SwarmCore: require("../play/core.js"),
      document: {
        documentElement: { lang: "en" },
        getElementById: el,
        querySelectorAll: () => [],
        addEventListener() {},
        hidden: false,
      },
      window: { addEventListener() {} },
      localStorage: {
        getItem: (k) => storage.get(k) || null,
        setItem: (k, v) => storage.set(k, v),
      },
      location: {
        href: "https://cicadafarm.pages.dev/play/?daily=1",
        search: "?daily=1",
      },
      URL,
      URLSearchParams,
      Date,
      Math,
      devicePixelRatio: 1,
      ResizeObserver: class {
        observe() {}
      },
      requestAnimationFrame: (fn) => {
        frame = fn;
      },
      navigator: {
        clipboard: {
          async writeText(v) {
            shared = v;
          },
        },
      },
    });
    return {
      el,
      frames(n) {
        for (let i = 0; i < n; i++) {
          time += 1000 / 60;
          frame(time);
        }
      },
    };
  }
  const ui = boot();
  ui.el("start").onclick();
  world.resources = [{ x: 620, y: 270, kind: 3 }];
  world.thorns = [];
  ui.el("world").listeners.pointerdown({
    pointerId: 1,
    clientX: 620,
    clientY: 270,
  });
  ui.frames(100);
  assert.ok(Number(ui.el("mass").textContent) >= 25);
  assert.equal(ui.el("cargo").textContent, "1 / 20");
  ui.el("world").listeners.pointerdown({
    pointerId: 1,
    clientX: 500,
    clientY: 270,
  });
  ui.frames(100);
  const saved = JSON.parse(storage.get("cicadaSwarm"));
  assert.equal(saved.total, 5);
  assert.equal(ui.el("deliveryProgress").value, 1);
  assert.equal(ui.el("rareProgress").value, 1);
  assert.equal(JSON.parse(storage.get("swarmGarden")).daily.best, 0);
  ui.frames(11000);
  assert.equal(ui.el("share").hidden, false);
  assert.equal(JSON.parse(storage.get("swarmGarden")).daily.best, 5);
  await ui.el("share").onclick();
  assert.ok(shared.includes("Garden of the day"));
  assert.ok(shared.includes("local, unverified result"));
  assert.ok(shared.includes("?daily=1"));
  const restored = boot();
  assert.ok(restored.el("total").textContent.startsWith("5 "));
  assert.ok(restored.el("dailySummary").textContent.includes("Daily best: 5"));
});
