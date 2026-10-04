export interface Circuit { id: string; name: string; location: string; lengthM: number; points: number[] }
export interface Vec { x: number; y: number }
export interface Track { circuit: Circuit; points: Vec[]; cumulative: Float32Array; length: number; halfWidth: number; halfWidths: Float32Array; leftWall: Vec[]; rightWall: Vec[]; grid: Uint8Array; gridWidth: number; gridHeight: number; gridLeft: number; gridTop: number; gridSize: number }
export interface Projection { index: number; t: number; x: number; y: number; distance: number; lateral: number; progress: number; tangentX: number; tangentY: number }

export const TRACK_HALF_WIDTH = 7.5;
const mod = (n: number, m: number) => (n % m + m) % m;

export function createTrack(circuit: Circuit): Track {
  const rawPoints: Vec[] = [], smoothingRadius = 38;
  for (let i = 0; i < circuit.points.length; i += 2) rawPoints.push({ x: circuit.points[i], y: circuit.points[i + 1] });
  // Soften only tight sampled bends; repeated global smoothing measurably shortens the whole lap.
  let points = rawPoints;
  for (let pass = 0; pass < 29; pass++) {
    const source = points;
    points = source.map((point, index): Vec => {
      const previous = source[(index + source.length - 1) % source.length], next = source[(index + 1) % source.length];
      const ab = Math.hypot(point.x - previous.x, point.y - previous.y), bc = Math.hypot(next.x - point.x, next.y - point.y);
      const cross = Math.abs((point.x - previous.x) * (next.y - point.y) - (point.y - previous.y) * (next.x - point.x));
      const ac = Math.hypot(next.x - previous.x, next.y - previous.y), radius = cross > .001 ? ab * bc * ac / (2 * cross) : Infinity;
      return radius < smoothingRadius ? { x: (previous.x + 2 * point.x + next.x) * .25, y: (previous.y + 2 * point.y + next.y) * .25 } : point;
    });
  }
  points = points.map((point, index): Vec => {
    const previous = points[(index + points.length - 1) % points.length], next = points[(index + 1) % points.length];
    return { x: (previous.x + 2 * point.x + next.x) * .25, y: (previous.y + 2 * point.y + next.y) * .25 };
  });
  const cumulative = new Float32Array(points.length + 1);
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    cumulative[i + 1] = cumulative[i] + Math.hypot(b.x - a.x, b.y - a.y);
  }
  const geometry = { points, cumulative, length: cumulative[points.length] } as Track, halfWidths = new Float32Array(points.length);
  for (let i = 0; i < points.length; i++) {
    const point = points[i], curvature = Math.abs(curvatureAt(geometry, cumulative[i])), radius = curvature > .0001 ? 1 / curvature : Infinity;
    let width = Math.min(TRACK_HALF_WIDTH, radius - 1.5);
    let nearest = Infinity;
    for (let j = 0; j < points.length; j++) {
      const gap = Math.min((j - i + points.length) % points.length, (i - j + points.length) % points.length);
      if (gap <= 3) continue;
      const arc = Math.abs(cumulative[j] - cumulative[i]), arcGap = Math.min(arc, cumulative[points.length] - arc);
      if (arcGap < 35) continue;
      const a = points[j], b = points[(j + 1) % points.length], dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / Math.max(.001, dx * dx + dy * dy)));
      nearest = Math.min(nearest, Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t)));
    }
    if (Number.isFinite(nearest)) width = Math.min(width, nearest * .5 - .35);
    halfWidths[i] = Math.max(.75, width);
  }
  const leftWall: Vec[] = [], rightWall: Vec[] = [];
  for (let i = 0; i < points.length; i++) {
    const previous = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length], p = points[i];
    const dx = next.x - previous.x, dy = next.y - previous.y, length = Math.hypot(dx, dy) || 1, width = halfWidths[i];
    leftWall.push({ x: p.x - dy / length * width, y: p.y + dx / length * width });
    rightWall.push({ x: p.x + dy / length * width, y: p.y - dx / length * width });
  }
  const gridSize = 3, padding = TRACK_HALF_WIDTH + gridSize * 2;
  const minX = Math.min(...points.map(point => point.x)) - padding, maxX = Math.max(...points.map(point => point.x)) + padding;
  const minY = Math.min(...points.map(point => point.y)) - padding, maxY = Math.max(...points.map(point => point.y)) + padding;
  const gridWidth = Math.ceil((maxX - minX) / gridSize) + 1, gridHeight = Math.ceil((maxY - minY) / gridSize) + 1;
  const grid = new Uint8Array(gridWidth * gridHeight);
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length, a = points[i], b = points[next], segmentLength = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.ceil(segmentLength / (gridSize * .55));
    const radius = Math.min(halfWidths[i], halfWidths[next]) + gridSize * .35, radiusSquared = radius * radius, radiusCells = Math.ceil(radius / gridSize);
    for (let step = 0; step <= steps; step++) {
      const t = step / steps, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      const cx = Math.round((x - minX) / gridSize), cy = Math.round((y - minY) / gridSize);
      for (let oy = -radiusCells; oy <= radiusCells; oy++) for (let ox = -radiusCells; ox <= radiusCells; ox++) {
        const column = cx + ox, row = cy + oy;
        if (column >= 0 && row >= 0 && column < gridWidth && row < gridHeight && (ox * ox + oy * oy) * gridSize * gridSize <= radiusSquared) grid[row * gridWidth + column] = 1;
      }
    }
  }
  return { circuit, points, cumulative, length: cumulative[points.length], halfWidth: TRACK_HALF_WIDTH, halfWidths, leftWall, rightWall, grid, gridWidth, gridHeight, gridLeft: minX, gridTop: minY, gridSize };
}
export function isInsideTrack(track: Track, x: number, y: number): boolean {
  const column = Math.round((x - track.gridLeft) / track.gridSize), row = Math.round((y - track.gridTop) / track.gridSize);
  return column >= 0 && row >= 0 && column < track.gridWidth && row < track.gridHeight && track.grid[row * track.gridWidth + column] === 1;
}

export function pointAt(track: Track, distance: number): Vec {
  const s = mod(distance, track.length), c = track.cumulative;
  let lo = 0, hi = track.points.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (c[mid + 1] < s) lo = mid + 1; else hi = mid; }
  const i = Math.min(lo, track.points.length - 1), a = track.points[i], b = track.points[(i + 1) % track.points.length];
  const t = (s - c[i]) / Math.max(.001, c[i + 1] - c[i]);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function project(track: Track, x: number, y: number, around = 0, window = 36, referenceProgress?: number, maxAdvance = Infinity): Projection {
  let best: Projection = { index: 0, t: 0, x: 0, y: 0, distance: Infinity, lateral: 0, progress: 0, tangentX: 1, tangentY: 0 };
  const n = track.points.length, c = track.cumulative;
  for (let offset = -window; offset <= window; offset++) {
    const i = mod(around + offset, n), a = track.points[i], b = track.points[(i + 1) % n], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / Math.max(.001, dx * dx + dy * dy)));
    const px = a.x + dx * t, py = a.y + dy * t, ex = x - px, ey = y - py, d = Math.hypot(ex, ey), progress = c[i] + t * (c[i + 1] - c[i]);
    if (referenceProgress !== undefined) {
      let advance = progress - referenceProgress;
      if (advance < -track.length * .5) advance += track.length;
      if (advance > maxAdvance) continue;
    }
    if (d < best.distance) best = { index: i, t, x: px, y: py, distance: d, lateral: (dx * ey - dy * ex) / Math.max(.001, Math.hypot(dx, dy)), progress, tangentX: dx / Math.hypot(dx, dy), tangentY: dy / Math.hypot(dx, dy) };
  }
  return best;
}
export function rayDistance(track: Track, x: number, y: number, angle: number, max = 110, _around = 0): number {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (let distance = 3; distance <= max; distance += 6) {
    if (!isInsideTrack(track, x + cos * distance, y + sin * distance)) return distance;
  }
  return max;
}
export function curvatureAt(track: Track, distance: number): number {
  const a = pointAt(track, distance - 12), b = pointAt(track, distance), c = pointAt(track, distance + 12);
  const ab = Math.hypot(b.x - a.x, b.y - a.y), bc = Math.hypot(c.x - b.x, c.y - b.y), ca = Math.hypot(a.x - c.x, a.y - c.y);
  const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return 2 * cross / Math.max(.001, ab * bc * ca);
}

