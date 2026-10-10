const test = require("node:test"),
  assert = require("node:assert/strict"),
  c = require("../play/core.js");
test("untrusted local saves cannot inject invalid progress", () => {
  for (const raw of [
    "bad",
    "null",
    '{"total":-2,"best":"42"}',
    '{"total":1e100,"best":99999}',
  ])
    assert.deepEqual(c.readProgress(raw), { total: 0, best: 0 });
  assert.deepEqual(c.readProgress('{"total":80,"best":15}'), {
    total: 80,
    best: 15,
  });
});
test("only carried capacity can be banked and growth follows deliveries", () => {
  assert.equal(c.deposit(999), 20);
  assert.equal(c.deposit(-1), 0);
  assert.equal(c.level(0), 1);
  assert.equal(c.level(160), 3);
});
test("weather cycles across the three minute round", () =>
  assert.deepEqual([0, 45, 90, 135].map(c.weather), [
    "sun",
    "rain",
    "wind",
    "dry",
  ]));
