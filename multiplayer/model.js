import { appearance } from "./profile.js";
export const WIDTH = 1000,
  HEIGHT = 540,
  CAPACITY = 12;
export function name(value) {
  return typeof value === "string"
    ? value
        .replace(/[\p{C}<>]/gu, "")
        .trim()
        .slice(0, 20) || "Cicada"
    : "Cicada";
}
export const radius = (mass) =>
  10 + Math.sqrt(Math.max(0, Math.min(2000, mass || 20) - 20)) * 1.3;
export const safe = (p) => Math.hypot(p.x - 500, p.y - 270) < 75;
export class World {
  constructor(random = Math.random) {
    this.random = random;
    this.players = new Map();
    this.reset();
  }
  reset() {
    this.elapsed = 0;
    this.total = 0;
    this.resources = [];
    this.spawn = 0;
    this.thorns = Array.from({ length: 7 }, (_, i) => ({
      x: 500 + Math.cos((i * 2 * Math.PI) / 7) * 330,
      y: 270 + Math.sin((i * 2 * Math.PI) / 7) * 150,
    }));
    for (let i = 0; i < 65; i++) this.seed(i % 9 === 0 ? 3 : undefined);
    for (const p of this.players.values()) this.respawn(p, true);
  }
  respawn(p, round = false) {
    Object.assign(p, {
      x: 500,
      y: 270,
      cargo: 0,
      rareCargo: 0,
      mass: 20,
      hit: 0,
      shield: 5,
      input: null,
      angle: 0,
    });
    if (round)
      Object.assign(p, {
        score: 0,
        deliveries: 0,
        rare: 0,
        absorbed: 0,
        respawns: 0,
        peak: 20,
      });
    else p.respawns++;
  }
  seed(kind) {
    if (kind === undefined)
      kind = this.random() < 0.09 ? 3 : Math.floor(this.random() * 3);
    let p;
    for (let i = 0; i < 40; i++) {
      if (kind === 3) {
        const a = this.random() * Math.PI * 2;
        p = { x: 500 + Math.cos(a) * 410, y: 270 + Math.sin(a) * 175, kind };
      } else
        p = { x: 25 + this.random() * 950, y: 115 + this.random() * 355, kind };
      if (
        Math.hypot(p.x - 500, p.y - 270) > 95 &&
        this.thorns.every((t) => Math.hypot(t.x - p.x, t.y - p.y) > 25)
      )
        break;
    }
    this.resources.push(p);
  }
  join(id, nick, style = {}) {
    if (this.players.has(id)) {
      const p = this.players.get(id);
      p.name = name(nick);
      Object.assign(p, appearance(style));
      return p;
    }
    if (this.players.size >= CAPACITY) return null;
    const p = { id, name: name(nick), ...appearance(style) };
    this.players.set(id, p);
    this.respawn(p, true);
    return p;
  }
  input(id, data) {
    const p = this.players.get(id);
    if (!p) return;
    if (data === null) {
      p.input = null;
      return;
    }
    if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
    p.input = {
      x: Math.max(13, Math.min(987, data.x)),
      y: Math.max(115, Math.min(485, data.y)),
    };
  }
  step(dt) {
    dt = Math.min(0.1, Math.max(0, dt));
    this.elapsed += dt;
    if (this.elapsed >= 190) {
      this.reset();
      return;
    }
    if (this.elapsed >= 180) return;
    const weather = Math.floor(this.elapsed / 45);
    for (const p of this.players.values()) {
      p.hit = Math.max(0, p.hit - dt);
      p.shield = Math.max(0, p.shield - dt);
      if (p.input) {
        const dx = p.input.x - p.x,
          dy = p.input.y - p.y,
          d = Math.hypot(dx, dy);
        const speed =
          Math.max(
            65,
            (weather === 3 ? 105 : 145) / (1 + (p.mass - 20) * 0.003),
          ) -
          p.cargo * 0.4;
        if (d > 3) {
          p.angle = Math.atan2(dy, dx);
          const step = Math.min(d, speed * dt);
          p.x += (dx / d) * step;
          p.y += (dy / d) * step;
        }
      }
      if (weather === 2)
        p.x = Math.max(
          13,
          Math.min(987, p.x + Math.sin(this.elapsed * 0.8) * 18 * dt),
        );
      for (let i = this.resources.length - 1; i >= 0; i--) {
        const r = this.resources[i];
        if (Math.hypot(p.x - r.x, p.y - r.y) < radius(p.mass) + 7) {
          this.resources.splice(i, 1);
          p.mass = Math.min(2000, p.mass + (r.kind === 3 ? 5 : 1));
          if (p.cargo < 20) {
            p.cargo++;
            if (r.kind === 3) p.rareCargo++;
          }
        }
      }
      p.peak = Math.max(p.peak, p.mass);
      if (p.cargo && Math.hypot(p.x - 500, p.y - 270) < 57) {
        const n = p.cargo + p.rareCargo * 4;
        p.score += n;
        this.total += n;
        p.deliveries++;
        p.rare += p.rareCargo;
        p.cargo = p.rareCargo = 0;
      }
      if (
        !p.hit &&
        this.thorns.some(
          (q) => Math.hypot(p.x - q.x, p.y - q.y) < radius(p.mass) + 10,
        )
      ) {
        p.cargo = Math.max(0, p.cargo - 5);
        p.rareCargo = Math.min(p.rareCargo, p.cargo);
        p.mass = Math.max(20, p.mass - 8);
        p.hit = 1.5;
      }
    }
    const ordered = [...this.players.values()].sort((a, b) => b.mass - a.mass);
    for (const p of ordered)
      for (const q of ordered) {
        if (
          p === q ||
          p.shield ||
          q.shield ||
          safe(p) ||
          safe(q) ||
          p.mass < q.mass * 1.25
        )
          continue;
        if (
          Math.hypot(p.x - q.x, p.y - q.y) <
          radius(p.mass) - radius(q.mass) * 0.35
        ) {
          const free = 20 - p.cargo;
          p.cargo += Math.min(free, q.cargo);
          p.rareCargo += Math.min(free, q.rareCargo);
          p.mass = Math.min(2000, p.mass + Math.max(0, q.mass - 20) * 0.7);
          p.peak = Math.max(p.peak, p.mass);
          p.absorbed++;
          this.respawn(q);
        }
      }
    this.spawn += dt;
    if (this.spawn > (weather === 1 ? 0.12 : weather === 3 ? 0.7 : 0.32)) {
      this.spawn = 0;
      if (this.resources.length < 85) this.seed();
    }
  }
  snapshot() {
    return {
      type: "world",
      elapsed: this.elapsed,
      total: this.total,
      players: [...this.players.values()].map(({ input, hit, ...p }) => p),
      resources: this.resources,
      thorns: this.thorns,
    };
  }
}
