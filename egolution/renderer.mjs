import { SIZE } from "./model.mjs";
const COLORS = [
  "#97c7ff",
  "#b9a4ff",
  "#66efd0",
  "#ffdfa7",
  "#94e4ff",
  "#c6a0ff",
  "#66ffb3",
];
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.width = 0;
    this.height = 0;
    this.stars = Array.from({ length: 130 }, (_, i) => ({
      x: ((i * 7919) % 1000) / 1000,
      y: ((i * 3571) % 1000) / 1000,
      r: 1 + (i % 3) * 0.4,
    }));
    this.resize();
  }
  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    const dpr = Math.min(
      devicePixelRatio || 1,
      1.5,
      Math.sqrt(1800000 / (this.width * this.height)),
    );
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  draw(journey, shell = null, bigBang = 0, preview = null) {
    const c = this.ctx,
      w = this.width,
      h = this.height,
      s = journey.save.stage,
      time = journey.time,
      color = COLORS[s];
    c.fillStyle = "#060b13";
    c.fillRect(0, 0, w, h);
    const light = c.createRadialGradient(
      w * 0.5,
      h * 0.55,
      0,
      w * 0.5,
      h * 0.55,
      Math.max(w, h) * 0.65,
    );
    light.addColorStop(
      0,
      [
        "#111d34",
        "#1f1732",
        "#10272a",
        "#27211b",
        "#10282e",
        "#1d1730",
        "#102b22",
      ][s],
    );
    light.addColorStop(1, "#060b13");
    c.fillStyle = light;
    c.fillRect(0, 0, w, h);
    for (const star of this.stars) {
      c.globalAlpha = 0.2 + 0.3 * Math.sin(time * 0.25 + star.x * 9) ** 2;
      c.fillStyle = color;
      c.beginPath();
      c.arc(
        (star.x * w - journey.x * 0.025 + w) % w,
        (star.y * h - journey.y * 0.025 + h) % h,
        star.r,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    c.globalAlpha = 1;
    const zoom = Math.min(1, Math.max(0.65, Math.min(w, h) / 700)),
      cx = w / 2,
      cy = h / 2 + 30,
      screen = (r) => ({
        x: cx + (r.x - journey.x) * zoom,
        y: cy + (r.y - journey.y) * zoom,
      });
    c.strokeStyle = "#7eafba18";
    c.lineWidth = 1;
    const startX = cx - journey.x * zoom,
      startY = cy - journey.y * zoom;
    c.strokeRect(startX, startY, SIZE * zoom, SIZE * zoom);
    for (const r of journey.resources) {
      const p = screen(r);
      if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) continue;
      c.fillStyle = color;
      c.globalAlpha = 0.65 + 0.25 * Math.sin(time * 1.5 + r.phase);
      c.beginPath();
      c.arc(p.x, p.y, 3.5 * zoom, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.15;
      c.beginPath();
      c.arc(p.x, p.y, 9 * zoom, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    for (const r of journey.hazards) {
      const p = screen(r);
      if (p.x < -25 || p.x > w + 25 || p.y < -25 || p.y > h + 25) continue;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(time * 0.2 + r.phase);
      c.strokeStyle = "#ed63877c";
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3,
          x = Math.cos(a) * 13 * zoom,
          y = Math.sin(a) * 13 * zoom;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
      c.stroke();
      c.restore();
    }
    c.save();
    c.translate(cx, cy);
    c.scale(zoom, zoom);
    if (journey.invincible > 0)
      c.globalAlpha = 0.6 + 0.4 * Math.sin(time * 12) ** 2;
    this.form(s, color, time, shell);
    c.restore();
    if (bigBang > 0) {
      c.strokeStyle = `rgba(174,236,255,${Math.max(0, 1 - bigBang / 2)})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cx, cy, bigBang * 300, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 50; i++) {
        const a = i * 2.39996,
          r = bigBang * (80 + (i % 9) * 30);
        c.fillStyle = color;
        c.globalAlpha = Math.max(0, 1 - bigBang / 2);
        c.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 3);
      }
      c.globalAlpha = 1;
    }
    if (preview) {
      c.save();
      c.translate(w / 2, h / 2);
      c.scale(2.5, 2.5);
      this.form(6, "#66ffb3", time, preview);
      c.restore();
    }
  }
  form(stage, color, time, shell) {
    const c = this.ctx;
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 2;
    const pulse = 1 + Math.sin(time * 1.5) * 0.05;
    c.scale(pulse, pulse);
    const glow = (r) => {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, color + "bb");
      g.addColorStop(0.35, color + "44");
      g.addColorStop(1, color + "00");
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = color;
    };
    glow(60);
    if (stage === 0) {
      c.rotate(time * 0.25);
      for (let i = 0; i < 8; i++) {
        c.rotate(Math.PI / 4);
        c.beginPath();
        c.moveTo(7, 0);
        c.lineTo(30, i % 2 ? 0 : 4);
        c.stroke();
      }
      c.beginPath();
      c.arc(0, 0, 8, 0, 7);
      c.fill();
    } else if (stage === 1) {
      const nodes = [
        [0, 0],
        [-25, -15],
        [25, -15],
        [0, 28],
      ];
      for (const [x, y] of nodes) {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(x, y);
        c.stroke();
        c.beginPath();
        c.arc(x, y, 8, 0, 7);
        c.fill();
      }
    } else if (stage === 2) {
      c.fillStyle = color + "22";
      c.beginPath();
      c.ellipse(0, 0, 35, 29 + Math.sin(time) * 3, time * 0.05, 0, 7);
      c.fill();
      c.stroke();
      for (let i = 0; i < 5; i++) {
        c.fillStyle = color;
        c.beginPath();
        c.arc(
          Math.cos(i * 2 + time * 0.15) * 20,
          Math.sin(i * 2 + time * 0.15) * 17,
          i ? 3 : 8,
          0,
          7,
        );
        c.fill();
      }
    } else if (stage === 3) {
      c.fillStyle = color + "22";
      c.beginPath();
      c.ellipse(0, 0, 25, 35, 0, 0, 7);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(-16, -8);
      c.lineTo(-3, 1);
      c.lineTo(6, -6);
      c.lineTo(18, 7);
      c.stroke();
      c.fillStyle = color;
      c.beginPath();
      c.arc(0, 8, 6, 0, 7);
      c.fill();
    } else if (stage === 4) {
      for (const side of [-1, 1]) {
        c.fillStyle = color + "33";
        c.beginPath();
        c.ellipse(side * 25, -5, 28, 12, side * Math.sin(time * 7) * 0.4, 0, 7);
        c.fill();
        c.stroke();
      }
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(0, 4, 9, 25, 0, 0, 7);
      c.fill();
      c.beginPath();
      c.arc(0, -22, 10, 0, 7);
      c.fill();
    } else if (stage === 5) {
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7 + time * 0.2,
          x = Math.cos(a) * 32,
          y = Math.sin(a) * 32;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(x, y);
        c.stroke();
        c.beginPath();
        c.arc(x, y, 4, 0, 7);
        c.fill();
      }
      c.beginPath();
      c.arc(0, 0, 18, 0, 7);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, 7, 0, 7);
      c.fill();
    } else {
      const rim =
        shell === "galaxy"
          ? "#ae8cff"
          : shell === "mist"
            ? "#89f2ec"
            : shell === "glass"
              ? "#e4faff"
              : "#c2ffff";
      c.fillStyle = rim + "14";
      c.strokeStyle = rim;
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(0, 0, 52, 29, Math.sin(time * 0.2) * 0.04, 0, 7);
      c.fill();
      c.stroke();
      c.strokeStyle = rim + "55";
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(0, 0, 48, 25, -0.05, 0, 7);
      c.stroke();
      c.fillStyle = "#69ffbc";
      c.beginPath();
      c.arc(0, 0, 10, 0, 7);
      c.fill();
      c.fillStyle = "#effff5";
      c.beginPath();
      c.arc(0, 0, 4, 0, 7);
      c.fill();
      if (shell)
        for (let i = 0; i < 18; i++) {
          const a = i * 2.4 + time * 0.12,
            r = 12 + (i % 5) * 6;
          c.fillStyle = i % 2 ? rim : "#74ffc0";
          c.globalAlpha = 0.6;
          c.fillRect(Math.cos(a) * r, Math.sin(a) * r * 0.5, 1.5, 1.5);
        }
      c.globalAlpha = 1;
    }
  }
}
