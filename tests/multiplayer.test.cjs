const test = require("node:test"),
  assert = require("node:assert/strict");
test("server rejects invented scores and impossible movement", async () => {
  const { World } = await import("../multiplayer/model.js");
  const w = new World(() => 0.8),
    p = w.join("a", "Alice");
  w.input("a", { x: 900, y: 270, score: 999, cargo: 999 });
  w.step(0.1);
  assert.ok(p.x <= 514.5);
  assert.equal(p.score, 0);
  assert.equal(p.cargo, 0);
  w.input("a", { x: Infinity, y: 0 });
  assert.equal(p.input.x, 900);
});
test("rooms cap players and names are plain text", async () => {
  const { World, name } = await import("../multiplayer/model.js");
  const w = new World();
  for (let i = 0; i < 12; i++) assert.ok(w.join("p" + i, "Cicada"));
  assert.equal(w.join("extra", "No"), null);
  assert.equal(name("<Alice>"), "Alice");
});
test("server banks resources once and shared harvest follows deposits", async () => {
  const { World } = await import("../multiplayer/model.js");
  const w = new World(),
    p = w.join("a", "A");
  p.cargo = 5;
  w.resources = [];
  w.step(0.1);
  assert.equal(w.total, 5);
  assert.equal(p.score, 5);
  w.step(0.1);
  assert.equal(w.total, 5);
});
test("round resets scores but preserves connected identities", async () => {
  const { World } = await import("../multiplayer/model.js");
  const w = new World(),
    p = w.join("a", "A");
  p.score = 8;
  w.elapsed = 189.99;
  w.step(0.1);
  assert.equal(w.elapsed, 0);
  assert.equal(p.score, 0);
  assert.equal(w.players.size, 1);
});
