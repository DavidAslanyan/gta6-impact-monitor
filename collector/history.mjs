// History sources: APIs that keep their own history. Each run re-fetches a recent window and merges it,
// so gaps self-heal. On the first run (or with --backfill) they fetch ~35 days to build the Baseline.
// Usage: node collector/history.mjs [--backfill] [sourceKey ...]
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { DATA, DAY, UA, getJson, getText, mergePoints, readJson, sleep, writeJson, ymd } from './lib.mjs';

const args = process.argv.slice(2);
const FORCE_BACKFILL = args.includes('--backfill');
const only = args.filter((a) => !a.startsWith('--'));
const now = Math.floor(Date.now() / 1000);
const WIKI_UA = { 'Api-User-Agent': 'gta6-impact-monitor/1.0 (github.com/DavidAslanyan/gta6-impact-monitor)' };
const GH_HEADERS = process.env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
  : { Accept: 'application/vnd.github+json' };

const stateFile = join(DATA, 'history-state.json');
const state = await readJson(stateFile, {});
const isBackfill = (key) => FORCE_BACKFILL || !state[key]?.backfilled;
const wikiTs = (s) => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10)) / 1000;
const ymdCompact = (d) => ymd(d).replaceAll('-', '');

export const MARKETS = {
  TTWO: 'ttwo', SONY: 'sony', MSFT: 'msft', NVDA: 'nvda', AMD: 'amd', GME: 'gme', EA: 'ea', NTDOY: 'ntdoy',
  RBLX: 'rblx', NFLX: 'nflx', DASH: 'dash', UBER: 'uber', '.SPX': 'spx', '.IXIC': 'nasdaq', '.N225': 'nikkei',
  '.FTSE': 'ftse', '.NZ50': 'nzx50', '.VIX': 'vix', '@CL.1': 'crude', '@GC.1': 'gold', 'NZD=': 'nzdusd',
};

const HISTORY = [
  {
    key: 'markets',
    async run(backfill) {
      const out = {};
      for (const [sym, slug] of Object.entries(MARKETS)) {
        const pts = [];
        const enc = encodeURIComponent(sym);
        try {
          if (backfill) {
            const d = await getJson(`https://ts-api.cnbc.com/harmony/app/charts/1M.json?symbol=${enc}`);
            for (const b of d.barData?.priceBars || []) pts.push([Math.floor(b.tradeTimeinMills / 1000), +b.close]);
          }
          const i = await getJson(`https://ts-api.cnbc.com/harmony/app/charts/5D.json?symbol=${enc}`);
          for (const b of i.barData?.priceBars || []) pts.push([Math.floor(b.tradeTimeinMills / 1000), +b.close]);
        } catch {}
        if (pts.length) out[`mkt.${slug}.price`] = pts;
        await sleep(250);
      }
      return out;
    },
  },
  {
    key: 'crypto',
    async run(backfill) {
      const out = {};
      for (const [sym, slug] of [['BTCUSDT', 'btc'], ['ETHUSDT', 'eth']]) {
        const k = await getJson(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=1h&limit=${backfill ? 1000 : 48}`);
        out[`crypto.${slug}.price`] = k.map((r) => [r[0] / 1000, +r[4]]);
        out[`crypto.${slug}.trades_per_hour`] = k.map((r) => [r[0] / 1000, +r[8]]);
      }
      const f = await getJson(`https://api.alternative.me/fng/?limit=${backfill ? 120 : 5}`);
      out['crypto.fear_greed'] = f.data.map((d) => [+d.timestamp, +d.value]);
      return out;
    },
  },
  {
    key: 'wikipedia',
    async run(backfill) {
      const out = {};
      const start = new Date((now - (backfill ? 40 : 4) * DAY) * 1000);
      const end = new Date(now * 1000);
      const articles = {
        en: 'Grand_Theft_Auto_VI', de: 'Grand_Theft_Auto_VI', fr: 'Grand_Theft_Auto_VI', es: 'Grand_Theft_Auto_VI',
        pt: 'Grand_Theft_Auto_VI', it: 'Grand_Theft_Auto_VI', ru: 'Grand_Theft_Auto_VI', ja: 'グランド・セフト・オートVI',
      };
      let total = new Map();
      for (const [lang, title] of Object.entries(articles)) {
        try {
          const j = await getJson(
            `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/user/${encodeURIComponent(title)}/daily/${ymdCompact(start)}00/${ymdCompact(end)}00`,
            { headers: WIKI_UA },
          );
          const pts = j.items.map((it) => [wikiTs(it.timestamp), it.views]);
          out[`attention.wiki.gta6.${lang}.daily`] = pts;
          for (const [t, v] of pts) total.set(t, (total.get(t) || 0) + v);
        } catch {}
      }
      out['attention.wiki.gta6.all.daily'] = [...total.entries()];
      const agg = await getJson(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/all-projects/all-access/user/hourly/${ymdCompact(start)}00/${ymdCompact(end)}23`,
        { headers: WIKI_UA },
      );
      out['internet.wiki.views.hourly'] = agg.items.map((it) => [wikiTs(it.timestamp), it.views]);
      return out;
    },
  },
  {
    key: 'grid-gb',
    async run(backfill) {
      const pts = [];
      const days = backfill ? 35 : 2;
      for (let d = days; d > 0; d -= 7) {
        const from = new Date((now - d * DAY) * 1000).toISOString().slice(0, 16) + 'Z';
        const to = new Date((now - Math.max(d - 7, 0) * DAY) * 1000).toISOString().slice(0, 16) + 'Z';
        const j = await getJson(`https://data.elexon.co.uk/bmrs/api/v1/demand/outturn/summary?resolution=minute&from=${from}&to=${to}&format=json`);
        for (const r of j) pts.push([Date.parse(r.startTime) / 1000, r.demand]);
      }
      return { 'energy.gb.demand_mw': pts };
    },
  },
  {
    key: 'grid-fr',
    async run(backfill) {
      const since = ymd(new Date((now - (backfill ? 35 : 2) * DAY) * 1000));
      const rows = await getJson(
        `https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/exports/json?select=date_heure,consommation&where=consommation%20is%20not%20null%20and%20date_heure%3E%3D%22${since}%22`,
        { timeoutMs: 60000 },
      );
      return { 'energy.fr.demand_mw': rows.map((r) => [Date.parse(r.date_heure) / 1000, r.consommation]) };
    },
  },
  {
    key: 'grid-au',
    async run(backfill) {
      const out = {};
      const months = new Set([ymd(new Date(now * 1000)).slice(0, 7)]);
      if (backfill) months.add(ymd(new Date((now - 35 * DAY) * 1000)).slice(0, 7));
      for (const region of ['NSW1', 'VIC1', 'QLD1']) {
        const pts = [];
        for (const m of months) {
          const csv = await getText(`https://www.aemo.com.au/aemo/data/nem/priceanddemand/PRICE_AND_DEMAND_${m.replace('-', '')}_${region}.csv`, { timeoutMs: 60000 });
          for (const line of csv.split('\n').slice(1)) {
            const c = line.split(',');
            if (c.length < 3 || !c[1]) continue;
            // SETTLEMENTDATE is AEST (UTC+10, no DST in the NEM market clock) and marks the END of the 5-min interval.
            const [d, tm] = c[1].replaceAll('"', '').split(' ');
            const t = Date.parse(`${d.replaceAll('/', '-')}T${tm}+10:00`) / 1000;
            if (!backfill && t < now - 3 * DAY) continue;
            pts.push([t, +c[2]]);
          }
        }
        out[`energy.au.${region.slice(0, 3).toLowerCase()}.demand_mw`] = pts;
      }
      // The monthly CSVs lag ~1 day; top up with NEMweb's live 5-minute dispatch files.
      const latestNow = await readJson(join(DATA, 'latest.json'), {});
      const csvEnd = Math.max(...Object.values(out).map((p) => (p.length ? p[p.length - 1][0] : 0)), latestNow['energy.au.nsw.demand_mw']?.[0] ?? 0);
      const listing = await getText('https://nemweb.com.au/Reports/Current/DispatchIS_Reports/');
      const files = [...new Set(listing.match(/PUBLIC_DISPATCHIS_\d{12}_\d+\.zip/g) || [])].sort();
      const fresh = files.filter((f) => {
        const m = f.match(/_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})_/);
        return Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+10:00`) / 1000 > csvEnd;
      }).slice(-320);
      const dir = await mkdtemp(join(tmpdir(), 'nem-'));
      for (const f of fresh) {
        try {
          const res = await fetch(`https://nemweb.com.au/Reports/Current/DispatchIS_Reports/${f}`, { headers: UA, signal: AbortSignal.timeout(20000) });
          if (!res.ok) continue;
          const zip = join(dir, 'd.zip');
          await writeFile(zip, Buffer.from(await res.arrayBuffer()));
          const csv = execFileSync('unzip', ['-p', zip]).toString();
          for (const line of csv.split('\n')) {
            if (!line.startsWith('D,DISPATCH,REGIONSUM')) continue;
            const c = line.split(',');
            const region = c[6];
            const key = { NSW1: 'nsw', VIC1: 'vic', QLD1: 'qld' }[region];
            if (!key || c[8] !== '0') continue; // INTERVENTION = 0 rows only
            const [d, tm] = c[4].replaceAll('"', '').split(' ');
            const t = Date.parse(`${d.replaceAll('/', '-')}T${tm}+10:00`) / 1000;
            (out[`energy.au.${key}.demand_mw`] ||= []).push([t, +c[9]]);
          }
        } catch {}
      }
      await rm(dir, { recursive: true, force: true });
      return out;
    },
  },
  {
    key: 'grid-caiso',
    async run(backfill) {
      const pts = [];
      const days = backfill ? 32 : 2;
      for (let d = days; d >= 0; d--) {
        // CAISO day folders are in Pacific time; use the PT calendar date.
        const ptDate = new Date((now - d * DAY - 8 * 3600) * 1000);
        const key = ymdCompact(ptDate);
        try {
          const csv = await getText(`https://www.caiso.com/outlook/history/${key}/demand.csv`);
          const offset = ptOffsetHours(ptDate);
          for (const line of csv.split('\n').slice(1)) {
            const [hhmm, , , cur] = line.split(',');
            if (!hhmm || !cur) continue;
            const t = Date.parse(`${ymd(ptDate)}T${hhmm}:00-0${offset}:00`) / 1000;
            pts.push([t, +cur]);
          }
        } catch {}
        await sleep(150);
      }
      return { 'energy.us.caiso.demand_mw': pts };
    },
  },
  {
    key: 'grid-nz',
    async run() {
      const j = await getJson('https://api.em6.co.nz/ords/em6/data_api/free/price?');
      const pts = [];
      for (const it of j.items || []) {
        if (it.grid_zone_name !== 'NZ') continue;
        let mwh = 0;
        for (const g of it.generation_type || []) for (const [k, v] of Object.entries(g)) if (k.endsWith('_mwh')) mwh += v;
        pts.push([Date.parse(it.trading_date) / 1000, +mwh.toFixed(1)]);
      }
      return { 'energy.nz.generation_mwh.daily': pts };
    },
  },
  {
    key: 'grid-eia',
    async run(backfill) {
      const key = process.env.EIA_API_KEY;
      if (!key) return null; // not configured: skip without marking the backfill as done
      const start = new Date((now - (backfill ? 35 : 3) * DAY) * 1000).toISOString().slice(0, 13);
      const out = {};
      for (const ba of ['ERCO', 'PJM', 'NYIS', 'MISO', 'ISNE']) {
        const j = await getJson(
          `https://api.eia.gov/v2/electricity/rto/region-data/data/?api_key=${key}&frequency=hourly&data[0]=value&facets[type][]=D&facets[respondent][]=${ba}&start=${start}&sort[0][column]=period&sort[0][direction]=asc&length=5000`,
        );
        out[`energy.us.${ba.toLowerCase()}.demand_mw`] = (j.response?.data || []).map((r) => [Date.parse(r.period + ':00Z') / 1000, +r.value]);
      }
      return out;
    },
  },
  {
    key: 'cloudflare-radar',
    async run(backfill) {
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!token) return null;
      const out = {};
      for (const cc of ['NZ', 'AU', 'JP', 'GB', 'DE', 'FR', 'US', 'BR']) {
        const j = await getJson(
          `https://api.cloudflare.com/client/v4/radar/http/timeseries?location=${cc}&dateRange=${backfill ? '28d' : '2d'}&aggInterval=1h&format=json`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const s = j.result?.serie_0;
        if (!s) continue;
        out[`internet.cf.${cc.toLowerCase()}.http`] = s.timestamps.map((t, i) => [Date.parse(t) / 1000, +s.values[i]]);
        await sleep(300);
      }
      return out;
    },
  },
  {
    key: 'github-activity',
    async run(backfill) {
      const out = { 'dev.github.commits.hourly': [], 'dev.github.prs.hourly': [] };
      // Hourly counts for complete hours. Backfill: 35 days x 24h would exceed search limits, so backfill 8 days hourly.
      const hours = backfill ? 8 * 24 : 6;
      const lastHour = Math.floor(now / 3600) * 3600 - 3600;
      for (let h = hours - 1; h >= 0; h--) {
        const t = lastHour - h * 3600;
        const a = new Date(t * 1000).toISOString().slice(0, 19) + 'Z';
        const b = new Date((t + 3599) * 1000).toISOString().slice(0, 19) + 'Z';
        try {
          const c = await getJson(`https://api.github.com/search/commits?q=committer-date:${a}..${b}&per_page=1`, { headers: GH_HEADERS });
          out['dev.github.commits.hourly'].push([t, c.total_count]);
          await sleep(2100);
          const p = await getJson(`https://api.github.com/search/issues?q=is:pr+created:${a}..${b}&per_page=1`, { headers: GH_HEADERS });
          out['dev.github.prs.hourly'].push([t, p.total_count]);
          await sleep(2100);
        } catch (e) {
          // Rate-limited: stop here; the next run re-fetches these hours (each run re-checks the last 6 complete hours).
          if (/HTTP (403|429)/.test(String(e.message))) break;
        }
      }
      return out;
    },
  },
  {
    key: 'npm',
    async run(backfill) {
      const from = ymd(new Date((now - (backfill ? 40 : 5) * DAY) * 1000));
      const j = await getJson(`https://api.npmjs.org/downloads/range/${from}:${ymd(new Date(now * 1000))}`);
      return { 'dev.npm.downloads.daily': j.downloads.filter((d) => d.downloads > 0).map((d) => [Date.parse(d.day) / 1000, d.downloads]) };
    },
  },
  {
    key: 'weather',
    async run(backfill) {
      const cities = { london: [51.51, -0.13], paris: [48.86, 2.35], nyc: [40.71, -74.01], la: [34.05, -118.24], sydney: [-33.87, 151.21], auckland: [-36.85, 174.76], tokyo: [35.68, 139.69] };
      const names = Object.keys(cities);
      const lat = names.map((n) => cities[n][0]).join(',');
      const lon = names.map((n) => cities[n][1]).join(',');
      const j = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&past_days=${backfill ? 35 : 2}&forecast_days=1&timezone=UTC`);
      const out = {};
      j.forEach((loc, i) => {
        out[`control.weather.${names[i]}.temp_c`] = loc.hourly.time
          .map((tm, k) => [Date.parse(tm + ':00Z') / 1000, loc.hourly.temperature_2m[k]])
          .filter(([t, v]) => t <= now && v != null);
      });
      return out;
    },
  },
  {
    key: 'fred',
    async run() {
      const csv = await getText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=ICSA&cosd=2026-01-01', { timeoutMs: 60000 });
      const pts = csv.split('\n').slice(1).filter(Boolean).map((l) => {
        const [d, v] = l.split(',');
        return [Date.parse(d) / 1000, +v];
      });
      return { 'control.us.jobless_claims.weekly': pts };
    },
  },
];

function ptOffsetHours(date) {
  // US DST: second Sunday of March to first Sunday of November.
  const y = date.getUTCFullYear();
  const nth = (month, n) => {
    const d = new Date(Date.UTC(y, month, 1));
    const first = (7 - d.getUTCDay()) % 7;
    return Date.UTC(y, month, 1 + first + 7 * (n - 1));
  };
  const t = date.getTime();
  return t >= nth(2, 2) && t < nth(10, 1) ? 7 : 8;
}

const chosen = HISTORY.filter((s) => !only.length || only.includes(s.key));
const health = await readJson(join(DATA, 'health.json'), {});
const latest = await readJson(join(DATA, 'latest.json'), {});

await Promise.all(
  chosen.map(async (src) => {
    const backfill = isBackfill(src.key);
    const t0 = Date.now();
    try {
      const out = await src.run(backfill);
      if (out === null) { console.log(`  · ${src.key}: not configured, skipped`); return; }
      let n = 0;
      for (const [id, pts] of Object.entries(out)) {
        if (!pts?.length) continue;
        const last = await mergePoints(id, pts);
        if (last) latest[id] = last;
        n += pts.length;
      }
      state[src.key] = { backfilled: true, lastRun: now };
      health[src.key] = { ok: true, lastOk: now, failingSince: null };
      console.log(`  ✓ ${src.key}${backfill ? ' (backfill)' : ''}: ${n} points in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      const prev = health[src.key] || {};
      health[src.key] = { ok: false, lastOk: prev.lastOk ?? null, failingSince: prev.failingSince ?? now, error: String(e.message).slice(0, 200) };
      console.log(`  ✗ ${src.key}: ${e.message}`);
    }
  }),
);

await writeJson(stateFile, state);
await writeJson(join(DATA, 'health.json'), health);
await writeJson(join(DATA, 'latest.json'), latest);
console.log(`[${new Date(now * 1000).toISOString()}] history run done`);
