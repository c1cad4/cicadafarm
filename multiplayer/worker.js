import { World, name } from "./model.js";
import { cleanChat } from "./commerce.js";
export { Accounts } from "./accounts.js";
const allowed = new Set([
  "https://cicadafarm.pages.dev",
  "https://cicadafarm-game.pages.dev",
  "https://c1cad4.github.io",
  "http://127.0.0.1:8767",
]);
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health")
      return Response.json(
        {
          service: "CicadaFarm Swarm",
          capacity: 12,
          rooms: 20,
          rules: "swarm-social-v3",
          checkoutConfigured: !!env.SOLANA_RPC_URL,
          currencies: ["SOL", "CICADAFARM", "ROBOTCYB"],
          agentProtocol: "/agents.json",
        },
        { headers: { "Access-Control-Allow-Origin": "*" } },
      );
    if (url.pathname === "/agents.json")
      return Response.json({
        protocol: "swarm-v3",
        socket:
          "wss://cicadafarm-swarm.dmitry-suh.workers.dev/?room=1&session=UUID&name=Agent&agent=1",
        input: { type: "input", target: { x: 500, y: 270 } },
        rate: 10,
        world: ["width", "height", "homes", "players", "resources"],
        rules:
          "Server-authoritative, 12 players/room, 20 rooms. Agents are visibly labelled. Chat requires a signed wallet session. Agents may not purchase automatically.",
      });
    if (url.pathname.startsWith("/api/")) {
      const origin = request.headers.get("Origin");
      if (!allowed.has(origin))
        return new Response("Origin denied", { status: 403 });
      if (request.method === "OPTIONS")
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            Vary: "Origin",
          },
        });
      if (!["POST", "GET"].includes(request.method))
        return new Response("Method denied", { status: 405 });
      const response = await env.ACCOUNTS.get(
        env.ACCOUNTS.idFromName("accounts"),
      ).fetch(request);
      const out = new Response(response.body, response);
      out.headers.set("Access-Control-Allow-Origin", origin);
      out.headers.set("Cache-Control", "no-store");
      out.headers.set("Vary", "Origin");
      return out;
    }
    if (
      !allowed.has(request.headers.get("Origin")) &&
      !(url.searchParams.get("agent") === "1" && !request.headers.get("Origin"))
    )
      return new Response("Origin denied", { status: 403 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
      return new Response("WebSocket required", { status: 426 });
    const room = url.searchParams.get("room") || "1";
    if (!/^(?:[1-9]|1[0-9]|20)$/.test(room))
      return new Response("Invalid room", { status: 400 });
    return env.GARDENS.get(env.GARDENS.idFromName(room)).fetch(request);
  },
};
export class Garden {
  constructor(state, env) {
    this.env = env;
    this.chat = [];
    this.chatRates = new Map();
    this.state = state;
    this.world = new World(Math.random, { dynamic: true });
    this.connections = new Map();
    this.detached = new Map();
    this.timer = null;
  }
  async fetch(request) {
    for (const [id, time] of this.detached)
      if (Date.now() - time > 30000) {
        this.detached.delete(id);
        this.world.players.delete(id);
      }
    const u = new URL(request.url),
      token = u.searchParams.get("session");
    if (!/^[a-f0-9-]{36}$/.test(token || ""))
      return new Response("Invalid session", { status: 400 });
    const p = this.world.join(token, name(u.searchParams.get("name")), {
      country: u.searchParams.get("country"),
      color: u.searchParams.get("color"),
    });
    if (p) {
      p.agent = u.searchParams.get("agent") === "1";
      p.cosmetic = null;
    }
    if (!p) return new Response("Room full", { status: 409 });
    if (p.id === token) p.id = crypto.randomUUID();
    const old = this.connections.get(token);
    if (old) {
      old.ws.close(1000, "Reconnected");
      this.connections.delete(token);
    }
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    const entry = {
      ws: server,
      messages: 0,
      window: Date.now(),
      lastInput: Date.now(),
      wallet: null,
      lastChat: 0,
      authExpires: 0,
      authenticating: false,
    };
    this.connections.set(token, entry);
    this.detached.delete(token);
    server.addEventListener("message", async (event) => {
      if (typeof event.data !== "string" || event.data.length > 1000) {
        server.close(1008, "Invalid input");
        return;
      }
      const now = Date.now();
      entry.lastInput = now;
      if (now - entry.window >= 1000) {
        entry.window = now;
        entry.messages = 0;
      }
      if (++entry.messages > 25) {
        server.close(1008, "Too many inputs");
        return;
      }
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "input") this.world.input(token, msg.target);
        if (
          msg.type === "auth" &&
          !entry.authenticating &&
          typeof msg.token === "string" &&
          /^[a-f0-9-]{72}$/.test(msg.token)
        ) {
          entry.authenticating = true;
          try {
            const r = await this.env.ACCOUNTS.get(
              this.env.ACCOUNTS.idFromName("accounts"),
            ).fetch(
              new Request("https://internal/internal/session", {
                headers: { Authorization: "Bearer " + msg.token },
              }),
            );
            const auth = await r.json();
            if (this.connections.get(token) !== entry) return;
            if (!r.ok) {
              entry.wallet = null;
              entry.authExpires = 0;
              p.cosmetic = null;
              server.send(
                JSON.stringify({
                  type: "chat-error",
                  error: "Wallet session expired",
                }),
              );
              return;
            }
            entry.wallet = auth.wallet;
            entry.authExpires = auth.expires;
            p.cosmetic = auth.equipped;
            server.send(
              JSON.stringify({ type: "authenticated", wallet: auth.wallet }),
            );
          } finally {
            entry.authenticating = false;
          }
        }
        if (msg.type === "chat") {
          if (!entry.wallet || entry.authExpires < Date.now()) {
            server.send(
              JSON.stringify({
                type: "chat-error",
                error: "Sign in with a wallet to chat",
              }),
            );
            return;
          }
          if (now - (this.chatRates.get(entry.wallet) || 0) < 3000) {
            server.send(
              JSON.stringify({
                type: "chat-error",
                error: "Please wait 3 seconds between messages",
              }),
            );
            return;
          }
          const text = cleanChat(msg.text);
          if (!text) return;
          entry.lastChat = now;
          this.chatRates.set(entry.wallet, now);
          for (const [wallet, time] of this.chatRates)
            if (now - time > 60000) this.chatRates.delete(wallet);
          const message = {
            id: crypto.randomUUID(),
            name: p.name,
            agent: p.agent,
            text,
            time: now,
          };
          this.chat.push(message);
          this.chat = this.chat.slice(-40);
          this.sendAll({ type: "chat", message });
        }
        if (msg.type === "logout") {
          entry.wallet = null;
          entry.authExpires = 0;
          p.cosmetic = null;
        }
      } catch {
        server.close(1008, "Invalid JSON");
      }
    });
    const cleanup = () => {
      if (this.connections.get(token) !== entry) return;
      this.connections.delete(token);
      this.world.input(token, null);
      this.detached.set(token, Date.now());
      if (!this.connections.size) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);
    server.send(JSON.stringify({ type: "welcome", id: p.id }));
    server.send(JSON.stringify({ type: "chat-history", messages: this.chat }));
    this.broadcast();
    if (!this.timer) this.timer = setInterval(() => this.tick(), 100);
    return new Response(null, { status: 101, webSocket: client });
  }
  tick() {
    const now = Date.now();
    for (const { ws, lastInput } of this.connections.values())
      if (now - lastInput > 60000) ws.close(1000, "Idle");
    for (const [id, time] of this.detached)
      if (now - time > 30000) {
        this.detached.delete(id);
        this.world.players.delete(id);
      }
    this.world.step(0.1);
    this.broadcast();
  }
  sendAll(data) {
    const text = JSON.stringify(data);
    for (const { ws } of this.connections.values())
      try {
        ws.send(text);
      } catch {}
  }
  broadcast() {
    const msg = JSON.stringify(this.world.snapshot());
    for (const { ws } of this.connections.values())
      try {
        ws.send(msg);
      } catch {}
  }
}
