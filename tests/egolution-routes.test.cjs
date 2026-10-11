const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
test("deployment routes Egolution to a separate Durable Object and leaves Swarm intact", async () => {
  const { default: worker } = await import("../multiplayer/worker.js");
  const calls = [];
  const binding = (name) => ({
    idFromName: (id) => name + ":" + id,
    get: (id) => ({
      fetch: async (req) => {
        calls.push({ id, path: new URL(req.url).pathname });
        return Response.json({ ok: true });
      },
    }),
  });
  const env = {
    ACCOUNTS: binding("swarm"),
    EGOLUTION_ACCOUNTS: binding("ego"),
    SOLANA_RPC_URL: "private",
  };
  const headers = { Origin: "https://cicadafarm.pages.dev" };
  let r = await worker.fetch(
    new Request("https://test/egolution/api/me", { headers }),
    env,
  );
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), headers.Origin);
  assert.deepEqual(calls[0], { id: "ego:egolution-accounts", path: "/api/me" });
  await worker.fetch(new Request("https://test/api/me", { headers }), env);
  assert.deepEqual(calls[1], { id: "swarm:accounts", path: "/api/me" });
  r = await worker.fetch(
    new Request("https://test/egolution/api/me", {
      headers: { Origin: "https://foreign.example" },
    }),
    env,
  );
  assert.equal(r.status, 403);
  assert.equal(calls.length, 2);
});
