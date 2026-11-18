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
          // Intraday 5-minute bars, snapped to the 5-minute grid (CNBC's bar phase shifts between calls).
          const i = await getJson(`https://ts-api.cnbc.com/harmony/app/charts/5D.json?symbol=${enc}`);
          for (const b of i.barData?.priceBars || []) {
            const t = Math.floor(b.tradeTimeinMills / 1000);
            pts.push([t - (t % 300), +b.close]);
          }
          if (backfill) {
            // Daily closes only for days before the intraday window, stamped at the US close (21:00 UTC in winter).
            const firstIntraday = pts.length ? Math.min(...pts.map((p) => p[0])) : Infinity;
            const d = await getJson(`https://ts-api.cnbc.com/harmony/app/charts/1M.json?symbol=${enc}`);
            for (const b of d.barData?.priceBars || []) {
              const day = Math.floor(b.tradeTimeinMills / 1000 / DAY) * DAY;
              const t = day + 21 * 3600;
              if (t < firstIntraday - 6 * 3600) pts.push([t, +b.close]);
            }
          }
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
        // The last kline is the still-open hour; keep only completed hours (r[6] = close time in ms).
        const done = k.filter((r) => r[6] < Date.now());
        out[`crypto.${slug}.price`] = done.map((r) => [r[0] / 1000, +r[4]]);
        out[`crypto.${slug}.trades_per_hour`] = done.map((r) => [r[0] / 1000, +r[8]]);
      }
      const f = await getJson(`https://api.alternative.me/fng/?limit=${backfill ? 120 : 5}`);
      out['crypto.fear_greed'] = f.data.map((d) => [+d.timestamp, +d.value]);
      return out;
    },
  },
  {
    key: 'wikipedia',
    everyMinutes: 30,
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
      // Only write the combined total when every language answered; a partial sum would look like a drop.
      if (Object.keys(out).length === Object.keys(articles).length) out['attention.wiki.gta6.all.daily'] = [...total.entries()];
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
      // Elexon occasionally publishes glitch readings (e.g. ~7.8 GW for an hour amid ~31 GW). Drop readings
      // below half of the batch median — GB demand never halves within minutes.
      const sorted = pts.map((p) => p[1]).sort((a, b) => a - b);
      const med = sorted[sorted.length >> 1] || 0;
      return { 'energy.gb.demand_mw': pts.filter((p) => p[1] > med * 0.5) };
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
    everyMinutes: 60,
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
    everyMinutes: 30,
    replace: true,
    async run() {
      const token = process.env.CLOUDFLARE_API_TOKEN;
      if (!token) return null;
      const out = {};
      for (const cc of ['NZ', 'AU', 'JP', 'GB', 'DE', 'FR', 'US', 'BR']) {
        const j = await getJson(
          // Radar normalises values within each response, so always request the SAME window (fixed start → now)
          // and replace the whole series; every point then shares one scale.
          `https://api.cloudflare.com/client/v4/radar/http/timeseries?location=${cc}&dateStart=2026-10-20T00:00:00Z&dateEnd=${new Date(now * 1000).toISOString().slice(0, 14)}00:00Z&aggInterval=1h&format=json`,
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
    everyMinutes: 60,
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
    key: 'onchain-daily',
    everyMinutes: 30,
    async run(backfill) {
      const out = {};
      const b = await getJson(`https://api.blockchain.info/charts/n-transactions?timespan=${backfill ? '60days' : '7days'}&format=json&sampled=false`);
      out['crypto.btc.onchain_tx.daily'] = b.values.map((v) => [v.x, v.y]);
      const e = await getJson('https://eth.blockscout.com/api/v2/stats/charts/transactions');
      out['crypto.eth.onchain_tx.daily'] = e.chart_data.map((d) => [Date.parse(d.date) / 1000, +d.transactions_count]);
      return out;
    },
  },
  {
    key: 'federal-register',
    everyMinutes: 60,
    async run(backfill) {
      const pts = [];
      for (let d = backfill ? 35 : 3; d >= 1; d--) {
        const day = ymd(new Date((now - d * DAY) * 1000));
        const j = await getJson(`https://www.federalregister.gov/api/v1/documents.json?conditions[publication_date][is]=${day}&per_page=1`);
        const wd = new Date(day).getUTCDay();
        if (wd !== 0 && wd !== 6) pts.push([Date.parse(day) / 1000, j.count]); // published on federal workdays only
        await sleep(300);
      }
      return { 'radar.us.federal_register_docs.daily': pts };
    },
  },
  {
    key: 'nvd-cves',
    everyMinutes: 60,
    async run(backfill) {
      const pts = [];
      for (let d = backfill ? 30 : 3; d >= 1; d--) {
        const day = ymd(new Date((now - d * DAY) * 1000));
        try {
          const j = await getJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${day}T00:00:00.000&pubEndDate=${day}T23:59:59.999&resultsPerPage=1`, { timeoutMs: 15000, retries: 0 });
          pts.push([Date.parse(day) / 1000, j.totalResults]);
        } catch {}
        await sleep(6500); // NVD allows 5 requests / 30 s without a key
      }
      if (backfill && pts.length < 25) throw new Error(`NVD backfill incomplete (${pts.length}/30)`);
      if (!pts.length) throw new Error('NVD unavailable');
      return { 'radar.cves_published.daily': pts };
    },
  },
  {
    key: 'cisa-kev',
    everyMinutes: 60,
    async run() {
      const j = await getJson('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', { timeoutMs: 60000 });
      const by = new Map();
      for (const v of j.vulnerabilities) by.set(v.dateAdded, (by.get(v.dateAdded) || 0) + 1);
      const from = now - 60 * DAY;
      const pts = [];
      for (let t = Math.floor(from / DAY) * DAY; t < now - DAY; t += DAY) pts.push([t, by.get(ymd(new Date(t * 1000))) || 0]);
      return { 'radar.cisa_kev_added.daily': pts };
    },
  },
  {
    key: 'hibp-breaches',
    everyMinutes: 60,
    async run() {
      const j = await getJson('https://haveibeenpwned.com/api/v3/breaches', { timeoutMs: 60000 });
      const n = new Map(), acc = new Map();
      for (const b of j) {
        const d = b.AddedDate.slice(0, 10);
        n.set(d, (n.get(d) || 0) + 1);
        acc.set(d, (acc.get(d) || 0) + (b.PwnCount || 0));
      }
      const pts = [], pts2 = [];
      for (let t = Math.floor((now - 60 * DAY) / DAY) * DAY; t < now - DAY; t += DAY) {
        const d = ymd(new Date(t * 1000));
        pts.push([t, n.get(d) || 0]);
        pts2.push([t, acc.get(d) || 0]);
      }
      return { 'radar.breaches_disclosed.daily': pts, 'radar.breached_accounts.daily': pts2 };
    },
  },
  {
    key: 'ransomware-posts',
    everyMinutes: 30,
    async run(backfill) {
      const months = new Set([ymd(new Date(now * 1000)).slice(0, 7)]);
      if (backfill) months.add(ymd(new Date((now - 35 * DAY) * 1000)).slice(0, 7));
      const by = new Map();
      for (const m of months) {
        const [y, mo] = m.split('-');
        const j = await getJson(`https://api.ransomware.live/v2/victims/${y}/${mo}`, { timeoutMs: 60000 });
        for (const v of j) {
          const d = String(v.discovered || '').slice(0, 10);
          if (d) by.set(d, (by.get(d) || 0) + 1);
        }
        await sleep(1000);
      }
      const pts = [];
      for (let t = Math.floor((now - (backfill ? 35 : 5) * DAY) / DAY) * DAY; t < now - DAY; t += DAY) pts.push([t, by.get(ymd(new Date(t * 1000))) || 0]);
      return { 'radar.ransomware_posts.daily': pts };
    },
  },
  {
    key: 'earthquakes',
    everyMinutes: 60,
    async run(backfill) {
      const pts = [];
      for (let d = backfill ? 35 : 3; d >= 1; d--) {
        const a = ymd(new Date((now - d * DAY) * 1000));
        const b = ymd(new Date((now - (d - 1) * DAY) * 1000));
        const j = await getJson(`https://earthquake.usgs.gov/fdsnws/event/1/count?starttime=${a}&endtime=${b}&minmagnitude=2.5&format=geojson`);
        pts.push([Date.parse(a) / 1000, j.count]);
        await sleep(200);
      }
      return { 'control.earthquakes_m25.daily': pts };
    },
  },
  {
    key: 'homework-index',
    everyMinutes: 60,
    async run(backfill) {
      // A fixed basket of classic school-curriculum articles on English Wikipedia: a proxy for students studying.
      const basket = ['Photosynthesis', 'Pythagorean_theorem', 'Mitosis', 'World_War_II', 'French_Revolution', 'Periodic_table',
        'Quadratic_equation', 'William_Shakespeare', 'Cell_(biology)', 'Industrial_Revolution', 'Romeo_and_Juliet', 'Cold_War',
        'Algebra', 'Newton%27s_laws_of_motion', 'Water_cycle', 'Roman_Empire'];
      const start = ymdCompact(new Date((now - (backfill ? 40 : 4) * DAY) * 1000));
      const end = ymdCompact(new Date(now * 1000));
      // Each article is stored as its own series; bundle.mjs sums them into the index only for days where all
      // articles are present, so a rate-limited article just fills in on a later run instead of making a fake dip.
      const out = {};
      for (const a of basket) {
        try {
          const j = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${a}/daily/${start}00/${end}00`, { headers: WIKI_UA });
          out[`study.wiki.${decodeURIComponent(a).toLowerCase().replace(/[^a-z0-9]+/g, '_')}.daily`] = j.items.map((it) => [wikiTs(it.timestamp), it.views]);
        } catch {}
        await sleep(1200);
      }
      if (!Object.keys(out).length) throw new Error('homework basket: no article answered');
      return out;
    },
  },
  {
    key: 'sec-filings',
    everyMinutes: 60,
    async run(backfill) {
      // SEC requires a declared contact in the User-Agent; only runs when the owner configures SEC_CONTACT.
      const contact = process.env.SEC_CONTACT;
      if (!contact) return null;
      const out = { 'radar.sec_8k.daily': [], 'radar.sec_form4.daily': [] };
      for (let d = backfill ? 35 : 3; d >= 1; d--) {
        const day = ymd(new Date((now - d * DAY) * 1000));
        for (const [form, id] of [['8-K', 'radar.sec_8k.daily'], ['4', 'radar.sec_form4.daily']]) {
          const j = await getJson(`https://efts.sec.gov/LATEST/search-index?forms=${form}&dateRange=custom&startdt=${day}&enddt=${day}`, { headers: { 'User-Agent': `gta6-impact-monitor ${contact}` } });
          const n = j.hits?.total?.value;
          if (Number.isFinite(n)) out[id].push([Date.parse(day) / 1000, n]);
          await sleep(250);
        }
      }
      return out;
    },
  },
  {
    key: 'city-incidents',
    everyMinutes: 60,
    async run() {
      // City open-data incident reports, counted per local day. Reports for a day keep arriving for days afterwards,
      // so a day is only recorded once it has SETTLED (settleDays old). Otherwise recent days would look like fake drops.
      const cities = [
        { id: 'safety.sf.police_incidents.daily', url: 'https://data.sfgov.org/resource/wg3w-h783.json', field: 'incident_datetime', settleDays: 5 },
        { id: 'safety.seattle.offenses.daily', url: 'https://data.seattle.gov/resource/tazs-3rd5.json', field: 'offense_date', settleDays: 5 },
        { id: 'safety.chicago.crimes.daily', url: 'https://data.cityofchicago.org/resource/ijzp-q8t2.json', field: 'date', settleDays: 10 },
        { id: 'safety.nyc.noise_complaints.daily', url: 'https://data.cityofnewyork.us/resource/erm2-nwe9.json', field: 'created_date', settleDays: 3, where: " AND complaint_type LIKE 'Noise%'" },
      ];
      const since = ymd(new Date((now - 60 * DAY) * 1000));
      const out = {};
      for (const c of cities) {
        const soql = `SELECT date_trunc_ymd(${c.field}) AS d, count(*) AS n WHERE ${c.field} > '${since}'${c.where || ''} GROUP BY d ORDER BY d LIMIT 200`;
        try {
          const rows = await getJson(`${c.url}?$query=${encodeURIComponent(soql)}`, { timeoutMs: 60000 });
          const cutoff = now - c.settleDays * DAY;
          out[c.id] = rows
            .map((r) => [Date.parse(r.d.slice(0, 10)) / 1000, +r.n])
            .filter(([t]) => t + DAY <= cutoff);
        } catch {}
        await sleep(500);
      }
      if (!Object.keys(out).length) throw new Error('no city answered');
      return out;
    },
  },
  {
    key: 'netflix-weekly',
    everyMinutes: 360,
    replace: true,
    async run() {
      // Netflix's own global Top 10 file: hours viewed for the top 10 titles in each of 4 categories, per week (Mon–Sun).
      const tsv = await getText('https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv', { timeoutMs: 60000, headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' } });
      if (!tsv.startsWith('week\t')) throw new Error('Netflix returned a web page instead of the TSV file');
      const by = new Map();
      for (const line of tsv.split('\n').slice(1)) {
        const c = line.split('\t');
        if (c.length < 6 || c[0] < '2026-08-01') continue;
        by.set(c[0], (by.get(c[0]) || 0) + (+c[5] || 0));
      }
      // The file's date is the week's last day (Sunday); stamp at the week's start.
      return { 'lifestyle.netflix.top10_hours.weekly': [...by.entries()].map(([d, v]) => [Date.parse(d) / 1000 - 6 * DAY, v]) };
    },
  },
  {
    key: 'wiki-curiosity',
    everyMinutes: 60,
    async run(backfill) {
      // What people read about: daily English-Wikipedia views of a few telling articles.
      const articles = { insomnia: 'Insomnia', sleep_deprivation: 'Sleep_deprivation', back_pain: 'Low_back_pain', eye_strain: 'Computer_vision_syndrome', pizza: 'Pizza', energy_drink: 'Energy_drink', miami: 'Miami' };
      const start = ymdCompact(new Date((now - (backfill ? 40 : 4) * DAY) * 1000));
      const end = ymdCompact(new Date(now * 1000));
      const out = {};
      for (const [slug, title] of Object.entries(articles)) {
        try {
          const j = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${title}/daily/${start}00/${end}00`, { headers: WIKI_UA });
          out[`lifestyle.wiki.${slug}.daily`] = j.items.map((it) => [wikiTs(it.timestamp), it.views]);
        } catch {}
        await sleep(1200);
      }
      if (!Object.keys(out).length) throw new Error('no article answered');
      return out;
    },
  },
  {
    key: 'dol-claims',
    everyMinutes: 180,
    replace: true,
    async run() {
      // US Department of Labor ETA-539: weekly initial unemployment claims by state (column c3). Summed across
      // states this is the national, NOT seasonally adjusted, initial-claims count. (FRED blocks cloud runners.)
      const csv = await getText('https://oui.doleta.gov/unemploy/csv/ar539.csv', { timeoutMs: 120000 });
      const by = new Map();
      for (const line of csv.split('\n').slice(1)) {
        const c = line.split(',');
        if (c.length < 5) continue;
        const d = c[1].replaceAll('"', '');
        if (d < '2026-01-01') continue;
        by.set(d, (by.get(d) || 0) + (+c[4] || 0));
      }
      // Stamp each week at its START (report date is the week-ending Saturday) so the week containing launch counts as "after".
      return { 'control.us.jobless_claims_nsa.weekly': [...by.entries()].map(([d, v]) => [Date.parse(d) / 1000 - 6 * DAY, v]) };
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

// Slow-moving or rate-limited sources declare everyMinutes; skip them until they are due (unless named explicitly).
const due = (s) => only.length || !s.everyMinutes || !state[s.key]?.lastRun || now - state[s.key].lastRun >= s.everyMinutes * 60 - 30;
const chosen = HISTORY.filter((s) => (!only.length || only.includes(s.key)) && due(s));
const health = await readJson(join(DATA, 'health.json'), {});
const latest = await readJson(join(DATA, 'latest.json'), {});

await Promise.all(
  chosen.map(async (src) => {
    const backfill = isBackfill(src.key);
    const t0 = Date.now();
    try {
      // Time budget per source so one slow API can never stall the whole round (it retries next round).
      const budget = (backfill ? 300 : 90) * 1000;
      const out = await Promise.race([
        src.run(backfill),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${budget / 1000}s`)), budget)),
      ]);
      if (out === null) { console.log(`  · ${src.key}: not configured, skipped`); return; }
      let n = 0;
      for (const [id, pts] of Object.entries(out)) {
        if (!pts?.length) continue;
        if (src.replace) await rm(join(DATA, 'series', id), { recursive: true, force: true });
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
const { SOURCES } = await import('./sources.mjs');
const known = new Set([...HISTORY.map((h) => h.key), ...SOURCES.map((x) => x.key)]);
for (const k of Object.keys(health)) if (!known.has(k)) delete health[k];
await writeJson(join(DATA, 'health.json'), health);
await writeJson(join(DATA, 'latest.json'), latest);
console.log(`[${new Date(now * 1000).toISOString()}] history run done`);
// Abandoned (timed-out) sources may still hold sockets open; exit so they cannot write after the state is saved.
process.exit(0);
