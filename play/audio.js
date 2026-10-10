// Generated locally, no audio downloads, starts only after an explicit click.
let context,
  enabled = false,
  last = 0;
export function sound(kind) {
  if (!enabled || document.hidden || performance.now() - last < 90) return;
  last = performance.now();
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume();
    const patterns = {
      pollen: [660, 880],
      bank: [392, 494, 587, 784],
      absorb: [180, 320, 520],
      respawn: [480, 240, 120],
      join: [330, 440, 660],
      chat: [740, 620],
    };
    for (const [i, f] of (patterns[kind] || patterns.pollen).entries()) {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        at = context.currentTime + i * 0.07;
      oscillator.type = kind === "respawn" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(f, at);
      oscillator.frequency.exponentialRampToValueAtTime(
        f * (kind === "absorb" ? 1.6 : 1.05),
        at + 0.09,
      );
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.035, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.13);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.15);
    }
  } catch {
    enabled = false;
  }
}
export function audioUI() {
  const b = document.createElement("button");
  b.id = "sound";
  b.type = "button";
  document.querySelector(".bottom").append(b);
  function label() {
    const lang = document.documentElement.lang;
    b.textContent =
      (enabled ? "♫ " : "♪ ") +
      (lang === "ru"
        ? enabled
          ? "Звук вкл"
          : "Звук выкл"
        : lang === "zh-CN"
          ? enabled
            ? "声音开"
            : "声音关"
          : enabled
            ? "Sound on"
            : "Sound off");
    b.setAttribute("aria-pressed", String(enabled));
  }
  b.onclick = () => {
    enabled = !enabled;
    label();
    if (enabled) sound("join");
    else context?.suspend();
  };
  new MutationObserver(label).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  label();
}
