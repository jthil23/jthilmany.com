import { curvatureAt, pointAt, type Track, type Vec } from './track';

export interface IdealLine { points: Vec[]; speeds: number[]; lapSeconds: number; offsets: number[] }
const GRIP = 28, MAX_SPEED = 92, ACCEL = 13, BRAKE = 38;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function computeIdealLine(track: Track): IdealLine {
  const n = track.points.length, step = track.length / n, offsets = new Float32Array(n);
  // Relax lateral offsets toward a smoother path, clamped to safe track bounds.
  for (let pass = 0; pass < 120; pass++) {
    for (let i = 0; i < n; i++) {
      const prev = (i + n - 1) % n, next = (i + 1) % n;
      const target = ((offsets[prev] + offsets[next]) * .5) - curvatureAt(track, i * step) * 12;
      const limit = Math.max(0, track.halfWidths[i] - 4.5);
      offsets[i] = clamp(offsets[i] * .88 + target * .12, -limit, limit);
    }
  }
  const points: Vec[] = [], speeds: number[] = [];
  for (let i = 0; i < n; i++) {
    const center = pointAt(track, i * step), before = pointAt(track, (i - 1) * step), after = pointAt(track, (i + 1) * step);
    const tx = after.x - before.x, ty = after.y - before.y, length = Math.hypot(tx, ty) || 1;
    points.push({ x: center.x - ty / length * offsets[i], y: center.y + tx / length * offsets[i] });
  }
  for (let i = 0; i < n; i++) {
    const a = points[(i + n - 1) % n], b = points[i], c = points[(i + 1) % n];
    const ab = Math.hypot(b.x - a.x, b.y - a.y), bc = Math.hypot(c.x - b.x, c.y - b.y), ca = Math.hypot(a.x - c.x, a.y - c.y);
    const cross = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    const k = 2 * cross / Math.max(.01, ab * bc * ca);
    speeds.push(Math.min(MAX_SPEED, Math.sqrt(GRIP / Math.max(.0001, k))));
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < n; i++) speeds[i] = Math.min(speeds[i], Math.sqrt(speeds[i - 1] ** 2 + 2 * ACCEL * step));
    for (let i = n - 2; i >= 0; i--) speeds[i] = Math.min(speeds[i], Math.sqrt(speeds[i + 1] ** 2 + 2 * BRAKE * step));
  }
  let lapSeconds = 0;
  for (let i = 0; i < n; i++) lapSeconds += step / Math.max(5, (speeds[i] + speeds[(i + 1) % n]) * .5);
  return { points, speeds, lapSeconds, offsets: Array.from(offsets) };
}
