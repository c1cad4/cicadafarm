// The creator's Robotcyb image stays intact. Composite once per map size;
// each frame reuses a small texture instead of applying live blur/filter work.
const art = new Image();
art.decoding = "async";
art.src = new URL("./robotcyb-field.png", import.meta.url).href;
let cached = null,
  size = "";
art.onload = () => {
  cached = null;
};
export function drawBackdrop(ctx, width, height) {
  const key = width + "x" + height;
  if (!cached || size !== key) {
    size = key;
    cached = document.createElement("canvas");
    cached.width = width;
    cached.height = height;
    const b = cached.getContext("2d");
    b.fillStyle = "#071811";
    b.fillRect(0, 0, width, height);
    const glow = b.createRadialGradient(
      width / 2,
      height * 0.52,
      20,
      width / 2,
      height * 0.52,
      height * 0.65,
    );
    glow.addColorStop(0, "#12372f");
    glow.addColorStop(1, "#071811");
    b.fillStyle = glow;
    b.fillRect(0, 0, width, height);
    if (art.complete && art.naturalWidth) {
      const ratio = Math.min(
          (width * 0.98) / art.naturalWidth,
          (height * 1.1) / art.naturalHeight,
        ),
        w = art.naturalWidth * ratio,
        h = art.naturalHeight * ratio;
      b.globalCompositeOperation = "screen";
      b.globalAlpha = 0.16;
      b.drawImage(art, (width - w) / 2, (height - h) / 2, w, h);
      b.globalAlpha = 1;
      b.globalCompositeOperation = "source-over";
    }
    const colours = ["#9ccdc7", "#75b3c4", "#c5b198"];
    for (let i = 0; i < 100; i++) {
      const x = (((i * 7919 + 37) % 997) / 997) * width,
        y = (((i * 3571 + 83) % 991) / 991) * height;
      b.globalAlpha = 0.14 + (i % 4) * 0.04;
      b.fillStyle = colours[i % 3];
      b.beginPath();
      b.arc(x, y, i % 9 === 0 ? 1.2 : 0.65, 0, Math.PI * 2);
      b.fill();
    }
    b.globalAlpha = 1;
  }
  ctx.drawImage(cached, 0, 0, width, height);
}
