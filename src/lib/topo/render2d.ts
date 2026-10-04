import type { HeightField } from './terrain';
import { ALGORITHM_LABELS, type Algorithm, type SearchResult } from './pathfinding';

export interface MapState {
  field: HeightField;
  routes: SearchResult[];
  explored: Partial<Record<Algorithm, Int32Array>>;
  start: number | null;
  goal: number | null;
  label: string;
  detail: string;
  attribution: string;
}

export const ROUTE_COLORS: Record<Algorithm, string> = {
  dijkstra: '#ffbf47',
  astar: '#ff5b75',
  greedy: '#31d6c2',
};

function cssColor(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}


const STOPS: Array<[number, [number, number, number], [number, number, number]]> = [
  [0, [21, 63, 50], [42, 112, 77]],
  [.28, [52, 107, 69], [113, 151, 83]],
  [.52, [116, 127, 88], [174, 157, 119]],
  [.74, [132, 123, 116], [185, 170, 147]],
  [.91, [172, 174, 174], [226, 229, 230]],
  [1, [226, 235, 244], [255, 255, 255]],
];

function mixColor(a: number[], b: number[], t: number): [number, number, number] {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

function paletteColor(t: number, light: boolean): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const previous = STOPS[i - 1];
      const next = STOPS[i];
      return mixColor(light ? previous[2] : previous[1], light ? next[2] : next[1], (t - previous[0]) / (next[0] - previous[0]));
    }
  }
  return light ? STOPS[STOPS.length - 1][2] : STOPS[STOPS.length - 1][1];
}

function fieldRange(field: HeightField): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < field.elev.length; i++) {
    if (field.water?.[i]) continue;
    const value = field.elev[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max === min ? min + 1 : max];
}

function drawBase(ctx: CanvasRenderingContext2D, field: HeightField, width: number, height: number): void {
  const light = document.documentElement.dataset.theme === 'light';
  const [min, max] = fieldRange(field);
  const image = ctx.createImageData(field.w, field.h);
  const data = image.data;
  for (let y = 0; y < field.h; y++) {
    for (let x = 0; x < field.w; x++) {
      const i = y * field.w + x;
      const p = i * 4;
      if (field.water?.[i]) {
        const water = light ? [102, 174, 210] : [25, 92, 132];
        data[p] = water[0]; data[p + 1] = water[1]; data[p + 2] = water[2]; data[p + 3] = 255;
        continue;
      }
      const left = field.elev[y * field.w + Math.max(0, x - 1)];
      const right = field.elev[y * field.w + Math.min(field.w - 1, x + 1)];
      const up = field.elev[Math.max(0, y - 1) * field.w + x];
      const down = field.elev[Math.min(field.h - 1, y + 1) * field.w + x];
      const dzdx = (right - left) / (2 * field.cellSize);
      const dzdy = (down - up) / (2 * field.cellSize);
      const nx = -dzdx;
      const ny = -dzdy;
      const nz = 1;
      const norm = Math.hypot(nx, ny, nz);
      const illumination = (nx * -0.354 + ny * -0.354 + nz * 0.866) / norm;
      const shade = Math.min(1.18, Math.max(0.63, 0.88 + illumination * 0.28));
      const color = paletteColor((field.elev[i] - min) / (max - min), light);
      data[p] = Math.min(255, Math.round(color[0] * shade));
      data[p + 1] = Math.min(255, Math.round(color[1] * shade));
      data[p + 2] = Math.min(255, Math.round(color[2] * shade));
      data[p + 3] = 255;
    }
  }
  const raster = document.createElement('canvas');
  raster.width = field.w;
  raster.height = field.h;
  const rasterCtx = raster.getContext('2d');
  if (!rasterCtx) return;
  rasterCtx.putImageData(image, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(raster, 0, 0, width, height);
}

function crossing(level: number, a: number, b: number, t0: number, t1: number): number | null {
  if ((a >= level) === (b >= level)) return null;
  return t0 + ((level - a) / (b - a)) * (t1 - t0);
}

function drawContours(ctx: CanvasRenderingContext2D, field: HeightField, width: number, height: number): void {
  const [min, max] = fieldRange(field);
  const interval = Math.max(20, Math.round((max - min) / 14 / 20) * 20);
  const dx = width / (field.w - 1);
  const dy = height / (field.h - 1);
  const normal = new Path2D();
  const index = new Path2D();
  for (let y = 0; y < field.h - 1; y++) {
    for (let x = 0; x < field.w - 1; x++) {
      const i = y * field.w + x;
      if (field.water?.[i] || field.water?.[i + 1] || field.water?.[i + field.w] || field.water?.[i + field.w + 1]) continue;
      const a = field.elev[i], b = field.elev[i + 1], c = field.elev[i + field.w + 1], d = field.elev[i + field.w];
      const low = Math.min(a, b, c, d);
      const high = Math.max(a, b, c, d);
      const start = Math.ceil(low / interval) * interval;
      for (let level = start; level <= high; level += interval) {
        const path = Math.round(level / interval) % 5 === 0 ? index : normal;
        const points: Array<[number, number]> = [];
        const top = crossing(level, a, b, x, x + 1);
        if (top !== null) points.push([top * dx, y * dy]);
        const right = crossing(level, b, c, y, y + 1);
        if (right !== null) points.push([(x + 1) * dx, right * dy]);
        const bottom = crossing(level, d, c, x, x + 1);
        if (bottom !== null) points.push([bottom * dx, (y + 1) * dy]);
        const left = crossing(level, a, d, y, y + 1);
        if (left !== null) points.push([x * dx, left * dy]);
        if (points.length === 2) {
          path.moveTo(points[0][0], points[0][1]);
          path.lineTo(points[1][0], points[1][1]);
        } else if (points.length === 4) {
          path.moveTo(points[0][0], points[0][1]); path.lineTo(points[1][0], points[1][1]);
          path.moveTo(points[2][0], points[2][1]); path.lineTo(points[3][0], points[3][1]);
        }
      }
    }
  }
  const ink = cssColor('--text', '#fff');
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.24;
  ctx.stroke(normal);
  ctx.lineWidth = 1.25;
  ctx.globalAlpha = 0.55;
  ctx.stroke(index);
  ctx.globalAlpha = 1;
}

function cellPoint(cell: number, field: HeightField, width: number, height: number): [number, number] {
  const x = cell % field.w;
  const y = Math.floor(cell / field.w);
  return [x / (field.w - 1) * width, y / (field.h - 1) * height];
}

function drawExplored(ctx: CanvasRenderingContext2D, field: HeightField, width: number, height: number, explored: Partial<Record<Algorithm, Int32Array>>): void {
  const sx = width / field.w;
  const sy = height / field.h;
  for (const algorithm of ['dijkstra', 'astar', 'greedy'] as const) {
    const cells = explored[algorithm];
    if (!cells) continue;
    ctx.fillStyle = ROUTE_COLORS[algorithm];
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      ctx.fillRect((cell % field.w) * sx, Math.floor(cell / field.w) * sy, Math.ceil(sx), Math.ceil(sy));
    }
  }
  ctx.globalAlpha = 1;
}

function drawRoutes(ctx: CanvasRenderingContext2D, state: MapState, width: number, height: number): void {
  for (const result of state.routes) {
    if (!result.path) continue;
    ctx.beginPath();
    const first = cellPoint(result.path[0], state.field, width, height);
    ctx.moveTo(first[0], first[1]);
    for (let i = 1; i < result.path.length; i++) {
      const point = cellPoint(result.path[i], state.field, width, height);
      ctx.lineTo(point[0], point[1]);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = cssColor('--bg', '#071224');
    ctx.lineWidth = state.routes.length > 1 ? 6 : 7;
    ctx.stroke();
    ctx.strokeStyle = ROUTE_COLORS[result.algorithm];
    ctx.lineWidth = state.routes.length > 1 ? 3.2 : 4;
    ctx.stroke();
  }
}

function drawMarker(ctx: CanvasRenderingContext2D, cell: number | null, field: HeightField, width: number, height: number, label: string, color: string): void {
  if (cell === null) return;
  const point = cellPoint(cell, field, width, height);
  ctx.beginPath();
  ctx.arc(point[0], point[1], 7, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = cssColor('--bg', '#071224');
  ctx.stroke();
  ctx.fillStyle = cssColor('--text', '#fff');
  ctx.font = 'bold 10px ui-monospace, monospace';
  ctx.fillText(label, point[0] + 10, point[1] - 8);
}

function drawScale(ctx: CanvasRenderingContext2D, field: HeightField, width: number, height: number): void {
  const total = field.cellSize * field.w;
  const desired = total * 0.18;
  const magnitude = 10 ** Math.floor(Math.log10(desired));
  const unit = desired / magnitude;
  const nice = unit >= 5 ? 5 : unit >= 2 ? 2 : 1;
  const meters = nice * magnitude;
  const px = meters / total * width;
  const x = 18;
  const y = height - (field.simulated ? 22 : 60);
  ctx.strokeStyle = cssColor('--text', '#fff');
  ctx.fillStyle = cssColor('--text', '#fff');
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + px, y); ctx.stroke();
  ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(meters >= 1000 ? `${(meters / 1000).toFixed(meters % 1000 ? 1 : 0)} km` : `${Math.round(meters)} m`, x, y - 7);
}

function drawLabels(ctx: CanvasRenderingContext2D, state: MapState, width: number, height: number): void {
  const bg = cssColor('--bg', '#071224');
  const text = cssColor('--text', '#fff');
  ctx.font = 'bold 12px ui-monospace, monospace';
  const labelWidth = ctx.measureText(state.label).width + 24;
  ctx.fillStyle = bg;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(12, 12, Math.min(width - 24, labelWidth), 28);
  ctx.globalAlpha = 1;
  ctx.fillStyle = text;
  ctx.fillText(state.label, 22, 31);
  drawScale(ctx, state.field, width, height);
  if (state.field.simulated) {
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = text;
    ctx.globalAlpha = 0.82;
    ctx.fillText('SIMULATED ELEVATION', 18, height - 39);
    ctx.globalAlpha = 1;
  } else {
    ctx.font = '9px ui-monospace, monospace';
    ctx.fillStyle = text;
    ctx.globalAlpha = 0.9;
    const maxLine = Math.max(120, width - 28);
    const words = state.attribution.split(' ');
    let line = '';
    let lineNo = 0;
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxLine && line) {
        ctx.fillText(line, 14, height - 12 - lineNo * 11);
        line = word;
        lineNo++;
      } else line = next;
    }
    ctx.fillText(line, 14, height - 12 - lineNo * 11);
    ctx.globalAlpha = 1;
  }
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = text;
  ctx.fillText(state.detail, 22, 53);
}

export function renderMap(canvas: HTMLCanvasElement, state: MapState, dpr = Math.min(window.devicePixelRatio || 1, 2)): void {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawBase(ctx, state.field, width, height);
  drawContours(ctx, state.field, width, height);
  drawExplored(ctx, state.field, width, height, state.explored);
  drawRoutes(ctx, state, width, height);
  drawMarker(ctx, state.start, state.field, width, height, 'A', '#f4f7ff');
  drawMarker(ctx, state.goal, state.field, width, height, 'B', '#f4f7ff');
  drawLabels(ctx, state, width, height);
}

/** Render a controls-free PNG canvas at a crisp export resolution. */
export function exportMap(state: MapState, width = 1600, height = 1200): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  drawBase(ctx, state.field, width, height);
  drawContours(ctx, state.field, width, height);
  drawRoutes(ctx, state, width, height);
  drawMarker(ctx, state.start, state.field, width, height, 'A', '#f4f7ff');
  drawMarker(ctx, state.goal, state.field, width, height, 'B', '#f4f7ff');
  drawLabels(ctx, state, width, height);
  return canvas;
}

export function routeLegendText(algorithm: Algorithm): string {
  return `${ALGORITHM_LABELS[algorithm]} route`;
}
