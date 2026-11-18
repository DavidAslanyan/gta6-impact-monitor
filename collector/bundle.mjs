// Packs every series into two compact grid files the website loads in one request each:
//   bundle/hourly.json  — whole history since BUNDLE_START, one value per series step (hour, or day for daily series)
//   bundle/recent.json  — last 48 hours at 5-minute resolution, for series that update that often
// Grid format per series: { s: startUnix, d: stepSeconds, v: [value|null, ...] }
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA, writeJson } from './lib.mjs';

const BUNDLE_START = Date.UTC(2026, 9, 14) / 1000; // 14 Oct 2026: five weeks before the first unlock
const now = Math.floor(Date.now() / 1000);

async function readSeries(id) {
  const dir = join(DATA, 'series', id);
  const pts = [];
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.ndjson')).sort()) {
    for (const line of (await readFile(join(dir, f), 'utf8')).split('\n')) {
      if (line) pts.push(JSON.parse(line));
    }
  }
  return pts.sort((a, b) => a[0] - b[0]);
}

function medianGap(pts) {
  if (pts.length < 3) return 3600;
  const gaps = [];
  for (let i = 1; i < pts.length; i++) gaps.push(pts[i][0] - pts[i - 1][0]);
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

const round = (v) => (Math.abs(v) >= 1000 ? Math.round(v) : Math.abs(v) >= 1 ? +v.toFixed(2) : +v.toPrecision(4));

function grid(pts, step, from, to) {
  const start = Math.floor(from / step) * step;
  const n = Math.max(0, Math.floor((to - start) / step) + 1);
  const sum = new Float64Array(n);
  const cnt = new Uint32Array(n);
  for (const [t, v] of pts) {
    if (t < start || t > to) continue;
    const i = Math.floor((t - start) / step);
    if (i >= 0 && i < n) { sum[i] += v; cnt[i]++; }
  }
  // Trim leading/trailing empties.
  let a = 0, b = n - 1;
  while (a < n && !cnt[a]) a++;
  while (b >= a && !cnt[b]) b--;
  if (a > b) return null;
  const v = [];
  for (let i = a; i <= b; i++) v.push(cnt[i] ? round(sum[i] / cnt[i]) : null);
  return { s: start + a * step, d: step, v };
}

const ids = (await readdir(join(DATA, 'series'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
const hourly = {}, recent = {};
for (const id of ids) {
  const pts = await readSeries(id);
  if (!pts.length) continue;
  const gap = medianGap(pts);
  const step = gap >= 20 * 3600 ? 86400 : 3600;
  // A daily bucket is only complete once its day has ended; drop the growing partial day.
  const g = grid(step === 86400 ? pts.filter(([t]) => t + 86400 <= now) : pts, step, BUNDLE_START, now);
  if (g) hourly[id] = g;
  if (gap < 3600) {
    const r = grid(pts, 300, now - 48 * 3600, now);
    if (r) recent[id] = r;
  }
}

// Derived: the Homework index = sum of the 16 basket articles, only on days where every article is present.
const basket = ids.filter((id) => id.startsWith('study.wiki.'));
if (basket.length === 16) {
  const per = await Promise.all(basket.map(readSeries));
  const days = new Map();
  for (const pts of per) for (const [t, v] of pts) { const d = days.get(t) || [0, 0]; d[0] += v; d[1]++; days.set(t, d); }
  const pts = [...days.entries()].filter(([, [, n]]) => n === basket.length).map(([t, [sum]]) => [t, sum]).sort((a, b) => a[0] - b[0]);
  const g = grid(pts.filter(([t]) => t + 86400 <= now), 86400, BUNDLE_START, now);
  if (g) hourly['study.homework_index.daily'] = g;
}
for (const id of basket) delete hourly[id];

await writeJson(join(DATA, 'bundle', 'hourly.json'), { generated: now, series: hourly }, false);
await writeJson(join(DATA, 'bundle', 'recent.json'), { generated: now, series: recent }, false);
console.log(`bundle: ${Object.keys(hourly).length} hourly, ${Object.keys(recent).length} recent series`);
