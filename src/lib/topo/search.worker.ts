import { findRoute, type Algorithm, type SearchResult } from './pathfinding';

type Message =
  | { type: 'terrain'; w: number; h: number; elev: Float32Array; water: Uint8Array | null; cellSize: number }
  | { type: 'search'; id: number; start: number; goal: number; maxGrade: number; algorithm: Algorithm };

interface SearchReply { type: 'result'; id: number; result: SearchResult }

let terrain: { w: number; h: number; elev: Float32Array; water: Uint8Array | null; cellSize: number } | null = null;
// The project compiles with DOM types; this is the slice of the dedicated-worker scope used here.
interface WorkerScope {
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  postMessage(message: SearchReply, transfer: Transferable[]): void;
}
const scope = self as unknown as WorkerScope;
scope.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === 'terrain') {
    terrain = message;
    return;
  }
  if (!terrain) return;
  const result = findRoute({ ...terrain, start: message.start, goal: message.goal, maxGrade: message.maxGrade, algorithm: message.algorithm });
  const reply: SearchReply = { type: 'result', id: message.id, result };
  scope.postMessage(reply, [result.explored.buffer, ...(result.path ? [result.path.buffer] : [])]);
};
