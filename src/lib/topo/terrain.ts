// Height fields for the Topo trail lab: shared type plus the seeded terrain generator.

/** Grid used by every terrain source (4:3, matching the map canvas). */
export const GRID_W = 256;
export const GRID_H = 192;

export interface HeightField {
  w: number;
  h: number;
  /** Elevation in meters, row-major. Lake cells hold their water-surface level. */
  elev: Float32Array;
  /** Ground distance between neighbouring cell centres, in meters. */
  cellSize: number;
  min: number;
  max: number;
  /** 1 where the cell is open water (impassable), or null when the source has no water mask. */
  water: Uint8Array | null;
  simulated: boolean;
  name: string;
  detail: string;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Noise2 = (x: number, y: number) => number;

/** Seeded 2D gradient (Perlin) noise, roughly in [-1, 1]. */
function makeNoise(rand: () => number): Noise2 {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const gx = new Float32Array(256);
  const gy = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const a = rand() * Math.PI * 2;
    gx[i] = Math.cos(a);
    gy[i] = Math.sin(a);
  }
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const n00 = gx[aa] * xf + gy[aa] * yf;
    const n10 = gx[ba] * (xf - 1) + gy[ba] * yf;
    const n01 = gx[ab] * xf + gy[ab] * (yf - 1);
    const n11 = gx[bb] * (xf - 1) + gy[bb] * (yf - 1);
    const top = n00 + (n10 - n00) * u;
    const bottom = n01 + (n11 - n01) * u;
    return (top + (bottom - top) * v) * 1.41;
  };
}

function fbm(noise: Noise2, x: number, y: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

/** Musgrave's ridged multifractal: sharp crests where the noise crosses zero, detail weighted by the previous octave. */
function ridged(noise: Noise2, x: number, y: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let weight = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    let n = 1 - Math.abs(noise(x * freq + o * 13.7, y * freq - o * 7.3));
    n *= n;
    n *= weight;
    weight = Math.min(1, Math.max(0, n * 1.8));
    sum += n * amp;
    norm += amp;
    amp *= 0.52;
    freq *= 2.07;
  }
  return sum / norm;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function normalize(data: Float32Array): void {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const span = max - min || 1;
  for (let i = 0; i < data.length; i++) data[i] = (data[i] - min) / span;
}

/** Thermal weathering: material slides off slopes steeper than the talus threshold. */
function thermalErosion(h: Float32Array, w: number, rows: number, iterations: number, talus: number): void {
  const offsets = [-1, 1, -w, w];
  for (let it = 0; it < iterations; it++) {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        let steepest = 0;
        let target = -1;
        for (const o of offsets) {
          const d = h[i] - h[i + o];
          if (d > steepest) { steepest = d; target = i + o; }
        }
        if (target >= 0 && steepest > talus) {
          const move = (steepest - talus) * 0.4;
          h[i] -= move;
          h[target] += move;
        }
      }
    }
  }
}

/** Low-pass smoothing tames single-cell cliffs left by noise detail and erosion. */
function smoothHeight(h: Float32Array, w: number, rows: number, iterations: number): void {
  const buffer = new Float32Array(h.length);
  for (let pass = 0; pass < iterations; pass++) {
    for (let y = 0; y < rows; y++) {
      const row = y * w;
      buffer[row] = h[row];
      buffer[row + w - 1] = h[row + w - 1];
      for (let x = 1; x < w - 1; x++) {
        const i = row + x;
        buffer[i] = (h[i - 1] + 2 * h[i] + h[i + 1]) * 0.25;
      }
    }
    for (let x = 0; x < w; x++) {
      h[x] = buffer[x];
      h[(rows - 1) * w + x] = buffer[(rows - 1) * w + x];
      for (let y = 1; y < rows - 1; y++) {
        const i = y * w + x;
        h[i] = (buffer[i - w] + 2 * buffer[i] + buffer[i + w]) * 0.25;
      }
    }
  }
}

/** Particle (droplet) hydraulic erosion on a normalized height field. */
function hydraulicErosion(h: Float32Array, w: number, rows: number, rand: () => number, droplets: number): void {
  const radius = 2;
  const brushOffsets: number[] = [];
  const brushWeights: number[] = [];
  let weightSum = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > radius) continue;
      brushOffsets.push(dx, dy);
      const wgt = radius - d;
      brushWeights.push(wgt);
      weightSum += wgt;
    }
  }
  for (let i = 0; i < brushWeights.length; i++) brushWeights[i] /= weightSum;

  const inertia = 0.05;
  const capacityFactor = 4;
  const minCapacity = 0.01;
  const depositRate = 0.3;
  const erodeRate = 0.3;
  const evaporate = 0.02;
  const gravity = 4;
  const maxSteps = 40;

  const sample = (px: number, py: number, out: Float64Array) => {
    const x = Math.floor(px);
    const y = Math.floor(py);
    const u = px - x;
    const v = py - y;
    const i = y * w + x;
    const a = h[i], b = h[i + 1], c = h[i + w], d = h[i + w + 1];
    out[0] = a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    out[1] = (b - a) * (1 - v) + (d - c) * v;
    out[2] = (c - a) * (1 - u) + (d - b) * u;
  };
  const s = new Float64Array(3);

  for (let n = 0; n < droplets; n++) {
    let px = 1 + rand() * (w - 3);
    let py = 1 + rand() * (rows - 3);
    let dx = 0;
    let dy = 0;
    let speed = 1;
    let water = 1;
    let sediment = 0;
    for (let step = 0; step < maxSteps; step++) {
      const nx = Math.floor(px);
      const ny = Math.floor(py);
      const u = px - nx;
      const v = py - ny;
      sample(px, py, s);
      const height = s[0];
      dx = dx * inertia - s[1] * (1 - inertia);
      dy = dy * inertia - s[2] * (1 - inertia);
      const len = Math.hypot(dx, dy);
      if (len < 1e-9) break;
      dx /= len;
      dy /= len;
      px += dx;
      py += dy;
      if (px < 1 || py < 1 || px >= w - 2 || py >= rows - 2) break;
      sample(px, py, s);
      const dh = s[0] - height;
      const capacity = Math.max(-dh * speed * water * capacityFactor, minCapacity);
      const i = ny * w + nx;
      if (sediment > capacity || dh > 0) {
        const amount = dh > 0 ? Math.min(dh, sediment) : (sediment - capacity) * depositRate;
        sediment -= amount;
        h[i] += amount * (1 - u) * (1 - v);
        h[i + 1] += amount * u * (1 - v);
        h[i + w] += amount * (1 - u) * v;
        h[i + w + 1] += amount * u * v;
      } else {
        const amount = Math.min((capacity - sediment) * erodeRate, -dh);
        for (let b = 0; b < brushWeights.length; b++) {
          const bx = nx + brushOffsets[b * 2];
          const by = ny + brushOffsets[b * 2 + 1];
          if (bx < 0 || by < 0 || bx >= w || by >= rows) continue;
          const j = by * w + bx;
          const take = Math.min(h[j], amount * brushWeights[b]);
          h[j] -= take;
          sediment += take;
        }
      }
      speed = Math.sqrt(Math.max(0, speed * speed - dh * gravity));
      water *= 1 - evaporate;
    }
  }
}

/** Minimal binary min-heap of cell indices keyed by a float priority. */
export class CellHeap {
  private nodes: Int32Array;
  private keys: Float64Array;
  size = 0;
  constructor(capacity: number) {
    this.nodes = new Int32Array(capacity);
    this.keys = new Float64Array(capacity);
  }
  push(node: number, key: number): void {
    if (this.size === this.nodes.length) {
      const nodes = new Int32Array(this.nodes.length * 2);
      nodes.set(this.nodes);
      const keys = new Float64Array(this.keys.length * 2);
      keys.set(this.keys);
      this.nodes = nodes;
      this.keys = keys;
    }
    let i = this.size++;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.keys[parent] <= key) break;
      this.nodes[i] = this.nodes[parent];
      this.keys[i] = this.keys[parent];
      i = parent;
    }
    this.nodes[i] = node;
    this.keys[i] = key;
  }
  /** Key of the smallest entry; only valid when size > 0. */
  peekKey(): number {
    return this.keys[0];
  }
  pop(): number {
    const top = this.nodes[0];
    const lastNode = this.nodes[--this.size];
    const lastKey = this.keys[this.size];
    let i = 0;
    const half = this.size >> 1;
    while (i < half) {
      let child = 2 * i + 1;
      const right = child + 1;
      if (right < this.size && this.keys[right] < this.keys[child]) child = right;
      if (this.keys[child] >= lastKey) break;
      this.nodes[i] = this.nodes[child];
      this.keys[i] = this.keys[child];
      i = child;
    }
    this.nodes[i] = lastNode;
    this.keys[i] = lastKey;
    return top;
  }
}

/**
 * Marks lakes: closed depressions (found by priority-flood filling from the map edge) deeper than
 * `minDepth` meters, plus the basin around the lowest point filled to cover about `basinShare` of the map.
 * Lake cells are flattened to their water level.
 */
function markWater(elev: Float32Array, w: number, rows: number, minDepth: number, basinShare: number): Uint8Array {
  const n = w * rows;
  const filled = new Float32Array(n);
  const seen = new Uint8Array(n);
  const heap = new CellHeap(n);
  for (let x = 0; x < w; x++) {
    for (const y of [0, rows - 1]) {
      const i = y * w + x;
      if (!seen[i]) { seen[i] = 1; filled[i] = elev[i]; heap.push(i, elev[i]); }
    }
  }
  for (let y = 0; y < rows; y++) {
    for (const x of [0, w - 1]) {
      const i = y * w + x;
      if (!seen[i]) { seen[i] = 1; filled[i] = elev[i]; heap.push(i, elev[i]); }
    }
  }
  while (heap.size) {
    const i = heap.pop();
    const x = i % w;
    const y = (i - x) / w;
    const level = filled[i];
    const neighbours = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < rows - 1 ? i + w : -1];
    for (const j of neighbours) {
      if (j < 0 || seen[j]) continue;
      seen[j] = 1;
      filled[j] = Math.max(elev[j], level);
      heap.push(j, filled[j]);
    }
  }

  const water = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (filled[i] - elev[i] > minDepth) water[i] = 1;

  // Drop puddles: keep only connected lakes of a meaningful size.
  const label = new Int32Array(n).fill(-1);
  const stack: number[] = [];
  const members: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!water[i] || label[i] >= 0) continue;
    members.length = 0;
    stack.push(i);
    label[i] = i;
    while (stack.length) {
      const c = stack.pop() as number;
      members.push(c);
      const x = c % w;
      const y = (c - x) / w;
      const neighbours = [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, y > 0 ? c - w : -1, y < rows - 1 ? c + w : -1];
      for (const j of neighbours) {
        if (j >= 0 && water[j] && label[j] < 0) { label[j] = i; stack.push(j); }
      }
    }
    if (members.length < 30) for (const c of members) water[c] = 0;
  }

  // The lowest basin: flood outward from the global minimum, always taking the lowest rim cell next.
  let low = 0;
  for (let i = 1; i < n; i++) if (elev[i] < elev[low]) low = i;
  const target = Math.round(n * basinShare);
  const visited = new Uint8Array(n);
  const basin = new CellHeap(1024);
  basin.push(low, elev[low]);
  visited[low] = 1;
  const flooded: number[] = [];
  let level = elev[low];
  while (basin.size && flooded.length < target) {
    level = Math.max(level, basin.peekKey());
    const c = basin.pop();
    flooded.push(c);
    const x = c % w;
    const y = (c - x) / w;
    const neighbours = [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, y > 0 ? c - w : -1, y < rows - 1 ? c + w : -1];
    for (const j of neighbours) {
      if (j >= 0 && !visited[j]) { visited[j] = 1; basin.push(j, elev[j]); }
    }
  }
  for (const c of flooded) { water[c] = 1; filled[c] = Math.max(filled[c], level); }

  for (let i = 0; i < n; i++) if (water[i]) elev[i] = filled[i];
  return water;
}

export interface GeneratedOptions {
  seed: number;
  w?: number;
  h?: number;
}

/** Simulated scale for generated terrain: 60 m cells and about 2.5 km of relief. */
const GENERATED_CELL_M = 60;
const GENERATED_BASE_M = 620;
const GENERATED_RELIEF_M = 1500;

export function generateTerrain({ seed, w = GRID_W, h = GRID_H }: GeneratedOptions): HeightField {
  const rand = mulberry32(seed);
  const noise = makeNoise(rand);
  const ox = rand() * 200;
  const oy = rand() * 200;
  const field = new Float32Array(w * h);
  const scale = 3.2 / w;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x * scale + ox;
      const ny = y * scale + oy;
      // Domain warping bends straight noise features into flowing ridgelines and valleys.
      const qx = fbm(noise, nx + 1.7, ny + 9.2, 4);
      const qy = fbm(noise, nx + 8.3, ny + 2.8, 4);
      const px = nx + 0.6 * qx;
      const py = ny + 0.6 * qy;
      const base = fbm(noise, px * 0.55, py * 0.55, 5) * 0.5 + 0.5;
      const ridges = ridged(noise, px * 1.05 + 31.4, py * 1.05 - 12.9, 5);
      const mask = smoothstep(0.34, 0.72, base);
      const hills = fbm(noise, px * 3.1 - 5.5, py * 3.1 + 4.4, 4);
      field[y * w + x] = base * 0.5 + ridges * mask * 0.8 + hills * 0.012;
    }
  }
  normalize(field);
  // Broaden valley floors so the terrain has places to put a trailhead.
  for (let i = 0; i < field.length; i++) field[i] = Math.pow(field[i], 1.35);
  thermalErosion(field, w, h, 6, 3.2 / w);
  hydraulicErosion(field, w, h, rand, 26000);
  smoothHeight(field, w, h, 4);
  normalize(field);

  const elev = new Float32Array(w * h);
  for (let i = 0; i < elev.length; i++) elev[i] = GENERATED_BASE_M + field[i] * GENERATED_RELIEF_M;
  const water = markWater(elev, w, h, 5, 0.018);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < elev.length; i++) {
    if (elev[i] < min) min = elev[i];
    if (elev[i] > max) max = elev[i];
  }
  return {
    w, h, elev, cellSize: GENERATED_CELL_M, min, max, water, simulated: true,
    name: 'Generated terrain',
    detail: `Seed ${seed.toString(16).padStart(8, '0')} · simulated elevations and scale`,
  };
}
