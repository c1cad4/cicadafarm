const test = require("node:test"),
  assert = require("node:assert/strict");
const recipient = "AHBz386tP36ZrABN7STzxV66u1f7CwnaqrFBnevb4ff8",
  payer = "11111111111111111111111111111111";
test("population expands bounds, adds houses and pollen; houses protect deposits", async () => {
  const { World, safe } = await import("../multiplayer/model.js");
  const w = new World(() => 0.6, { dynamic: true });
  for (let i = 0; i < 4; i++) w.join("p" + i, "Player");
  assert.equal(w.width, 1360);
  assert.equal(w.homes.length, 2);
  assert.ok(w.resources.length > 65);
  const p = w.players.get("p0"),
    q = w.players.get("p1");
  Object.assign(p, { ...w.homes[1], mass: 100, cargo: 4, shield: 0 });
  Object.assign(q, { ...w.homes[1], mass: 20, shield: 0 });
  w.thorns = [];
  w.resources = [];
  w.step(0.1);
  assert.ok(safe(p, w.homes));
  assert.equal(p.score, 4);
  assert.equal(q.respawns, 0);
  w.input("p0", { x: 999999, y: 270 });
  assert.equal(p.input.x, 1347);
  w.players.delete("p3");
  w.expand();
  assert.equal(w.width, 1360);
  assert.equal(w.snapshot().width, 1360);
});
function encode58(a) {
  const abc = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const b of a) n = n * 256n + BigInt(b);
  let s = "";
  while (n) {
    s = abc[Number(n % 58n)] + s;
    n /= 58n;
  }
  for (const b of a) {
    if (b !== 0) break;
    s = "1" + s;
  }
  return s;
}
class Store {
  constructor() {
    this.map = new Map();
    this.tail = Promise.resolve();
  }
  async get(k) {
    return structuredClone(this.map.get(k));
  }
  async put(k, v) {
    this.map.set(k, structuredClone(v));
  }
  async delete(k) {
    for (const key of Array.isArray(k) ? k : [k]) this.map.delete(key);
  }
  async setAlarm() {}
  async list({ prefix }) {
    return new Map([...this.map].filter(([k]) => k.startsWith(prefix)));
  }
  transaction(fn) {
    const result = this.tail.then(() => fn(this));
    this.tail = result.catch(() => {});
    return result;
  }
}
test("real wallet signature rejects forgery and replay; inventory persists and equip requires ownership", async () => {
  const { Accounts } = await import("../multiplayer/accounts.js"),
    storage = new Store(),
    a = new Accounts({ storage }, {});
  const keys = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
      "sign",
      "verify",
    ]),
    address = encode58(
      new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey)),
    );
  const request = (path, body, token) =>
    a.fetch(
      new Request("https://test" + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
  let response = await request("/api/challenge", { wallet: address });
  assert.equal(response.status, 200);
  const challenge = await response.json();
  response = await request("/api/login", {
    id: challenge.id,
    signature: Buffer.alloc(64).toString("base64"),
  });
  assert.equal(response.status, 401);
  const signature = Buffer.from(
    await crypto.subtle.sign(
      "Ed25519",
      keys.privateKey,
      new TextEncoder().encode(challenge.message),
    ),
  ).toString("base64");
  response = await request("/api/login", { id: challenge.id, signature });
  assert.equal(response.status, 200);
  const login = await response.json();
  response = await request("/api/login", { id: challenge.id, signature });
  assert.equal(response.status, 401);
  response = await request("/api/equip", { item: "crown" }, login.token);
  assert.equal(response.status, 403);
  await storage.put("wallet:" + address, { owned: ["halo"], equipped: null });
  response = await request("/api/equip", { item: "halo" }, login.token);
  assert.equal(response.status, 200);
  response = await new Accounts({ storage }, {}).fetch(
    new Request("https://test/api/me", {
      headers: { Authorization: "Bearer " + login.token },
    }),
  );
  assert.equal((await response.json()).equipped, "halo");
});
test("verified receipts require success, payer, memo, exact mint, merchant and sufficient amount; one receipt cannot unlock twice", async () => {
  const { Accounts } = await import("../multiplayer/accounts.js"),
    { CURRENCIES, verifyPayment } = await import("../multiplayer/commerce.js"),
    storage = new Store(),
    a = new Accounts({ storage }, {}),
    token = crypto.randomUUID() + crypto.randomUUID(),
    signature = encode58(new Uint8Array(64).fill(17));
  await storage.put("session:" + token, {
    wallet: payer,
    expires: Date.now() + 10000,
  });
  const now = Date.now(),
    q = {
      id: "swarm-one",
      wallet: payer,
      item: "halo",
      currency: "CICADAFARM",
      raw: "1000000000",
      created: now - 5000,
      expires: now + 300000,
    };
  await storage.put("quote:" + q.id, q);
  function tx() {
    return {
      blockTime: Math.floor(now / 1000),
      transaction: {
        message: {
          accountKeys: [{ pubkey: payer, signer: true }],
          instructions: [{ program: "spl-memo", parsed: q.id }],
        },
      },
      meta: {
        err: null,
        preTokenBalances: [
          {
            mint: CURRENCIES.CICADAFARM.mint,
            owner: payer,
            uiTokenAmount: { amount: q.raw, decimals: 6 },
          },
        ],
        postTokenBalances: [
          {
            mint: CURRENCIES.CICADAFARM.mint,
            owner: recipient,
            uiTokenAmount: { amount: q.raw, decimals: 6 },
          },
        ],
      },
    };
  }
  assert.ok(verifyPayment(tx(), q));
  let bad = tx();
  bad.meta.err = { InstructionError: [1, "bad"] };
  assert.equal(verifyPayment(bad, q), false);
  bad = tx();
  bad.transaction.message.instructions = [];
  assert.equal(verifyPayment(bad, q), false);
  bad = tx();
  bad.meta.postTokenBalances[0].owner = payer;
  assert.equal(verifyPayment(bad, q), false);
  bad = tx();
  bad.meta.postTokenBalances[0].mint = CURRENCIES.ROBOTCYB.mint;
  assert.equal(verifyPayment(bad, q), false);
  bad = tx();
  bad.meta.postTokenBalances[0].uiTokenAmount.amount = "999";
  assert.equal(verifyPayment(bad, q), false);
  bad = tx();
  bad.transaction.message.accountKeys[0].signer = false;
  assert.equal(verifyPayment(bad, q), false);
  bad = tx();
  bad.blockTime = 1;
  assert.equal(verifyPayment(bad, q), false);
  const sol = { ...q, currency: "SOL", raw: "1000000" },
    st = tx();
  st.transaction.message.accountKeys.push({ pubkey: recipient, signer: false });
  st.transaction.message.instructions.push({
    program: "system",
    parsed: {
      type: "transfer",
      info: { source: payer, destination: recipient, lamports: 1000000 },
    },
  });
  st.meta.preBalances = [2000000, 0];
  st.meta.postBalances = [990000, 1000000];
  assert.ok(verifyPayment(st, sol));
  st.meta.postBalances[1] = 900000;
  assert.equal(verifyPayment(st, sol), false);
  a.rpc = async () => tx();
  const req = (id) =>
    a.fetch(
      new Request("https://test/api/claim", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: JSON.stringify({ id, signature }),
      }),
    );
  const responses = await Promise.all([req(q.id), req(q.id)]);
  assert.ok(responses.some((r) => r.status === 200));
  assert.deepEqual((await storage.get("wallet:" + payer)).owned, ["halo"]);
  const q2 = { ...q, id: "swarm-two", item: "crown" };
  await storage.put("quote:" + q2.id, q2);
  q.id = q2.id;
  const reused = await req(q2.id);
  assert.equal(reused.status, 409);
  assert.deepEqual((await storage.get("wallet:" + payer)).owned, ["halo"]);
});
test("chat removes controls and markup and bounds message length", async () => {
  const { cleanChat } = await import("../multiplayer/commerce.js");
  assert.equal(cleanChat("<hello>\u0000"), "hello");
  assert.equal(cleanChat("x".repeat(500)).length, 180);
  assert.equal(cleanChat({ text: "bad" }), "");
});
test('RPC falls back after a provider rejects indexed requests; unavailable providers never verify payment', async()=>{
 const {Accounts}=await import('../multiplayer/accounts.js'),a=new Accounts({storage:new Store()},{}),oldFetch=global.fetch;let calls=[];
 try {global.fetch=async url=>{calls.push(url);return calls.length===1?Response.json({error:{message:'requires key'}}):Response.json({result:{value:{decimals:6}}});};assert.equal((await a.rpc('getTokenSupply',[])).value.decimals,6);assert.equal(calls.length,2);global.fetch=async()=>Response.json({error:{message:'unavailable'}});await assert.rejects(()=>a.rpc('getTransaction',[]),/unavailable/);}finally{global.fetch=oldFetch;}
});
