import { mkdir, appendFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = join(ROOT, 'data');

export const UA = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  Accept: 'application/json,text/csv,*/*',
};

export async function getText(url, { headers = {}, timeoutMs = 25000 } = {}) {
  const res = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export async function getJson(url, opts) {
  return JSON.parse(await getText(url, opts));
}

/** Read a Server-Sent-Events or WebSocket stream for `ms` and return a counter result. */
export async function sampleSse(url, ms, onEvent) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  let buf = '';
  try {
    const res = await fetch(url, { headers: { ...UA, Accept: 'text/event-stream' }, signal: ctrl.signal });
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i);
        buf = buf.slice(i + 2);
        const data = block
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('\n');
        if (data) onEvent(data);
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  } finally {
    clearTimeout(timer);
  }
}

export function sampleWs(url, ms, onMessage) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let opened = false;
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      opened ? resolve() : reject(new Error('WebSocket never opened'));
    }, ms);
    ws.onopen = () => { opened = true; };
    ws.onmessage = (ev) => onMessage(typeof ev.data === 'string' ? ev.data : '');
    ws.onerror = () => { if (!opened) { clearTimeout(timer); reject(new Error('WebSocket error')); } };
  });
}

const monthKey = (t) => new Date(t * 1000).toISOString().slice(0, 7);

/** Append one point to data/series/<id>/<YYYY-MM>.ndjson as `[epochSeconds,value]`. */
export async function appendPoint(id, t, v) {
  const file = join(DATA, 'series', id, `${monthKey(t)}.ndjson`);
  await mkdir(dirname(file), { recursive: true });
  await appendFile(file, JSON.stringify([t, v]) + '\n');
}

export async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}

export async function writeJson(file, obj, pretty = true) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, (pretty ? JSON.stringify(obj, null, 1) : JSON.stringify(obj)) + "\n");
}

/** Merge many points into a series (dedupe by timestamp, newest value wins). points: [[t,v],...] */
export async function mergePoints(id, points) {
  const byMonth = new Map();
  for (const [t, v] of points) {
    if (!Number.isFinite(t) || typeof v !== 'number' || !Number.isFinite(v)) continue;
    const m = monthKey(t);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m).push([t, v]);
  }
  let latest = null;
  for (const [m, pts] of byMonth) {
    const file = join(DATA, 'series', id, `${m}.ndjson`);
    const map = new Map();
    try {
      for (const line of (await readFile(file, 'utf8')).split('\n')) {
        if (!line) continue;
        const [t, v] = JSON.parse(line);
        map.set(t, v);
      }
    } catch {}
    for (const [t, v] of pts) map.set(t, v);
    const sorted = [...map.entries()].sort((a, b) => a[0] - b[0]);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, sorted.map((p) => JSON.stringify(p)).join('\n') + '\n');
    const last = sorted[sorted.length - 1];
    if (!latest || last[0] > latest[0]) latest = last;
  }
  return latest;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const ymd = (d) => d.toISOString().slice(0, 10);
export const DAY = 86400;
