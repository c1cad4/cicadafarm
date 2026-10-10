import { drawBackdrop } from "./backdrop.js";
import { flag } from "../multiplayer/profile.js";
import { radius, safe } from "../multiplayer/model.js";
export function drawScene(
  ctx,
  width,
  height,
  dpr,
  world,
  identity,
  now,
  options = {},
) {
  const mapW = world.width || 1000,
    mapH = world.height || 540;
  ctx.setTransform((dpr * width) / mapW, 0, 0, (dpr * height) / mapH, 0, 0);
  const circle = (x, y, r, color) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawBackdrop(ctx, mapW, mapH);
  ctx.strokeStyle = "#24463288";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < mapW; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, mapH);
    ctx.stroke();
  }
  for (let y = 0; y < mapH; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(mapW, y);
    ctx.stroke();
  }
  const total = options.total ?? world.total ?? 0;
  const count = Math.min(48, Math.floor(total / 10));
  for (let i = 0; i < count; i++) {
    const a = i * 2.399,
      r = 105 + (i % 5) * 19,
      x = 500 + Math.cos(a) * r,
      y = 270 + Math.sin(a) * r * 0.7;
    ctx.fillStyle = "#7d6546";
    ctx.fillRect(x - 2, y, 4, 12);
    circle(x, y, 10, "#28543b");
    circle(x - 2, y - 3, 6, "#83cb70");
  }
  for (let i = 0; i < Math.min(90, Math.floor(total / 3)); i++) {
    const a = i * 2.399,
      r = 88 + (i % 7) * 15;
    circle(
      500 + Math.cos(a) * r,
      270 + Math.sin(a) * r * 0.65,
      2,
      ["#c8ff91", "#8ee5e4", "#e2a8d8"][i % 3],
    );
  }
  circle(500, 270, 75, "#20432b");
  ctx.strokeStyle = "#9edd78";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(500, 270, 75, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < Math.min(8, Math.floor(total / 100)); i++) {
    const a = (i * Math.PI) / 4;
    ctx.fillStyle = "#deb45b";
    ctx.fillRect(500 + Math.cos(a) * 50 - 5, 270 + Math.sin(a) * 50 - 5, 10, 9);
  }
  for (const h of world.homes || [{ x: 500, y: 270 }]) {
    if (h.x !== 500 || h.y !== 270) {
      circle(h.x, h.y, 75, "#20432b");
      ctx.strokeStyle = "#9edd78";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 75, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(h.x, h.y);
    // Stacked beehive with brass bands and an illuminated entrance.
    ctx.fillStyle = "#302a1d";
    ctx.fillRect(-21, 20, 42, 5);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ["#ac854a", "#c59c58", "#d8b56b"][i];
      ctx.fillRect(-18, -12 + i * 11, 36, 10);
      ctx.fillStyle = "#efd59c55";
      ctx.fillRect(-17, -12 + i * 11, 34, 2);
      ctx.fillStyle = "#775c34";
      ctx.fillRect(-18, -3 + i * 11, 36, 1);
    }
    ctx.fillStyle = "#e7cd90";
    ctx.fillRect(-22, -17, 44, 5);
    ctx.fillStyle = "#344231";
    ctx.fillRect(-7, 12, 14, 5);
    ctx.fillStyle = "#b9e793";
    ctx.fillRect(-5, 13, 10, 2);
    ctx.font = "9px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#c2ddb1";
    ctx.fillText("✦", 0, 2);
    ctx.restore();
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#d5e8b7";
    ctx.fillText(options.safeLabel || "SAFE HIVE", h.x, h.y + 97);
  }
  for (const p of world.thorns || []) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#b66b67";
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
  const colors = ["#dbeb90", "#ffc17b", "#79e4e2", "#ebafff"];
  for (const p of world.resources || []) {
    circle(p.x, p.y, p.kind === 3 ? 12 : 8, colors[p.kind] + "18");
    circle(p.x, p.y, p.kind === 3 ? 5 : 3.5, colors[p.kind]);
    if (p.kind === 3) {
      ctx.strokeStyle = "#f1c1ff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 + Math.sin(now * 0.002) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const own = (world.players || []).find((p) => p.id === identity);
  for (let i = 0; i < (own?.cargo || 0); i++) {
    const p = options.trail?.[Math.min(options.trail.length - 1, (i + 1) * 5)];
    if (p) circle(p.x, p.y, 3, colors[i % 4]);
  }
  for (const p of [...(world.players || [])].sort(
    (a, b) => (a.mass || 20) - (b.mass || 20),
  )) {
    const r = radius(p.mass),
      size = r / 10,
      color = p.color || "#c8ff91";
    if (p.id === identity) {
      circle(p.x, p.y, r + 7, color + "16");
      ctx.strokeStyle = color + "55";
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.shield > 0 || safe(p, world.homes)) {
      ctx.strokeStyle = "#8adfe277";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle || 0);
    ctx.scale(size, size);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(-2, side * 7, 11, 5, side * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(7, 0, 3, "#efffe7");
    ctx.restore();
    if (p.cosmetic === "halo") {
      ctx.strokeStyle = "#d9b4ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.cosmetic === "crown") {
      ctx.font = "20px system-ui";
      ctx.fillText("♛", p.x, p.y - r - 28);
    }
    if (p.cosmetic === "orbit") {
      for (let i = 0; i < 3; i++) {
        const a = now * 0.001 + i * 2.094;
        circle(
          p.x + Math.cos(a) * (r + 18),
          p.y + Math.sin(a) * (r + 18),
          3,
          ["#ffc17b", "#79e4e2", "#ebafff"][i],
        );
      }
    }
    if (p.cosmetic === "banner" && p.country) {
      ctx.font = "20px system-ui";
      ctx.fillText(flag(p.country), p.x + r + 20, p.y);
    }
    if (p.country) {
      ctx.fillStyle = "#07150fcc";
      ctx.fillRect(p.x - 11, p.y - 8, 22, 16);
      ctx.font = `${Math.max(12, Math.min(24, r * 0.8))}px system-ui`;
      ctx.textBaseline = "middle";
      ctx.fillText(flag(p.country), p.x, p.y);
      ctx.textBaseline = "alphabetic";
    }
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#ebfff2";
    ctx.fillText(
      (p.name || "Cicada") + (p.agent ? " [AI]" : ""),
      p.x,
      p.y - r - 15,
    );
    ctx.font = "9px system-ui";
    ctx.fillStyle = color;
    ctx.fillText(String(Math.round(p.mass || 20)), p.x, p.y + r + 16);
  }
  const weather = Math.floor((world.elapsed || 0) / 45) % 4;
  if (weather === 1) {
    ctx.strokeStyle = "#9bd9ed44";
    ctx.lineWidth = 1;
    for (let i = 0; i < 35; i++) {
      const x = (i * 77 + now * 0.04) % 1000,
        y = (i * 113 + now * 0.17) % 540;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 12);
      ctx.stroke();
    }
  }
  if (weather === 3) {
    ctx.fillStyle = "#b7852910";
    ctx.fillRect(0, 0, mapW, mapH);
  }
  if (options.target) {
    ctx.strokeStyle = "#d4ff8155";
    ctx.beginPath();
    ctx.arc(options.target.x, options.target.y, 8, 0, 7);
    ctx.stroke();
  }
}
