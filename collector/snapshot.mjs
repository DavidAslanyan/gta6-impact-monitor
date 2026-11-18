// Takes one snapshot of every source and appends the values to data/series.
// Usage: node collector/snapshot.mjs [sourceKey ...]
import { join } from 'node:path';
import { SOURCES } from './sources.mjs';
import { DATA, appendPoint, readJson, writeJson } from './lib.mjs';

const only = process.argv.slice(2);
const t = Math.floor(Date.now() / 1000);
const latestFile = join(DATA, 'latest.json');
const healthFile = join(DATA, 'health.json');
const latest = await readJson(latestFile, {});
const health = await readJson(healthFile, {});

const chosen = SOURCES.filter((s) => !only.length || only.includes(s.key));
const results = await Promise.allSettled(chosen.map((s) => s.run()));

let okCount = 0;
for (let i = 0; i < chosen.length; i++) {
  const src = chosen[i];
  const r = results[i];
  const prev = health[src.key] || {};
  if (r.status === 'fulfilled') {
    okCount++;
    for (const [id, v] of Object.entries(r.value)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      await appendPoint(id, t, v);
      latest[id] = [t, v];
    }
    health[src.key] = { ok: true, lastOk: t, unofficial: !!src.unofficial, failingSince: null };
  } else {
    health[src.key] = {
      ok: false,
      lastOk: prev.lastOk ?? null,
      unofficial: !!src.unofficial,
      failingSince: prev.failingSince ?? t,
      error: String(r.reason?.message || r.reason).slice(0, 200),
    };
  }
}

await writeJson(latestFile, latest);
await writeJson(healthFile, health);
console.log(`[${new Date(t * 1000).toISOString()}] snapshot: ${okCount}/${chosen.length} sources ok`);
for (const [k, h] of Object.entries(health)) if (!h.ok) console.log(`  ✗ ${k}: ${h.error}`);
