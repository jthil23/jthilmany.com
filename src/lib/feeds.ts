import { XMLParser } from 'fast-xml-parser';
import { SyntaxValidator } from 'fast-xml-validator';
import { feeds, topics, type Feed, type TopicId } from '../data/feeds';

export interface RadarItem {
  title: string;
  url: string;
  source: string;
  topic: TopicId;
  published: string | null;
}

export interface FeedResult {
  feed: Feed;
  status: 'ok' | 'error';
  count: number;
  error?: string;
}

export interface RadarData {
  itemsByTopic: Record<TopicId, RadarItem[]>;
  feedResults: FeedResult[];
  updatedAt: Date;
}

const USER_AGENT = 'jthilmany.com-radar/1.0 (+https://jthilmany.com/radar; build-time headline fetcher)';
// Feeds are fetched in parallel at build time; hnrss.org regularly needs more than 8 s.
const FETCH_TIMEOUT_MS = 15_000;
const MAX_FEED_BYTES = 4 * 1024 * 1024;
const DEV_CACHE_MS = 60_000;
const topicIds = topics.map(({ id }) => id);
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: {
    maxEntitySize: 4 * 1024,
    maxExpansionDepth: 8,
    maxTotalExpansions: 10_000,
    maxExpandedLength: MAX_FEED_BYTES,
    maxEntityCount: 100,
  },
  htmlEntities: true,
  parseTagValue: false,
  trimValues: true,
  maxNestedTags: 100,
});

let cached: { expiresAt: number; promise: Promise<RadarData> } | undefined;

function asList(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  const text = record['#text'] ?? record['#cdata'];
  return typeof text === 'string' || typeof text === 'number' ? String(text) : '';
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|copy|reg|ndash|mdash|rsquo|lsquo|rdquo|ldquo|hellip);/gi, (entity, name: string) => {
    const lower = name.toLowerCase();
    if (lower[0] === '#') {
      const hex = lower[1] === 'x';
      const code = Number.parseInt(lower.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    const named: Record<string, string> = {
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '©', reg: '®',
      ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…',
    };
    return named[lower] ?? entity;
  });
}

/** Convert untrusted feed markup/entities into plain text for escaped Astro rendering. */
function plainText(value: unknown): string {
  const decoded = decodeEntities(asText(value));
  return decodeEntities(decoded.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function feedUrl(item: Record<string, unknown>): string | null {
  const atomLinks = asList(item.link).map(asRecord);
  const preferred = atomLinks.find((link) => {
    const rel = asText(link['@_rel']);
    return !rel || rel === 'alternate';
  });
  const candidate = preferred?.['@_href'] ?? item.link ?? item.guid ?? item.id;
  const text = asText(candidate).trim();
  if (!text) return null;
  try {
    const parsed = new URL(decodeEntities(text));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function publishedDate(item: Record<string, unknown>): string | null {
  for (const key of ['pubDate', 'published', 'updated', 'date', 'dc:date']) {
    const raw = asText(item[key]).trim();
    if (!raw) continue;
    const timestamp = Date.parse(raw);
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString();
  }
  return null;
}

function parseItems(xml: string, feed: Feed): RadarItem[] {
  // Validate first: HTML error pages and malformed documents throw.
  SyntaxValidator.validate(xml);
  const root = asRecord(parser.parse(xml));
  const rss = asRecord(root.rss);
  // Key presence, not object shape: an empty <channel/> or <feed/> parses to '' and is a valid empty feed.
  if (!('channel' in rss) && !('rdf:RDF' in root) && !('feed' in root)) throw new Error('Response is not an RSS or Atom feed');
  const channel = asRecord(rss.channel ?? root['rdf:RDF'] ?? root.feed);
  const records = asList(channel.item ?? channel.entry);
  const parsed: RadarItem[] = [];
  for (const value of records) {
    const item = asRecord(value);
    const title = plainText(item.title);
    const url = feedUrl(item);
    if (!title || !url) continue;
    parsed.push({ title, url, source: feed.label, topic: feed.topic, published: publishedDate(item) });
  }
  return parsed;
}

async function fetchFeed(feed: Feed): Promise<{ items: RadarItem[]; result: FeedResult }> {
  try {
    const response = await fetch(feed.url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_FEED_BYTES) throw new Error('Feed exceeds 4 MiB limit');
    const xml = await response.text();
    if (new TextEncoder().encode(xml).byteLength > MAX_FEED_BYTES) throw new Error('Feed exceeds 4 MiB limit');
    const items = parseItems(xml, feed);
    return { items, result: { feed, status: 'ok', count: items.length } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fetch or parse error';
    console.warn(`[radar] ${feed.label} (${feed.url}) failed: ${message}`);
    return { items: [], result: { feed, status: 'error', count: 0, error: message } };
  }
}

async function loadRadarData(): Promise<RadarData> {
  const byNewest = (a: RadarItem, b: RadarItem) => (Date.parse(b.published ?? '') || 0) - (Date.parse(a.published ?? '') || 0);
  const responses = await Promise.all(feeds.map(async (feed) => {
    const response = await fetchFeed(feed);
    response.items = response.items.sort(byNewest).slice(0, 8);
    response.result.count = response.items.length;
    return response;
  }));
  const seen: Record<string, true> = {};
  const itemsByTopic: Record<TopicId, RadarItem[]> = { tech: [], ai: [], homelab: [], f1: [], microsoft: [] };
  for (const topic of topicIds) {
    const sources = responses.filter(({ result }) => result.feed.topic === topic).map(({ items }) => items);
    const topicItems = itemsByTopic[topic];
    // Round-robin across sources so one prolific feed cannot crowd out the rest; newest first within each round.
    for (let round = 0; round < 8 && topicItems.length < 25; round += 1) {
      const roundItems = sources.flatMap((items) => items[round] ?? []).sort(byNewest);
      for (const item of roundItems) {
        if (topicItems.length >= 25) break;
        if (seen[item.url]) continue;
        seen[item.url] = true;
        topicItems.push(item);
      }
    }
  }
  return {
    itemsByTopic,
    feedResults: responses.map(({ result }) => result),
    updatedAt: new Date(),
  };
}

/** Fetch and normalize RSS/Atom feeds. Network and XML errors are isolated per feed. */
export function getRadarData(): Promise<RadarData> {
  const now = Date.now();
  if (import.meta.env.DEV && cached && cached.expiresAt > now) return cached.promise;
  const promise = loadRadarData();
  if (import.meta.env.DEV) cached = { expiresAt: now + DEV_CACHE_MS, promise };
  return promise;
}
