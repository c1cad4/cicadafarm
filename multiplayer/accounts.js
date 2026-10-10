import {
  MERCHANT,
  CURRENCIES,
  ITEMS,
  decode58,
  walletAddress,
  verifyPayment,
} from "./commerce.js";
const json = (body, status = 200) => Response.json(body, { status });
export class Accounts {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async rpc(method, params) {
    const endpoints = this.env.SOLANA_RPC_URL
      ? [this.env.SOLANA_RPC_URL]
      : [
          "https://api.mainnet-beta.solana.com",
          "https://solana-rpc.publicnode.com",
        ];
    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          signal: AbortSignal.timeout(7000),
        });
        const data = await r.json();
        if (r.ok && !data.error) return data.result;
      } catch {}
    }
    throw Error(
      "Solana verification unavailable; retry later without paying again",
    );
  }
  async fetch(request) {
    try {
      const u = new URL(request.url),
        path = u.pathname;
      let body = {};
      if (request.method === "POST") {
        const raw = await request.text();
        if (raw.length > 3000) return json({ error: "Request too large" }, 413);
        body = JSON.parse(raw);
      }
      const ip = request.headers.get("CF-Connecting-IP") || "local";
      if (path === "/api/challenge") {
        if (!walletAddress(body.wallet))
          return json({ error: "Invalid wallet" }, 400);
        const rateKey = "rate:" + ip,
          last = (await this.state.storage.get(rateKey)) || 0;
        if (Date.now() - last < 3000)
          return json(
            { error: "Wait before requesting another signature" },
            429,
          );
        await this.state.storage.put(rateKey, Date.now());
        const id = crypto.randomUUID(),
          expires = Date.now() + 300000;
        const message = `CicadaFarm Swarm wallet sign-in\nWallet: ${body.wallet}\nNonce: ${id}\nExpires: ${new Date(expires).toISOString()}\nThis signature authenticates chat and your cosmetic inventory. It does not transfer funds.`;
        await this.state.storage.put("nonce:" + id, {
          wallet: body.wallet,
          message,
          expires,
        });
        await this.state.storage.setAlarm(Date.now() + 3600000);
        return json({ id, message });
      }
      if (path === "/api/login") {
        const q = await this.state.storage.get("nonce:" + body.id);
        if (!q || q.expires < Date.now())
          return json({ error: "Sign-in challenge expired" }, 401);
        if (typeof body.signature !== "string" || body.signature.length > 100)
          return json({ error: "Invalid signature" }, 400);
        const sig = Uint8Array.from(atob(body.signature), (c) =>
          c.charCodeAt(0),
        );
        const key = await crypto.subtle.importKey(
          "raw",
          decode58(q.wallet),
          { name: "Ed25519" },
          false,
          ["verify"],
        );
        if (
          !(await crypto.subtle.verify(
            "Ed25519",
            key,
            sig,
            new TextEncoder().encode(q.message),
          ))
        )
          return json({ error: "Signature rejected" }, 401);
        // A serialized transaction prevents simultaneous nonce replay.
        const token = crypto.randomUUID() + crypto.randomUUID(),
          session = { wallet: q.wallet, expires: Date.now() + 86400000 };
        const accepted = await this.state.storage.transaction(
          async (storage) => {
            if (!(await storage.get("nonce:" + body.id))) return false;
            await storage.delete("nonce:" + body.id);
            await storage.put("session:" + token, session);
            return true;
          },
        );
        return accepted
          ? json({ token, wallet: q.wallet, expires: session.expires })
          : json({ error: "Challenge already used" }, 401);
      }
      const token =
        request.headers.get("Authorization")?.replace(/^Bearer /, "") ||
        body.token;
      if (!/^[a-f0-9-]{72}$/.test(token || ""))
        return json({ error: "Connect and sign with your wallet first" }, 401);
      const session = await this.state.storage.get("session:" + token);
      if (!session || session.expires < Date.now())
        return json({ error: "Wallet session expired" }, 401);
      const inventory = (await this.state.storage.get(
        "wallet:" + session.wallet,
      )) || { owned: [], equipped: null };
      if (path === "/internal/session" || path === "/api/me")
        return json({
          wallet: session.wallet,
          expires: session.expires,
          ...inventory,
        });
      if (path === "/api/equip") {
        if (body.item !== null && !inventory.owned.includes(body.item))
          return json({ error: "Item is not owned" }, 403);
        inventory.equipped = body.item;
        await this.state.storage.put("wallet:" + session.wallet, inventory);
        return json(inventory);
      }
      if (path === "/api/quote") {
        if (!this.env.SOLANA_RPC_URL)
          return json(
            {
              error: "Checkout is awaiting secure RPC setup. No payment sent.",
            },
            503,
          );
        const item = ITEMS[body.item],
          currency = CURRENCIES[body.currency];
        if (!item || !currency)
          return json({ error: "Unknown item or currency" }, 400);
        if (inventory.owned.includes(body.item))
          return json({ error: "Already owned; equip it instead" }, 409);
        if (currency.mint) {
          const account = await this.rpc("getAccountInfo", [
            currency.mint,
            { encoding: "jsonParsed", commitment: "finalized" },
          ]);
          const mint = account?.value?.data?.parsed;
          if (
            account?.value?.owner !== currency.tokenProgram ||
            mint?.type !== "mint" ||
            mint.info.decimals !== currency.decimals
          )
            throw Error("Token configuration mismatch");
          if (
            (mint.info.extensions || []).some(
              (x) =>
                !["metadataPointer", "tokenMetadata"].includes(x.extension),
            )
          )
            throw Error("Unsupported token extension; payment disabled");
        }
        const block = await this.rpc("getLatestBlockhash", [
          { commitment: "confirmed" },
        ]);
        const q = {
          id: "swarm-" + crypto.randomUUID(),
          wallet: session.wallet,
          item: body.item,
          currency: body.currency,
          mint: currency.mint,
          tokenProgram: currency.tokenProgram,
          decimals: currency.decimals,
          raw: (BigInt(currency.raw) * BigInt(item.factor)).toString(),
          recipient: MERCHANT,
          created: Date.now(),
          expires: Date.now() + 300000,
          blockhash: block.value.blockhash,
          lastValidBlockHeight: block.value.lastValidBlockHeight,
        };
        await this.state.storage.put("quote:" + q.id, q);
        return json(q);
      }
      if (path === "/api/claim") {
        if (
          typeof body.signature !== "string" ||
          decode58(body.signature).length !== 64
        )
          return json({ error: "Invalid transaction signature" }, 400);
        const q = await this.state.storage.get("quote:" + body.id);
        if (!q || q.wallet !== session.wallet)
          return json({ error: "Quote not found" }, 404);
        if (q.claimed)
          return json({
            owned: inventory.owned,
            equipped: inventory.equipped,
            receipt: q.claimed,
          });
        if (Date.now() > q.expires + 86400000)
          return json({ error: "Receipt verification window expired" }, 410);
        const tx = await this.rpc("getTransaction", [
          body.signature,
          {
            encoding: "jsonParsed",
            commitment: "finalized",
            maxSupportedTransactionVersion: 0,
          },
        ]);
        if (!tx)
          return json(
            {
              error:
                "Transaction not finalized yet. Retry verification; do not pay again.",
            },
            202,
          );
        if (!verifyPayment(tx, q))
          return json(
            {
              error:
                "Payment does not match quote, wallet, recipient, memo, currency or amount",
            },
            400,
          );
        return await this.state.storage.transaction(async (storage) => {
          const used = await storage.get("receipt:" + body.signature);
          if (used) return json({ error: "Receipt already claimed" }, 409);
          const current = (await storage.get("wallet:" + session.wallet)) || {
            owned: [],
            equipped: null,
          };
          current.owned = [...new Set([...current.owned, q.item])];
          current.equipped = q.item;
          await storage.put("wallet:" + session.wallet, current);
          await storage.put("receipt:" + body.signature, {
            wallet: session.wallet,
            quote: q.id,
          });
          q.claimed = body.signature;
          await storage.put("quote:" + q.id, q);
          return json({ ...current, receipt: body.signature });
        });
      }
      return json({ error: "Unknown endpoint" }, 404);
    } catch (e) {
      return json(
        {
          error:
            e instanceof SyntaxError
              ? "Invalid JSON"
              : e.message || "Request failed",
        },
        400,
      );
    }
  }
  async alarm() {
    for (const prefix of ["nonce:", "session:", "quote:", "rate:"]) {
      const rows = await this.state.storage.list({ prefix });
      const stale = [];
      for (const [key, value] of rows) {
        const expiry =
          prefix === "rate:"
            ? value + 3600000
            : value.expires + (prefix === "quote:" ? 86400000 : 0);
        if (expiry < Date.now()) stale.push(key);
      }
      if (stale.length) await this.state.storage.delete(stale);
    }
    await this.state.storage.setAlarm(Date.now() + 3600000);
  }
}
