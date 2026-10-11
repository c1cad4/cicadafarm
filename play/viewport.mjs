// Uniform camera: retain round shapes on phones, tablets and expanded maps.
export function camera(width, height, mapW, mapH, player) {
  const scale = Math.max(width / mapW, height / mapH);
  const viewW = width / scale,
    viewH = height / scale;
  const x = Math.max(
    0,
    Math.min(mapW - viewW, (player?.x ?? mapW / 2) - viewW / 2),
  );
  const y = Math.max(
    0,
    Math.min(mapH - viewH, (player?.y ?? mapH / 2) - viewH / 2),
  );
  return { scale, x, y, viewW, viewH };
}
export function screenPoint(view, x, y) {
  return { x: view.x + x / view.scale, y: view.y + y / view.scale };
}
export function touchTarget(player, origin, point) {
  const dx = point.x - origin.x,
    dy = point.y - origin.y;
  const length = Math.hypot(dx, dy);
  return length < 5
    ? null
    : { x: player.x + (dx / length) * 150, y: player.y + (dy / length) * 150 };
}
export function pixelRatio(width, height, deviceRatio) {
  return Math.max(
    0.25,
    Math.min(
      deviceRatio || 1,
      1.5,
      Math.sqrt(1800000 / Math.max(1, width * height)),
    ),
  );
}
