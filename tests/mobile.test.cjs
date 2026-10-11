const test = require("node:test"),
  assert = require("node:assert/strict");
test("camera keeps uniform scale, visible player and invertible controls across phones, iPads and expanded maps", async () => {
  const { camera, screenPoint } = await import("../play/viewport.mjs");
  for (const [w, h] of [
    [390, 844],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [1920, 1080],
  ])
    for (const mapW of [1000, 2080])
      for (const p of [
        { x: 500, y: 270 },
        { x: 13, y: 13 },
        { x: mapW - 13, y: 527 },
      ]) {
        const v = camera(w, h, mapW, 540, p),
          q = screenPoint(v, (p.x - v.x) * v.scale, (p.y - v.y) * v.scale);
        assert.ok(Math.abs(q.x - p.x) < 1e-8 && Math.abs(q.y - p.y) < 1e-8);
        assert.ok(
          v.x >= 0 &&
            v.y >= 0 &&
            v.x + v.viewW <= mapW + 1e-8 &&
            v.y + v.viewH <= 540 + 1e-8,
        );
        assert.ok(
          p.x >= v.x &&
            p.x <= v.x + v.viewW &&
            p.y >= v.y &&
            p.y <= v.y + v.viewH,
        );
      }
});
test("touch dead zone stops movement and continued drag follows player; canvas stays within its pixel budget", async () => {
  const { touchTarget, pixelRatio } = await import("../play/viewport.mjs");
  assert.equal(
    touchTarget({ x: 500, y: 270 }, { x: 10, y: 10 }, { x: 12, y: 11 }),
    null,
  );
  assert.deepEqual(
    touchTarget({ x: 500, y: 270 }, { x: 10, y: 10 }, { x: 60, y: 10 }),
    { x: 650, y: 270 },
  );
  assert.deepEqual(
    touchTarget({ x: 600, y: 270 }, { x: 10, y: 10 }, { x: 60, y: 10 }),
    { x: 750, y: 270 },
  );
  for (const [w, h] of [
    [390, 844],
    [1920, 1080],
    [3840, 2160],
  ])
    assert.ok(w * h * pixelRatio(w, h, 3) ** 2 <= 1800000 + 1);
});
