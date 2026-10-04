import { GRID_H, GRID_W, type HeightField } from './terrain';

export interface TerrainPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  zoom: number;
}

// Coordinates are summit or named-landmark positions; zooms balance local relief with useful context.
export const PLACES: TerrainPlace[] = [
  { id: 'longs-peak', name: 'Longs Peak · Rocky Mountain National Park', lat: 40.2550, lon: -105.6151, zoom: 12 },
  { id: 'half-dome', name: 'Half Dome · Yosemite', lat: 37.7460, lon: -119.5329, zoom: 12 },
  { id: 'rainier', name: 'Mount Rainier · Washington', lat: 46.8517, lon: -121.7603, zoom: 11 },
  { id: 'grand-canyon', name: 'Grand Canyon · Phantom Ranch', lat: 36.10, lon: -112.10, zoom: 11 },
  { id: 'smokies', name: 'Great Smoky Mountains · Clingmans Dome', lat: 35.5628, lon: -83.4986, zoom: 12 },
  { id: 'matterhorn', name: 'Matterhorn · Alps', lat: 45.9764, lon: 7.6586, zoom: 12 },
  { id: 'fuji', name: 'Mount Fuji · Japan', lat: 35.3608, lon: 138.7275, zoom: 12 },
  { id: 'torres', name: 'Torres del Paine · Patagonia', lat: -50.9951, lon: -73.0867, zoom: 12 },
  { id: 'whitney', name: 'Mount Whitney · Sierra Nevada', lat: 36.5786, lon: -118.2923, zoom: 12 },
  { id: 'grand-teton', name: 'Grand Teton · Wyoming', lat: 43.7410, lon: -110.8024, zoom: 12 },
  { id: 'mont-blanc', name: 'Mont Blanc · Alps', lat: 45.8326, lon: 6.8652, zoom: 12 },
  { id: 'kilimanjaro', name: 'Mount Kilimanjaro · Tanzania', lat: -3.0674, lon: 37.3556, zoom: 11 },
];

export const TERRAIN_ATTRIBUTION = 'Elevation: Terrain Tiles on AWS Open Data (Mapzen; sources incl. USGS 3DEP, SRTM, GMTED, ETOPO1).';

const TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const TILE_SIZE = 256;
const CROP_W = 512;
const CROP_H = 384;

function lonToPixel(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * TILE_SIZE * 2 ** zoom;
}
function latToPixel(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE_SIZE * 2 ** zoom;
}
function wrapTileX(x: number, count: number): number {
  return ((x % count) + count) % count;
}

/** Fetches the 2x2-or-larger tile patch around the place and downsamples it into the common grid. */
export async function loadPlace(place: TerrainPlace, signal?: AbortSignal): Promise<HeightField> {
  const zoom = place.zoom;
  const centerX = lonToPixel(place.lon, zoom);
  const centerY = latToPixel(place.lat, zoom);
  const left = Math.floor(centerX - CROP_W / 2);
  const top = Math.floor(centerY - CROP_H / 2);
  const firstTileX = Math.floor(left / TILE_SIZE);
  const firstTileY = Math.floor(top / TILE_SIZE);
  const lastTileX = Math.floor((left + CROP_W - 1) / TILE_SIZE);
  const lastTileY = Math.floor((top + CROP_H - 1) / TILE_SIZE);
  const patchW = (lastTileX - firstTileX + 1) * TILE_SIZE;
  const patchH = (lastTileY - firstTileY + 1) * TILE_SIZE;
  const source = document.createElement('canvas');
  source.width = patchW;
  source.height = patchH;
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas pixel access is unavailable.');
  const tiles: ImageBitmap[] = [];
  try {
    for (let ty = firstTileY; ty <= lastTileY; ty++) {
      for (let tx = firstTileX; tx <= lastTileX; tx++) {
        if (signal?.aborted) throw new DOMException('Tile request cancelled.', 'AbortError');
        const y = Math.max(0, Math.min(2 ** zoom - 1, ty));
        const x = wrapTileX(tx, 2 ** zoom);
        const response = await fetch(`${TILE_URL}/${zoom}/${x}/${y}.png`, { mode: 'cors', signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`Elevation tile request failed (${response.status}).`);
        const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
        tiles.push(bitmap);
        ctx.drawImage(bitmap, (tx - firstTileX) * TILE_SIZE, (ty - firstTileY) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
    const pixels = ctx.getImageData(left - firstTileX * TILE_SIZE, top - firstTileY * TILE_SIZE, CROP_W, CROP_H).data;
    const elev = new Float32Array(GRID_W * GRID_H);
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < GRID_H; y++) {
      const sy = y * 2;
      for (let x = 0; x < GRID_W; x++) {
        const sx = x * 2;
        const p0 = (sy * CROP_W + sx) * 4;
        const p1 = p0 + 4;
        const p2 = p0 + CROP_W * 4;
        const p3 = p2 + 4;
        let sum = 0;
        for (const p of [p0, p1, p2, p3]) {
          const r = pixels[p];
          const g = pixels[p + 1];
          const b = pixels[p + 2];
          sum += r * 256 + g + b / 256 - 32768;
        }
        const value = sum / 4;
        elev[y * GRID_W + x] = value;
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    const cellSize = (156543.03392 * Math.cos((place.lat * Math.PI) / 180)) / 2 ** zoom * 2;
    return {
      w: GRID_W, h: GRID_H, elev, cellSize, min, max, water: null, simulated: false,
      name: place.name,
      detail: `${place.lat.toFixed(3)}°, ${place.lon.toFixed(3)}° · ${((cellSize * GRID_W) / 1000).toFixed(1)} × ${((cellSize * GRID_H) / 1000).toFixed(1)} km · zoom ${zoom}`,
    };
  } finally {
    for (const tile of tiles) tile.close();
  }
}

export function randomPlace(random: () => number = Math.random): TerrainPlace {
  return PLACES[Math.floor(random() * PLACES.length)];
}
