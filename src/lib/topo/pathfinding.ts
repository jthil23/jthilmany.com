
export type Algorithm = 'dijkstra' | 'astar' | 'greedy';
export const ALGORITHMS: Algorithm[] = ['dijkstra', 'astar', 'greedy'];
export const ALGORITHM_LABELS: Record<Algorithm, string> = { dijkstra: 'Dijkstra', astar: 'A*', greedy: 'Greedy best-first' };

export interface SearchResult {
  algorithm: Algorithm;
  path: Int32Array | null;
  explored: Int32Array;
  nodes: number;
  milliseconds: number;
  length: number;
  gain: number;
  maxGrade: number;
}

export interface SearchInput {
  w: number;
  h: number;
  elev: Float32Array;
  water: Uint8Array | null;
  cellSize: number;
  start: number;
  goal: number;
  maxGrade: number;
  algorithm: Algorithm;
}

export interface EndpointPair {
  start: number;
  goal: number;
}

function stepGrade(w: number, cellSize: number, elev: Float32Array, from: number, to: number): number {
  const dx = Math.abs((from % w) - (to % w));
  const dy = Math.abs(Math.floor(from / w) - Math.floor(to / w));
  const horizontal = cellSize * (dx && dy ? Math.SQRT2 : 1);
  return Math.abs(elev[to] - elev[from]) / horizontal;
}

function edgePassable(w: number, cellSize: number, maxGrade: number, elev: Float32Array, from: number, to: number): boolean {
  const dx = Math.abs((from % w) - (to % w));
  const dy = Math.abs(Math.floor(from / w) - Math.floor(to / w));
  return dx <= 1 && dy <= 1 && (dx !== 0 || dy !== 0) && stepGrade(w, cellSize, elev, from, to) <= maxGrade / 100;
}

/** Pick a dry pair in one max-grade-connected component, preferring a long climb to higher ground. */
export function chooseConnectedEndpoints(
  field: { w: number; h: number; elev: Float32Array; water: Uint8Array | null; cellSize: number },
  maxGrade: number,
  seed: number,
): EndpointPair | null {
  const { w, h, elev, water, cellSize } = field;
  const count = w * h;
  if (count < 2 || elev.length < count || (water && water.length < count) || !Number.isFinite(maxGrade) || maxGrade < 0) return null;
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const seen = new Uint32Array(count);
  const queue = new Int32Array(count);
  const diagonal = Math.hypot(w - 1, h - 1);
  const minDistance = diagonal * 0.4;
  const maxDistance = diagonal * 0.72;
  let highestElevation = -Infinity;
  let lowestElevation = Infinity;
  for (let i = 0; i < count; i++) {
    highestElevation = Math.max(highestElevation, elev[i]);
    lowestElevation = Math.min(lowestElevation, elev[i]);
  }
  const elevationRange = Math.max(1, highestElevation - lowestElevation);
  let visit = 0;
  let bestFallback: EndpointPair | null = null;
  let bestFallbackScore = -Infinity;

  for (let attempt = 0; attempt < 20; attempt++) {
    let start = Math.floor(random() * count);
    for (let scan = 0; scan < count && water?.[start]; scan++) start = (start + 1) % count;
    if (water?.[start]) break;
    visit++;
    let size = 1;
    queue[0] = start;
    seen[start] = visit;
    for (let head = 0; head < size; head++) {
      const current = queue[head];
      const x = current % w;
      const y = Math.floor(current / w);
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if ((!dx && !dy) || x + dx < 0 || x + dx >= w) continue;
          const next = ny * w + x + dx;
          if (seen[next] === visit || water?.[next] || !edgePassable(w, cellSize, maxGrade, elev, current, next)) continue;
          seen[next] = visit;
          queue[size++] = next;
        }
      }
    }

    let selectedGoal = -1;
    let selectedScore = Infinity;
    let farthestGoal = -1;
    let farthestScore = -Infinity;
    const sx = start % w;
    const sy = Math.floor(start / w);
    const targetDistance = (minDistance + maxDistance) * 0.5;
    for (let i = 1; i < size; i++) {
      const goal = queue[i];
      const distance = Math.hypot(goal % w - sx, Math.floor(goal / w) - sy);
      const summitPenalty = elev[goal] >= elev[start] ? (highestElevation - elev[goal]) / elevationRange * diagonal * 0.04 : diagonal * 0.5;
      const preferredScore = Math.abs(distance - targetDistance) + summitPenalty + random() * 0.5;
      if (distance >= minDistance && distance <= maxDistance && preferredScore < selectedScore) {
        selectedGoal = goal;
        selectedScore = preferredScore;
      }
      const distantScore = distance - summitPenalty;
      if (distantScore > farthestScore) {
        farthestGoal = goal;
        farthestScore = distantScore;
      }
    }
    if (selectedGoal >= 0) return { start, goal: selectedGoal };
    if (farthestGoal >= 0 && farthestScore > bestFallbackScore) {
      bestFallback = { start, goal: farthestGoal };
      bestFallbackScore = farthestScore;
    }
  }

  if (bestFallback) return bestFallback;
  for (let from = 0; from < count; from++) {
    if (water?.[from]) continue;
    const x = from % w;
    const y = Math.floor(from / w);
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || x + dx < 0 || x + dx >= w) continue;
        const goal = ny * w + x + dx;
        if (!water?.[goal] && edgePassable(w, cellSize, maxGrade, elev, from, goal)) return { start: from, goal };
      }
    }
  }
  return null;
}


class MinHeap {
  private nodes = new Int32Array(1024);
  private priorities = new Float64Array(1024);
  private ties = new Float64Array(1024);
  size = 0;

  push(node: number, priority: number, tie = 0): void {
    if (this.size >= this.nodes.length) {
      const nextNodes = new Int32Array(this.nodes.length * 2);
      nextNodes.set(this.nodes);
      const nextPriorities = new Float64Array(this.priorities.length * 2);
      nextPriorities.set(this.priorities);
      const nextTies = new Float64Array(this.ties.length * 2);
      nextTies.set(this.ties);
      this.nodes = nextNodes;
      this.priorities = nextPriorities;
      this.ties = nextTies;
    }
    let i = this.size++;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priorities[parent] < priority || (this.priorities[parent] === priority && this.ties[parent] <= tie)) break;
      this.nodes[i] = this.nodes[parent];
      this.priorities[i] = this.priorities[parent];
      this.ties[i] = this.ties[parent];
      i = parent;
    }
    this.nodes[i] = node;
    this.priorities[i] = priority;
    this.ties[i] = tie;
  }

  pop(): number {
    const node = this.nodes[0];
    const last = --this.size;
    const lastNode = this.nodes[last];
    const lastPriority = this.priorities[last];
    const lastTie = this.ties[last];
    let i = 0;
    const half = this.size >> 1;
    while (i < half) {
      let child = i * 2 + 1;
      const right = child + 1;
      if (right < this.size && (this.priorities[right] < this.priorities[child] || (this.priorities[right] === this.priorities[child] && this.ties[right] < this.ties[child]))) child = right;
      if (this.priorities[child] > lastPriority || (this.priorities[child] === lastPriority && this.ties[child] >= lastTie)) break;
      this.nodes[i] = this.nodes[child];
      this.priorities[i] = this.priorities[child];
      this.ties[i] = this.ties[child];
      i = child;
    }
    if (this.size) {
      this.nodes[i] = lastNode;
      this.priorities[i] = lastPriority;
      this.ties[i] = lastTie;
    }
    return node;
  }
}

const CLIMB_COST = 8.33; // Naismith's rule: roughly one horizontal km per 120 m climbed.

function octileDistance(a: number, b: number, w: number, cellSize: number): number {
  const dx = Math.abs((a % w) - (b % w));
  const dy = Math.abs(Math.floor(a / w) - Math.floor(b / w));
  const diagonal = Math.min(dx, dy);
  return cellSize * (Math.max(dx, dy) + (Math.SQRT2 - 1) * diagonal);
}

function routeStats(path: Int32Array, input: SearchInput): Pick<SearchResult, 'length' | 'gain' | 'maxGrade'> {
  let length = 0;
  let gain = 0;
  let maxGrade = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const dx = Math.abs((a % input.w) - (b % input.w));
    const dy = Math.abs(Math.floor(a / input.w) - Math.floor(b / input.w));
    const horizontal = input.cellSize * (dx && dy ? Math.SQRT2 : 1);
    const delta = input.elev[b] - input.elev[a];
    length += Math.hypot(horizontal, delta);
    if (delta > 0) gain += delta;
    maxGrade = Math.max(maxGrade, Math.abs(delta) / horizontal * 100);
  }
  return { length, gain, maxGrade };
}

/** 8-connected Dijkstra, A* (octile + minimum climb lower bound), or greedy best-first search. */
export function findRoute(input: SearchInput): SearchResult {
  const began = performance.now();
  const n = input.w * input.h;
  const { start, goal, w, h, elev, water, cellSize, maxGrade, algorithm } = input;
  const empty = new Int32Array(0);
  if (start < 0 || start >= n || goal < 0 || goal >= n || (water && (water[start] || water[goal]))) {
    return { algorithm, path: null, explored: empty, nodes: 0, milliseconds: performance.now() - began, length: 0, gain: 0, maxGrade: 0 };
  }
  const g = new Float64Array(n);
  g.fill(Infinity);
  g[start] = 0;
  const parent = new Int32Array(n);
  parent.fill(-1);
  const closed = new Uint8Array(n);
  const explored = new Int32Array(n);
  let exploredCount = 0;
  const heap = new MinHeap();
  heap.push(start, 0);
  const directions = [-1, 0, 1];

  while (heap.size) {
    const current = heap.pop();
    if (closed[current]) continue;
    closed[current] = 1;
    explored[exploredCount++] = current;
    if (current === goal) break;
    const x = current % w;
    const y = Math.floor(current / w);
    for (const dy of directions) {
      const ny = y + dy;
      if (ny < 0 || ny >= h) continue;
      for (const dx of directions) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= w) continue;
        const next = ny * w + nx;
        if (closed[next] || (water && water[next])) continue;
        const horizontal = cellSize * (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
        const dz = elev[next] - elev[current];
        const grade = stepGrade(w, cellSize, elev, current, next);
        if (grade > maxGrade / 100) continue;
        // Flat distance plus explicit climb cost; a small symmetric grade term favors traversable ground.
        const edgeCost = horizontal + CLIMB_COST * Math.max(0, dz) + horizontal * 0.18 * grade * grade;
        const candidate = g[current] + edgeCost;
        if (candidate >= g[next]) continue;
        g[next] = candidate;
        parent[next] = current;
        const heuristic = octileDistance(next, goal, w, cellSize) + CLIMB_COST * Math.max(0, elev[goal] - elev[next]);
        const priority = algorithm === 'dijkstra' ? candidate : algorithm === 'greedy' ? heuristic : candidate + heuristic;
        const tie = algorithm === 'astar' ? heuristic : 0;
        heap.push(next, priority, tie);
      }
    }
  }

  let path: Int32Array | null = null;
  if (closed[goal]) {
    const reversed: number[] = [];
    let at = goal;
    while (at >= 0) { reversed.push(at); if (at === start) break; at = parent[at]; }
    if (reversed[reversed.length - 1] === start) path = Int32Array.from(reversed.reverse());
  }
  const stats = path ? routeStats(path, input) : { length: 0, gain: 0, maxGrade: 0 };
  return {
    algorithm, path, explored: explored.slice(0, exploredCount), nodes: exploredCount,
    milliseconds: performance.now() - began, ...stats,
  };
}
