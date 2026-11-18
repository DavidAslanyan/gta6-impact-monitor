# GTA VI Global Impact Monitor

**Live:** https://davidaslanyan.github.io/gta6-impact-monitor/

A live, data-driven record of what happened to the world while Grand Theft Auto VI unlocked, one midnight at a time, starting in New Zealand on 18 Nov 2026 11:00 UTC. It covers markets, power grids, developer activity, internet attention, every other game, streets and bikes, and console networks. Everything is compared against the four weeks before launch.

> Fan-made and independent. Not affiliated with Rockstar Games or Take-Two Interactive. Zero spoilers: the site shows only numbers, never third-party text, and uses only official pre-launch media published by Rockstar Games.

## How it works

```
GitHub Actions (every 5 min)            GitHub Pages (static React)
  collector/snapshot.mjs  ──┐             ├─ loads data/bundle/*.json from the `data` branch
  collector/history.mjs   ──┼─► `data` ──►├─ streams Bluesky, Wikimedia, Binance live in the browser
  collector/bundle.mjs    ──┘   branch    └─ computes Baselines, Deltas and Anomalies client-side
```

- **Snapshots** (`collector/snapshot.mjs`): sources with no history of their own, such as Steam, Roblox, Kick, bike docks, PSN and status pages, App Store ranks, and Bluesky/Wikipedia rates.
- **History** (`collector/history.mjs`): sources we can backfill to build the Baseline, such as CNBC markets, Binance, Wikimedia pageviews, Elexon (GB), RTE (FR), AEMO (AU), CAISO, em6 (NZ), EIA (US, optional key), GitHub search, npm, Open-Meteo and FRED.
- **Bundle** (`collector/bundle.mjs`): packs every series into `bundle/hourly.json` and `bundle/recent.json` (5-minute resolution, last 48 h).
- Raw series live on the [`data` branch](../../tree/data) as `series/<signal>/<YYYY-MM>.ndjson`, with one `[unixSeconds, value]` pair per line.

The vocabulary (Signal, Baseline, Delta, Launch Moment, and so on) is defined in [GLOSSARY.md](GLOSSARY.md). Decisions are recorded in [docs/adr](docs/adr). The full source research is in [docs/research/data-sources.md](docs/research/data-sources.md).

## Run locally

```bash
node collector/snapshot.mjs && node collector/history.mjs && node collector/bundle.mjs   # writes ./data
cd web && npm install && npm run dev                                                      # serves ./data at /data
```

## Optional free API keys (repository secrets)

| Secret | Unlocks | Get it |
|---|---|---|
| `EIA_API_KEY` | Hourly US electricity demand (Texas, PJM, New York, MISO, New England) | https://www.eia.gov/opendata/register.php |
| `CLOUDFLARE_API_TOKEN` | Internet traffic by country (Cloudflare Radar) | Cloudflare dashboard → My Profile → API Tokens → "Radar: Read" |

The whole thing costs $0: GitHub Pages plus Actions on a public repo, using only free public APIs.
