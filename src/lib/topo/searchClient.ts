import { findRoute, type Algorithm, type SearchResult } from './pathfinding';
import type { HeightField } from './terrain';

export interface SearchClient {
  search(start: number, goal: number, maxGrade: number, algorithm: Algorithm): Promise<SearchResult>;
  dispose(): void;
}

interface Pending { resolve: (result: SearchResult) => void; reject: (error: Error) => void }

/** Persistent worker for route searches; if workers are blocked, uses the same search synchronously. */
export function createSearchClient(field: HeightField): SearchClient {
  let worker: Worker | null = null;
  let failed = false;
  let nextId = 1;
  const pending = new Map<number, Pending>();
  try {
    worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
    const transferElev = field.elev.slice();
    const transferWater = field.water?.slice() ?? null;
    worker.postMessage({ type: 'terrain', w: field.w, h: field.h, elev: transferElev, water: transferWater, cellSize: field.cellSize }, [transferElev.buffer, ...(transferWater ? [transferWater.buffer] : [])]);
    worker.onmessage = (event: MessageEvent<{ type: string; id: number; result: SearchResult }>) => {
      const waiter = pending.get(event.data.id);
      if (!waiter) return;
      pending.delete(event.data.id);
      waiter.resolve(event.data.result);
    };
    worker.onerror = (event: ErrorEvent) => {
      failed = true;
      worker?.terminate();
      worker = null;
      const error = new Error(event.message || 'Search worker failed.');
      for (const waiter of pending.values()) waiter.reject(error);
      pending.clear();
    };
  } catch {
    failed = true;
  }

  return {
    search(start, goal, maxGrade, algorithm) {
      if (!worker || failed) {
        return Promise.resolve(findRoute({ w: field.w, h: field.h, elev: field.elev, water: field.water, cellSize: field.cellSize, start, goal, maxGrade, algorithm }));
      }
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        worker?.postMessage({ type: 'search', id, start, goal, maxGrade, algorithm });
      });
    },
    dispose() {
      worker?.terminate();
      worker = null;
      for (const waiter of pending.values()) waiter.reject(new Error('Search client disposed.'));
      pending.clear();
    },
  };
}
