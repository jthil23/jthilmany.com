import type { IdealLine } from './racingLine';
import type { Evolution } from './sim';
import type { Track } from './track';

export class TrackRenderer {
  private width = 0;
  private height = 0;
  private ratio = 1;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D) {}
  resize(track: Track): void {
    const bounds = this.canvas.getBoundingClientRect(); this.width = bounds.width; this.height = bounds.height; this.ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.ratio); this.canvas.height = Math.round(this.height * this.ratio);
    this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    const xs = [...track.leftWall.map(point => point.x), ...track.rightWall.map(point => point.x)], ys = [...track.leftWall.map(point => point.y), ...track.rightWall.map(point => point.y)];
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    this.scale = Math.min((this.width - 60) / (maxX - minX), (this.height - 60) / (maxY - minY));
    this.offsetX = (this.width - (maxX - minX) * this.scale) / 2 - minX * this.scale;
    this.offsetY = (this.height - (maxY - minY) * this.scale) / 2 - minY * this.scale;
  }
  private screen(x: number, y: number): [number, number] { return [this.offsetX + x * this.scale, this.offsetY + y * this.scale]; }
  draw(track: Track, ideal: IdealLine, simulation: Evolution, showIdeal: boolean): void {
    const ctx = this.ctx; const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--bg').trim(), panel = styles.getPropertyValue('--panel').trim(), line = styles.getPropertyValue('--line').trim(), accent = styles.getPropertyValue('--accent').trim(), text = styles.getPropertyValue('--text').trim();
    ctx.clearRect(0, 0, this.width, this.height); ctx.fillStyle = bg; ctx.fillRect(0, 0, this.width, this.height);
    const path = (points: { x: number; y: number }[]) => { ctx.beginPath(); points.forEach((p, i) => { const [x, y] = this.screen(p.x, p.y); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); };
    ctx.beginPath();
    for (let wall = 0; wall < 2; wall++) {
      const boundary = wall === 0 ? track.leftWall : track.rightWall;
      boundary.forEach((point, index) => {
        const [x, y] = this.screen(point.x, point.y);
        if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.lineJoin = 'round'; ctx.fillStyle = panel; ctx.fill('evenodd');
    ctx.strokeStyle = line; ctx.lineWidth = 1.5;
    path(track.leftWall); ctx.stroke(); path(track.rightWall); ctx.stroke();
    path(track.points); ctx.setLineDash([3, 7]); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    if (showIdeal) {
      ctx.beginPath(); ideal.points.forEach((p, i) => { const [x, y] = this.screen(p.x, p.y); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1.6, 2 * this.scale); ctx.stroke();
    }
    const leader = simulation.bestCar();
    for (const car of simulation.cars) {
      if (car.trail.length > 1 && car === leader) { ctx.beginPath(); car.trail.forEach((p, i) => { const [x, y] = this.screen(p.x, p.y); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.strokeStyle = accent; ctx.globalAlpha = .65; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; }
      const [x, y] = this.screen(car.x, car.y), leaderCar = car === leader;
      const carLength = Math.max(5, this.scale * 8), carWidth = Math.max(2.8, this.scale * 3.2);
      ctx.save(); ctx.translate(x, y); ctx.rotate(car.heading); ctx.fillStyle = leaderCar ? text : accent; ctx.globalAlpha = leaderCar ? .98 : car.alive ? .42 : .08;
      if (leaderCar) { ctx.shadowColor = accent; ctx.shadowBlur = 6; }
      ctx.fillRect(-carLength / 2, -carWidth / 2, carLength, carWidth); ctx.restore();
    }
  }
}

export function drawFitness(canvas: HTMLCanvasElement, history: { best: number; average: number }[]): void {
  const bounds = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2), ctx = canvas.getContext('2d'); if (!ctx) return;
  canvas.width = Math.round(bounds.width * ratio); canvas.height = Math.round(bounds.height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = bounds.width, h = bounds.height, styles = getComputedStyle(document.documentElement);
  ctx.clearRect(0, 0, w, h); ctx.strokeStyle = styles.getPropertyValue('--line').trim(); ctx.lineWidth = 1;
  for (let value = 0; value <= 125; value += 25) { const py = h - value / 125 * (h - 14) - 4; ctx.beginPath(); ctx.moveTo(28, py); ctx.lineTo(w, py); ctx.stroke(); }
  ctx.font = '9px ui-monospace, monospace'; ctx.fillStyle = styles.getPropertyValue('--muted').trim(); ctx.fillText('125%', 0, 10); ctx.fillText('0%', 12, h - 2);
  const series = (key: 'best' | 'average', color: string) => { ctx.beginPath(); history.forEach((entry, i) => { const x = 30 + i / Math.max(1, history.length - 1) * (w - 34), y = h - Math.min(125, entry[key]) / 125 * (h - 14) - 4; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.strokeStyle = color; ctx.lineWidth = key === 'best' ? 2 : 1; ctx.stroke(); };
  series('average', styles.getPropertyValue('--muted').trim()); series('best', styles.getPropertyValue('--accent').trim());
}
