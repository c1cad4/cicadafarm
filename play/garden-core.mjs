export function seeded(label) {
  let n = 2166136261;
  for (const c of label) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => {
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };
}
export const day = (date = new Date()) => date.toISOString().slice(0, 10);
export function readGarden(raw) {
  let v;
  try {
    v = JSON.parse(raw);
  } catch {}
  const count = (x) => (Number.isSafeInteger(x) && x >= 0 && x <= 1e9 ? x : 0);
  return {
    missions: count(v?.missions),
    daily: {
      date: /^\d{4}-\d{2}-\d{2}$/.test(v?.daily?.date || "")
        ? v.daily.date
        : "",
      best: Math.min(10000, count(v?.daily?.best)),
    },
  };
}
export function objectives(p) {
  return [
    Math.min(40, p.score),
    Math.min(3, p.deliveries),
    Math.min(3, p.rare),
  ];
}
export function garden(total) {
  return {
    trees: Math.min(48, Math.floor(total / 10)),
    flowers: Math.min(90, Math.floor(total / 3)),
    hives: Math.min(8, Math.floor(total / 100)),
  };
}
