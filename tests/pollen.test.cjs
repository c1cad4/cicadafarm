const test = require("node:test"),
  assert = require("node:assert/strict");
const model = () => import("../multiplayer/model.js");
test("pollen grows mass; rare nectar banks five harvest without shrinking growth", async () => {
  const { World } = await model(),
    w = new World(),
    p = w.join("a", "A");
  w.thorns = [];
  w.resources = [{ x: 180, y: 200, kind: 3 }];
  p.x = 180;
  p.y = 200;
  w.step(0.1);
  assert.equal(p.mass, 25);
  assert.equal(p.cargo, 1);
  assert.equal(p.rare, 0);
  p.x = 500;
  p.y = 270;
  w.step(0.1);
  assert.equal(p.score, 5);
  assert.equal(w.total, 5);
  assert.equal(p.mass, 25);
  assert.equal(p.rare, 1);
  assert.equal(p.deliveries, 1);
});
test("absorption requires greater mass, safe zones and respawn shields protect players", async () => {
  const { World } = await model(),
    w = new World(),
    a = w.join("a", "A"),
    b = w.join("b", "B");
  w.resources = [];
  w.thorns = [];
  Object.assign(a, { mass: 100, shield: 0 });
  Object.assign(b, { mass: 30, shield: 0, score: 42 });
  w.step(0.1);
  assert.equal(b.respawns, 0);
  Object.assign(a, { x: 180, y: 200 });
  Object.assign(b, { x: 180, y: 200, shield: 3, cargo: 2, rareCargo: 1 });
  w.step(0.1);
  assert.equal(b.respawns, 0);
  b.shield = 0;
  a.mass = 35;
  w.step(0.1);
  assert.equal(b.respawns, 0);
  a.mass = 100;
  w.step(0.1);
  assert.equal(a.absorbed, 1);
  assert.equal(b.respawns, 1);
  assert.equal(b.mass, 20);
  assert.equal(b.score, 42);
  assert.equal(b.cargo, 0);
  assert.equal(b.shield, 5);
  assert.equal(b.x, 500);
  assert.equal(a.cargo, 2);
  assert.equal(a.rareCargo, 1);
  w.step(0.1);
  assert.equal(a.absorbed, 1);
});
test("clients cannot set mass or cosmetic HTML; flag and colour are validated", async () => {
  const { World, name, radius } = await model(),
    { appearance, flag } = await import("../multiplayer/profile.js");
  assert.deepEqual(appearance({ country: "<script>", color: "url(evil)" }), {
    country: "",
    color: "#c8ff91",
  });
  assert.equal(flag("RU"), "🇷🇺");
  assert.equal(flag("XX"), "");
  assert.equal(name("<A>\u0000"), "A");
  const w = new World(),
    p = w.join("a", "A", { country: "CN", color: "#00AAFF" });
  w.resources = [];
  w.thorns = [];
  w.input("a", { x: 900, y: 270, mass: 9000, color: "evil" });
  w.step(0.1);
  assert.equal(p.mass, 20);
  assert.equal(p.color, "#00aaff");
  assert.equal(p.country, "CN");
  assert.ok(radius(200) > radius(20));
  assert.equal(radius(1e10), radius(2000));
});
test("larger cicadas move more slowly, and full cargo still allows growth", async () => {
  const { World } = await model(),
    w = new World(),
    a = w.join("a", "A"),
    b = w.join("b", "B");
  w.resources = [];
  w.thorns = [];
  b.mass = 300;
  w.input("a", { x: 900, y: 270 });
  w.input("b", { x: 900, y: 270 });
  w.step(0.1);
  assert.ok(a.x > b.x);
  a.input = null;
  a.cargo = 20;
  w.resources = [{ x: a.x, y: a.y, kind: 0 }];
  a.x = 180;
  a.y = 200;
  w.resources[0].x = 180;
  w.resources[0].y = 200;
  w.step(0.1);
  assert.equal(a.mass, 21);
  assert.equal(a.cargo, 20);
});
test("daily maps and simulation replay identically; different dates give different maps", async () => {
  const { seeded } = await import("../play/garden-core.mjs"),
    { World } = await model();
  const a = new World(seeded("cicadafarm-v2-2026-10-10")),
    b = new World(seeded("cicadafarm-v2-2026-10-10")),
    c = new World(seeded("cicadafarm-v2-2026-10-11"));
  assert.deepEqual(a.resources, b.resources);
  assert.notDeepEqual(a.resources, c.resources);
  a.join("a", "A");
  b.join("a", "A");
  a.input("a", { x: 900, y: 200 });
  b.input("a", { x: 900, y: 200 });
  for (let i = 0; i < 600; i++) {
    a.step(1 / 60);
    b.step(1 / 60);
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
});
test("garden save validation rejects corrupt counts; goals require banked nectar and deliveries", async () => {
  const { readGarden, objectives, garden, day } = await import(
    "../play/garden-core.mjs"
  );
  assert.deepEqual(
    readGarden('{"missions":-1,"daily":{"date":"bad","best":1e99}}'),
    { missions: 0, daily: { date: "", best: 0 } },
  );
  assert.deepEqual(
    objectives({ score: 100, deliveries: 2, rare: 0 }),
    [40, 2, 0],
  );
  assert.deepEqual(garden(100), { trees: 10, flowers: 33, hives: 1 });
  assert.equal(day(new Date("2026-10-10T23:00:00Z")), "2026-10-10");
});
