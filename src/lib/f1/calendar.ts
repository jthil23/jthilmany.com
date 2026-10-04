import type { Circuit } from './track';
export interface CalendarSource { season?: string; MRData?: { RaceTable?: { Races?: unknown[] } }; Races?: unknown[] }
export interface Race { season: string; round: string; raceName: string; date: string; time?: string; Circuit: { circuitId: string; circuitName: string; Location: { locality: string; country: string } }; FirstPractice?: { date: string; time?: string }; outlineId: string | null }
export interface Calendar { season: string; Races: Race[] }
export const circuitMap: Record<string, string> = { albert_park: 'au-1953', shanghai: 'cn-2004', suzuka: 'jp-1962', miami: 'us-2022', villeneuve: 'ca-1978', monaco: 'mc-1929', catalunya: 'es-1991', red_bull_ring: 'at-1969', silverstone: 'gb-1948', spa: 'be-1925', hungaroring: 'hu-1986', zandvoort: 'nl-1948', monza: 'it-1922', madring: 'es-2026', baku: 'az-2016', sepang: 'my-1999', marina_bay: 'sg-2008', americas: 'us-2012', rodriguez: 'mx-1962', interlagos: 'br-1940', vegas: 'us-2023', losail: 'qa-2004', yas_marina: 'ae-2009' };
export const classics = ['it-1953', 'de-1927', 'de-1932', 'tr-2005', 'bh-2002', 'sa-2021'];
export function normalizeCalendar(raw: CalendarSource, circuits: Circuit[]): Calendar {
  const circuitIds = new Set(circuits.map(circuit => circuit.id));
  const races = (raw.Races ?? raw.MRData?.RaceTable?.Races ?? []) as Record<string, unknown>[];
  return { season: String(raw.season ?? (races[0]?.season ?? new Date().getUTCFullYear())), Races: races.map(item => {
    const circuit = item.Circuit as Race['Circuit'];
    return { season: String(item.season), round: String(item.round), raceName: String(item.raceName), date: String(item.date), time: typeof item.time === 'string' ? item.time : undefined, Circuit: { circuitId: circuit.circuitId, circuitName: circuit.circuitName, Location: { locality: circuit.Location.locality, country: circuit.Location.country } }, FirstPractice: item.FirstPractice as Race['FirstPractice'], outlineId: circuitMap[circuit.circuitId] && circuitIds.has(circuitMap[circuit.circuitId]) ? circuitMap[circuit.circuitId] : null };
  }) };
}
export function pickTrackOfWeek(calendar: Calendar, now: Date): Race | null {
  if (!calendar.Races.length) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const races = [...calendar.Races].sort((a, b) => a.date.localeCompare(b.date));
  const starts = (race: Race) => Date.parse(`${race.FirstPractice?.date ?? race.date}T00:00:00Z`);
  const ends = (race: Race) => Date.parse(`${race.date}T23:59:59Z`);
  const inWeekend = races.find(race => today >= starts(race) && today <= ends(race));
  if (inWeekend) return inWeekend;
  return races.find(race => Date.parse(`${race.date}T00:00:00Z`) >= today) ?? races[races.length - 1];
}
