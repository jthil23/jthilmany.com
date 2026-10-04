import { INPUTS, HIDDEN, crossover, evaluate, mutate, randomGenome } from './nn';
import { curvatureAt, pointAt, project, rayDistance, type Track } from './track';

export interface Car { genome: Float32Array; x: number; y: number; heading: number; speed: number; segment: number; progress: number; startProgress: number; lapEligible: boolean; alive: boolean; finished: boolean; time: number; fitness: number; idleSteps: number; inputs: number[]; outputs: number[]; hidden: Float32Array; trail: { x: number; y: number }[] }
export interface GenerationStats { generation: number; alive: number; bestFitness: number; averageFitness: number; bestProgress: number; bestLap: number | null }

const POPULATION = 64, DT = 1 / 30, MAX_SPEED = 92, MAX_STEER = .55;
const ENGINE = 16, BRAKE = 38, GRIP = 28, WHEELBASE = 3.6;
const SENSOR_ANGLES = [-1.15, -.78, -.42, 0, .42, .78, 1.15];
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const angleDifference = (to: number, from: number): number => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export class Evolution {
  cars: Car[] = [];
  generation = 1;
  bestLap: number | null = null;
  bestProgress = 0;
  bestFitness = 0;
  averageFitness = 0;
  private history: { best: number; average: number }[] = [];
  private rng: () => number;
  private steps = 0;
  private mutationRate = .12;
  private timeLimit = 0;

  constructor(public track: Track, seed = 92341) {
    let state = seed >>> 0;
    this.rng = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    this.updateTimeLimit();
    this.reset();
  }

  setMutation(rate: number): void { this.mutationRate = clamp(rate, .01, .5); }
  private updateTimeLimit(): void { this.timeLimit = this.track.length / 50 * 2.5; }

  reset(): void {
    this.cars = Array.from({ length: POPULATION }, () => this.spawn(randomGenome(this.rng)));
    this.generation = 1;
    this.steps = 0;
    this.bestLap = null;
    this.bestProgress = 0;
    this.bestFitness = 0;
    this.averageFitness = 0;
    this.history = [];
  }

  changeTrack(track: Track): void {
    this.track = track;
    this.updateTimeLimit();
    this.reset();
  }

  getHistory(): { best: number; average: number }[] { return this.history; }

  stats(): GenerationStats {
    let alive = 0;
    for (const car of this.cars) if (car.alive) alive++;
    return { generation: this.generation, alive, bestFitness: this.bestFitness, averageFitness: this.averageFitness, bestProgress: this.bestProgress, bestLap: this.bestLap };
  }

  private spawn(genome: Float32Array, startProgress = 0): Car {
    const progress = clamp(startProgress, 0, this.track.length - 1);
    const p = pointAt(this.track, progress + 5), q = pointAt(this.track, progress + 6);
    const approximateIndex = Math.floor(progress / this.track.length * this.track.points.length);
    const segment = project(this.track, p.x, p.y, approximateIndex, 4).index;
    return {
      genome, x: p.x, y: p.y, heading: Math.atan2(q.y - p.y, q.x - p.x), speed: 0, segment, progress, startProgress: progress,
      lapEligible: progress < 1, alive: true, finished: false, time: 0, fitness: 0, idleSteps: 0,
      inputs: new Array<number>(INPUTS), outputs: new Array<number>(2), hidden: new Float32Array(HIDDEN), trail: [],
    };
  }

  step(count = 1): void {
    const generation = this.generation;
    for (let step = 0; step < count && this.generation === generation; step++) {
      this.steps++;
      for (const car of this.cars) if (car.alive) this.drive(car);
      if (this.cars.every(car => !car.alive) || this.steps >= this.timeLimit / DT) this.evolve();
    }
  }

  private drive(car: Car): void {
    const { track } = this, previous = car.progress;
    const projection = project(track, car.x, car.y, car.segment, 3, previous, Math.max(8, car.speed * DT * 3 + 2));
    const wall = project(track, car.x, car.y, projection.index, 2);
    const nextWall = (wall.index + 1) % track.halfWidths.length;
    const wallWidth = track.halfWidths[wall.index] + (track.halfWidths[nextWall] - track.halfWidths[wall.index]) * wall.t;
    car.segment = projection.index;
    car.time += DT;

    let delta = projection.progress - previous;
    if (delta < -track.length * .5) delta += track.length;
    if (delta < -15 || delta > Math.max(35, car.speed * DT * 3 + 5) || wall.distance > wallWidth + .5) {
      car.alive = false;
      car.fitness = Math.max(car.fitness, previous - car.startProgress);
      return;
    }
    car.progress += Math.max(0, delta);
    if (delta < .15) car.idleSteps++; else car.idleSteps = 0;
    if (car.idleSteps > 90) { car.alive = false; car.fitness = Math.max(0, car.progress - car.startProgress); return; }

    const inputs = car.inputs, output = car.outputs;
    for (let i = 0; i < SENSOR_ANGLES.length; i++) {
      inputs[i] = rayDistance(track, car.x, car.y, car.heading + SENSOR_ANGLES[i], 90, car.segment) / 90 * 2 - 1;
    }
    inputs[7] = car.speed / MAX_SPEED;
    inputs[8] = clamp(curvatureAt(track, car.progress + 20) * 12, -1, 1);
    inputs[9] = clamp(curvatureAt(track, car.progress + 50) * 12, -1, 1);
    inputs[10] = clamp(curvatureAt(track, car.progress + 100) * 12, -1, 1);
    for (const [index, distance] of [[11, 20], [12, 50]] as const) {
      const target = pointAt(track, car.progress + distance);
      inputs[index] = angleDifference(Math.atan2(target.y - car.y, target.x - car.x), car.heading) / Math.PI;
    }
    inputs[13] = clamp(projection.lateral / Math.max(1, wallWidth), -1, 1);
    const tangentHeading = Math.atan2(projection.tangentY, projection.tangentX);
    inputs[14] = angleDifference(tangentHeading, car.heading) / Math.PI;
    evaluate(car.genome, inputs, output, car.hidden);

    // The network owns both controls; positive power accelerates and negative power brakes.
    const control = output[1];
    car.speed = clamp(car.speed + (control >= 0 ? control * ENGINE : control * BRAKE) * DT, 0, MAX_SPEED);
    const desiredYaw = car.speed / WHEELBASE * Math.tan(output[0] * MAX_STEER);
    const maxYaw = GRIP / Math.max(1, car.speed);
    car.heading += clamp(desiredYaw, -maxYaw, maxYaw) * DT;
    car.x += Math.cos(car.heading) * car.speed * DT;
    car.y += Math.sin(car.heading) * car.speed * DT;

    if (car.progress > previous + 1) {
      car.trail.push({ x: car.x, y: car.y });
      if (car.trail.length > 130) car.trail.shift();
    }
    if (car.progress > track.length) {
      if (car.lapEligible) {
        car.finished = true;
        car.alive = false;
        if (this.bestLap === null || car.time < this.bestLap) this.bestLap = car.time;
      } else car.alive = false;
    }
    car.fitness = Math.max(0, car.progress - car.startProgress) + (car.finished ? track.length * .25 * Math.max(0, 1 - car.time / 180) : 0);
    if (car.time > this.timeLimit) car.alive = false;
  }

  private tournament(sorted: Car[]): Car {
    let best = sorted[Math.floor(this.rng() * sorted.length)];
    for (let contender = 1; contender < 4; contender++) {
      const candidate = sorted[Math.floor(this.rng() * sorted.length)];
      if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
  }

  private evolve(): void {
    const sorted = [...this.cars].sort((a, b) => b.fitness - a.fitness);
    this.bestFitness = sorted[0]?.fitness ?? 0;
    this.averageFitness = this.cars.reduce((sum, car) => sum + car.fitness, 0) / this.cars.length;
    this.bestProgress = Math.min(100, Math.max(...this.cars.map(car => car.progress)) / this.track.length * 100);
    this.history.push({ best: this.bestFitness / this.track.length * 100, average: this.averageFitness / this.track.length * 100 });
    if (this.history.length > 50) this.history.shift();

    const next: Car[] = [], checkpoint = Math.max(0, sorted[0].progress - 60);
    const startCount = Math.ceil(POPULATION * .25);
    for (let i = 0; i < 4; i++) next.push(this.spawn(sorted[i].genome.slice(), i < 2 ? 0 : checkpoint));
    const annealing = Math.max(.35, Math.pow(.97, this.generation - 1));
    while (next.length < POPULATION) {
      const child = crossover(this.tournament(sorted).genome, this.tournament(sorted).genome, this.rng);
      mutate(child, this.mutationRate * annealing, this.rng);
      next.push(this.spawn(child, next.length < startCount ? 0 : checkpoint));
    }
    this.cars = next;
    this.generation++;
    this.steps = 0;
  }

  trainGenerations(count: number): void {
    const goal = this.generation + count;
    while (this.generation < goal) this.step(40);
  }

  bestCar(): Car {
    let best = this.cars[0];
    for (let index = 1; index < this.cars.length; index++) if (this.cars[index].fitness > best.fitness) best = this.cars[index];
    return best;
  }
}
