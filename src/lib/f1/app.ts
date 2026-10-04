import circuitsData from '../../data/f1/circuits.json';
import { classics, pickTrackOfWeek, type Calendar, type Race } from './calendar';
import { computeIdealLine, type IdealLine } from './racingLine';
import { drawFitness, TrackRenderer } from './render';
import { Evolution } from './sim';
import { createTrack, type Circuit, type Track } from './track';

const circuits = circuitsData as Circuit[];
const lineCache = new Map<string, IdealLine>();
type AppRoot = HTMLElement;

export function mount(root: AppRoot): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-race-canvas]');
  const chart = root.querySelector<HTMLCanvasElement>('[data-fitness-chart]');
  const select = root.querySelector<HTMLSelectElement>('[data-circuit-select]');
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  const reset = root.querySelector<HTMLButtonElement>('[data-reset]');
  const train = root.querySelector<HTMLButtonElement>('[data-train]');
  const trainCount = root.querySelector<HTMLInputElement>('[data-train-count]');
  const speed = root.querySelector<HTMLSelectElement>('[data-speed]');
  const mutation = root.querySelector<HTMLInputElement>('[data-mutation]');
  const idealToggle = root.querySelector<HTMLInputElement>('[data-ideal-toggle]');
  const status = root.querySelector<HTMLElement>('[data-race-status]');
  const generation = root.querySelector<HTMLElement>('[data-generation]');
  const alive = root.querySelector<HTMLElement>('[data-alive]');
  const progress = root.querySelector<HTMLElement>('[data-progress]');
  const lap = root.querySelector<HTMLElement>('[data-lap]');
  const compare = root.querySelector<HTMLElement>('[data-compare]');
  const raceCard = root.closest('section')?.querySelector<HTMLElement>('[data-race-week]');
  if (!canvas || !chart || !select || !play || !reset || !train || !trainCount || !speed || !mutation || !idealToggle || !status || !generation || !alive || !progress || !lap || !compare || !raceCard) return () => {};
  const events = new AbortController(), motion = matchMedia('(prefers-reduced-motion: reduce)');
  const rawCalendar = JSON.parse(root.querySelector<HTMLScriptElement>('[data-calendar-json]')?.textContent ?? '{}') as Calendar;
  const calendar: Calendar = { ...rawCalendar, Races: rawCalendar.Races ?? [] };
  const race = pickTrackOfWeek(calendar, new Date());
  const byId = new Map(circuits.map(circuit => [circuit.id, circuit]));
  for (const round of calendar.Races) {
    if (!select.querySelector(`option[value="${CSS.escape(round.outlineId ?? '')}"]`) && round.outlineId && byId.has(round.outlineId)) {
      const option = document.createElement('option'); option.value = round.outlineId; option.textContent = `${round.round.padStart(2, '0')} · ${round.Circuit.circuitName}`; select.append(option);
    }
  }
  for (const id of classics) {
    const circuit = byId.get(id); if (!circuit || select.querySelector(`option[value="${id}"]`)) continue;
    const option = document.createElement('option'); option.value = id; option.textContent = `Classic · ${circuit.name}`; select.append(option);
  }
  if (race) {
    const date = new Date(`${race.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    raceCard.querySelector('[data-race-name]')!.textContent = race.raceName;
    raceCard.querySelector('[data-race-date]')!.textContent = date;
    raceCard.querySelector('[data-race-circuit]')!.textContent = `${race.Circuit.circuitName} · ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;
    if (race.outlineId) select.value = race.outlineId;
  } else raceCard.querySelector('[data-race-name]')!.textContent = 'No race calendar is available.';
  let track: Track = createTrack(byId.get(select.value) ?? circuits[0]);
  let ideal = lineCache.get(track.circuit.id) ?? computeIdealLine(track); lineCache.set(track.circuit.id, ideal);
  const renderer = new TrackRenderer(canvas, canvas.getContext('2d')!);
  let simulation = new Evolution(track), raf = 0, disposed = false, training = false, trainingToken = 0;
  const cancelTraining = () => { training = false; trainingToken++; };
  const updateStats = () => {
    const stats = simulation.stats(); generation.textContent = String(stats.generation); alive.textContent = String(stats.alive); progress.textContent = `${Math.max(stats.bestProgress, 0).toFixed(1)}%`;
    lap.textContent = simulation.bestLap === null ? 'No lap yet' : `${simulation.bestLap.toFixed(1)} s`;
    compare.textContent = simulation.bestLap === null ? `No AI lap yet · ideal-line estimate: ${ideal.lapSeconds.toFixed(1)} s (simulated)` : `Best AI ${simulation.bestLap.toFixed(1)} s · ideal ${ideal.lapSeconds.toFixed(1)} s (simulated)`;
    drawFitness(chart, simulation.getHistory());
  };
  const draw = () => { renderer.draw(track, ideal, simulation, idealToggle.checked); updateStats(); };
  const resize = () => { renderer.resize(track); draw(); };
  const run = () => {
    raf = 0; if (disposed) return;
    if (play.getAttribute('aria-pressed') === 'true' && !document.hidden && !training) {
      const steps = Number(speed.value); simulation.step(steps); draw();
    }
    if (play.getAttribute('aria-pressed') === 'true' || training) raf = requestAnimationFrame(run);
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(run); };
  play.addEventListener('click', () => {
    const active = play.getAttribute('aria-pressed') !== 'true'; play.setAttribute('aria-pressed', String(active)); play.textContent = active ? 'Pause' : 'Play';
    status.textContent = active ? 'Simulation running. Each generation selects its strongest drivers.' : 'Simulation paused.'; if (active) schedule();
  }, { signal: events.signal });
  reset.addEventListener('click', () => { cancelTraining(); simulation.reset(); play.setAttribute('aria-pressed', 'false'); play.textContent = 'Play'; draw(); status.textContent = 'Population reset. Start when you are ready.'; }, { signal: events.signal });
  train.addEventListener('click', () => {
    if (training) return;
    training = true; const token = ++trainingToken; play.setAttribute('aria-pressed', 'false'); play.textContent = 'Play';
    const count = Math.max(1, Math.min(500, Math.floor(Number(trainCount.value) || 10)));
    const goal = simulation.generation + count;
    status.textContent = `Training ${count} generations; the canvas stays responsive while cars run headless.`;
    const chunk = () => {
      if (disposed || !training || token !== trainingToken) return;
      for (let i = 0; i < 5 && simulation.generation < goal; i++) simulation.step(40);
      if (simulation.generation >= goal) { training = false; draw(); status.textContent = `Training complete: generation ${simulation.generation}, best progress ${simulation.bestProgress.toFixed(1)}%.`; }
      else { draw(); setTimeout(chunk, 0); }
    };
    chunk();
  }, { signal: events.signal });
  select.addEventListener('change', () => {
    const circuit = byId.get(select.value); if (!circuit) return;
    cancelTraining();
    track = createTrack(circuit); ideal = lineCache.get(circuit.id) ?? computeIdealLine(track); lineCache.set(circuit.id, ideal); simulation.changeTrack(track); resize();
    const selectedRace: Race | undefined = calendar.Races.find(item => item.outlineId === circuit.id);
    status.textContent = selectedRace ? `${selectedRace.Circuit.circuitName} selected. New population ready.` : `${circuit.name} selected. New population ready.`;
  }, { signal: events.signal });
  mutation.addEventListener('input', () => { simulation.setMutation(Number(mutation.value) / 100); root.querySelector<HTMLOutputElement>('[data-mutation-value]')!.value = `${mutation.value}%`; }, { signal: events.signal });
  idealToggle.addEventListener('change', draw, { signal: events.signal });
  window.addEventListener('resize', resize, { signal: events.signal });
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const theme = new MutationObserver(draw); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { play.setAttribute('aria-pressed', 'false'); play.textContent = 'Play'; draw(); } }, { signal: events.signal });
  resize(); updateStats();
  status.textContent = motion.matches ? 'Ready. Reduced motion is enabled; press Play to start the simulation.' : 'Ready. The simulation is paused; press Play to watch the population learn.';
  return () => { disposed = true; cancelTraining(); cancelAnimationFrame(raf); observer.disconnect(); theme.disconnect(); events.abort(); };
}
