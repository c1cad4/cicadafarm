export const COSTS = [24, 30, 36, 42, 48, 54, 80];
export const SIZE = 1800;
export const GOALS = [3, 3, 3, 1, 3, 3, 3];
export function weather(time) {
  const phase = ((time % 60) + 60) % 60;
  return {
    kind: phase < 30 ? "calm" : phase < 45 ? "aurora" : "storm",
    remaining: Math.ceil((phase < 30 ? 30 : phase < 45 ? 45 : 60) - phase),
  };
}
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
    return {
      version: 1,
      stage: 0,
      energy: 0,
      cycles: 0,
      traits: [],
      total: 0,
      objective: 0,
    };
  const stage = Math.floor(finite(v.stage, 0, 6, 0));
  return {
    version: 1,
    stage,
    objective: Math.floor(
      finite(
        v.objective,
        0,
        GOALS[stage],
        Number.isFinite(v.energy) && v.energy >= COSTS[stage]
          ? GOALS[stage]
          : 0,
      ),
    ),
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
    this.ready = this.save.stage < 6 && this.finished();
    this.resources = Array.from({ length: 240 }, () => this.spawn());
    this.hazards = Array.from({ length: 12 }, () => this.spawn());
    this.time = 0;
    this.warmth = 0;
    this.boostLeft = 0;
    this.cooldown = 0;
    this.resetBeacons();
  }
  resetBeacons() {
    this.warmth = 0;
    this.beacons = Array.from({ length: GOALS[this.save.stage] }, (_, i) => {
      const angle = this.save.stage * 0.7 + (i * Math.PI * 2) / 3;
      return {
        x: SIZE / 2 + Math.cos(angle) * 310,
        y: SIZE / 2 + Math.sin(angle) * 310,
        index: i,
      };
    });
  }
  finished() {
    return (
      this.save.energy >= COSTS[this.save.stage] &&
      this.save.objective >= GOALS[this.save.stage]
    );
  }
  boost() {
    if (this.ready || this.cooldown > 0) return false;
    this.boostLeft = 0.8;
    this.cooldown = 6;
    return true;
  }
  target() {
    const b = this.beacons[this.save.objective];
    if (!b) return null;
    if (this.save.stage !== 4) return b;
    return {
      ...b,
      x: b.x + Math.cos(this.time * 0.7 + b.index) * 70,
      y: b.y + Math.sin(this.time * 0.7 + b.index) * 70,
    };
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
    this.boostLeft = Math.max(0, this.boostLeft - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    const speed =
      (185 + this.counts("speed") * 25) * (this.boostLeft > 0 ? 2.2 : 1);
    this.x = finite(this.x + dx * speed * dt, 25, SIZE - 25, SIZE / 2);
    this.y = finite(this.y + dy * speed * dt, 25, SIZE - 25, SIZE / 2);
    this.time += dt;
    this.invincible = Math.max(0, this.invincible - dt);
    let collected = 0,
      hit = false,
      objective = false;
    const radius = 28 + this.counts("magnet") * 9;
    for (let i = 0; i < this.resources.length; i++) {
      const r = this.resources[i];
      if (Math.hypot(r.x - this.x, r.y - this.y) < radius) {
        this.resources[i] = this.spawn();
        collected++;
      }
    }
    const event = weather(this.time);
    if (event.kind === "aurora") collected *= 2;
    const target = this.target();
    if (
      target &&
      Math.hypot(target.x - this.x, target.y - this.y) <
        (this.save.stage === 4 ? 35 : 52)
    ) {
      const moving = Math.hypot(dx, dy) > 0.15;
      if (this.save.stage === 3) this.warmth = moving ? 0 : this.warmth + dt;
      const cost =
        this.save.stage === 1
          ? 4
          : this.save.stage === 2
            ? 6
            : this.save.stage === 6
              ? 5
              : 0;
      if (
        (this.save.stage !== 3 || this.warmth >= 3) &&
        this.save.energy >= cost
      ) {
        this.save.energy -= cost;
        this.save.objective++;
        this.warmth = 0;
        objective = true;
        if (this.save.stage === 0) collected += 3;
      }
    } else this.warmth = 0;
    this.save.energy = Math.min(
      COSTS[this.save.stage],
      this.save.energy + collected,
    );
    this.save.total += collected;
    if (this.save.stage < 6 && this.finished()) this.ready = true;
    if (
      !this.ready &&
      !this.invincible &&
      this.hazards.some((r) => Math.hypot(r.x - this.x, r.y - this.y) < 32)
    ) {
      this.save.energy = Math.max(
        0,
        this.save.energy -
          Math.max(1, (event.kind === "storm" ? 5 : 4) - this.counts("shield")),
      );
      this.invincible = 2.5;
      hit = true;
    }
    return { collected, hit, objective };
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
    this.save.objective = 0;
    this.resetBeacons();
    this.ready = false;
    this.invincible = 3;
    return true;
  }
  rebirth() {
    if (this.save.stage !== 6 || !this.finished()) return false;
    const cycles = this.save.cycles + 1,
      total = this.save.total;
    this.save = restore(null);
    Object.assign(this.save, { cycles, total });
    this.resetBeacons();
    this.boostLeft = 0;
    this.cooldown = 0;
    this.ready = false;
    this.invincible = 3;
    return true;
  }
}
