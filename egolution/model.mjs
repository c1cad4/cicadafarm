export const COSTS = [24, 30, 36, 42, 48, 54, 80];
export const SIZE = 1800;
const finite = (v, min, max, fallback) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
export function restore(raw) {
  let v;
  try {
    v = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    v = null;
  }
  if (!v || v.version !== 1)
    return { version: 1, stage: 0, energy: 0, cycles: 0, traits: [], total: 0 };
  const stage = Math.floor(finite(v.stage, 0, 6, 0));
  return {
    version: 1,
    stage,
    energy: Math.floor(finite(v.energy, 0, COSTS[stage], 0)),
    cycles: Math.floor(finite(v.cycles, 0, 1000000, 0)),
    traits: Array.isArray(v.traits)
      ? v.traits
          .slice(0, stage)
          .map((t) =>
            ["speed", "shield", "magnet"].includes(t) ? t : "shield",
          )
      : [],
    total: Math.floor(finite(v.total, 0, 1e9, 0)),
  };
}
export class Journey {
  constructor(save, random = Math.random) {
    this.save = restore(save);
    this.random = random;
    this.x = SIZE / 2;
    this.y = SIZE / 2;
    this.invincible = 0;
    this.ready =
      this.save.stage < 6 && this.save.energy >= COSTS[this.save.stage];
    this.resources = Array.from({ length: 240 }, () => this.spawn());
    this.hazards = Array.from({ length: 12 }, () => this.spawn());
    this.time = 0;
  }
  spawn() {
    return {
      x: 60 + this.random() * (SIZE - 120),
      y: 60 + this.random() * (SIZE - 120),
      phase: this.random() * Math.PI * 2,
    };
  }
  counts(t) {
    return this.save.traits.filter((x) => x === t).length;
  }
  step(dt, dx, dy) {
    if (this.ready) return { collected: 0, hit: false };
    dt = finite(dt, 0, 0.05, 0);
    dx = finite(dx, -1, 1, 0);
    dy = finite(dy, -1, 1, 0);
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    const speed = 185 + this.counts("speed") * 25;
    this.x = finite(this.x + dx * speed * dt, 25, SIZE - 25, SIZE / 2);
    this.y = finite(this.y + dy * speed * dt, 25, SIZE - 25, SIZE / 2);
    this.time += dt;
    this.invincible = Math.max(0, this.invincible - dt);
    let collected = 0,
      hit = false;
    const radius = 28 + this.counts("magnet") * 9;
    for (let i = 0; i < this.resources.length; i++) {
      const r = this.resources[i];
      if (Math.hypot(r.x - this.x, r.y - this.y) < radius) {
        this.resources[i] = this.spawn();
        collected++;
      }
    }
    this.save.energy = Math.min(
      COSTS[this.save.stage],
      this.save.energy + collected,
    );
    this.save.total += collected;
    if (this.save.stage < 6 && this.save.energy >= COSTS[this.save.stage])
      this.ready = true;
    if (
      !this.ready &&
      !this.invincible &&
      this.hazards.some((r) => Math.hypot(r.x - this.x, r.y - this.y) < 32)
    ) {
      this.save.energy = Math.max(
        0,
        this.save.energy - Math.max(1, 4 - this.counts("shield")),
      );
      this.invincible = 2.5;
      hit = true;
    }
    return { collected, hit };
  }
  evolve(trait) {
    if (
      !this.ready ||
      this.save.stage >= 6 ||
      !["speed", "shield", "magnet"].includes(trait)
    )
      return false;
    this.save.traits.push(trait);
    this.save.stage++;
    this.save.energy = 0;
    this.ready = false;
    this.invincible = 3;
    return true;
  }
  rebirth() {
    if (this.save.stage !== 6 || this.save.energy < COSTS[6]) return false;
    const cycles = this.save.cycles + 1,
      total = this.save.total;
    this.save = restore(null);
    Object.assign(this.save, { cycles, total });
    this.ready = false;
    this.invincible = 3;
    return true;
  }
}
