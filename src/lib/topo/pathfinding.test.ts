import assert from 'node:assert/strict';
import test from 'node:test';
import type { HeightField } from './terrain.ts';
import { chooseConnectedEndpoints, findRoute } from './pathfinding.ts';

function field(w: number, h: number, elevations: number[], water: Uint8Array | null = null): HeightField {
  const elev = Float32Array.from(elevations);
  return { w, h, elev, cellSize: 100, min: Math.min(...elev), max: Math.max(...elev), water, simulated: true, name: 'test field', detail: '' };
}

test('chooses separated endpoints connected under the same maximum-grade rule as search', () => {
  const w = 16;
  const h = 12;
  const elevations = Array.from({ length: w * h }, (_, index) => (index % w) * 10 + Math.floor(index / w) * 4);
  const terrain = field(w, h, elevations);
  const endpoints = chooseConnectedEndpoints(terrain, 25, 1234);

  assert.ok(endpoints, 'a routeable pair should be found in connected terrain');
  const result = findRoute({ ...terrain, ...endpoints, start: endpoints.start, goal: endpoints.goal, maxGrade: 25, algorithm: 'dijkstra' });
  assert.ok(result.path, 'search must be able to route between the selected endpoints');
  const distance = Math.hypot(endpoints.start % w - endpoints.goal % w, Math.floor(endpoints.start / w) - Math.floor(endpoints.goal / w));
  assert.ok(distance >= Math.hypot(w, h) * 0.35, `endpoints should be meaningfully separated, got ${distance}`);
});

test('never chooses water cells as endpoints', () => {
  const w = 8;
  const h = 8;
  const water = new Uint8Array(w * h);
  water.fill(1);
  water[0] = 0;
  water[w * h - 1] = 0;
  const terrain = field(w, h, Array.from({ length: w * h }, (_, index) => index), water);
  const endpoints = chooseConnectedEndpoints(terrain, 100, 99);

  assert.equal(endpoints, null, 'isolated dry cells do not form a usable endpoint pair');
});
