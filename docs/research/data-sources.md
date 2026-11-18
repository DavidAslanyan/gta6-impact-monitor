# GTA VI World Impact — Data Source Catalogue

Date: 2026-11-18 (probes run about 12:15-12:25 UTC from one macOS machine with curl and node 26; CORS checks used `Origin: https://example.github.io`).

Legend: Verified = got a valid response today. CORS "echo" = ACAO reflects the request Origin (works for any origin). CORS "n/a-WS" = browsers do not enforce CORS on WebSockets. Priority: MUST / STRONG / NICE.

## Launch facts

| Fact | Detail | Source | Status |
|---|---|---|---|
| Release | GTA VI launches Nov 19 2026 on PS5 and Xbox Series X\|S only (no PC) | press | secondary |
| Unlock times | Digital unlock at midnight LOCAL time per region, about 15 windows from 11:00 UTC Nov 18 (New Zealand, 00:00 NZDT) to about 06:00 UTC Nov 19. Based on PlayStation Store listings; Xbox reportedly matches | https://godisageek.com/2026/09/gta-6-release-times-by-region/ , https://www.gamerfuzion.com/gta-6-release-times-unlock-windows/ | UNVERIFIED: Rockstar has not confirmed all times |
| Preload | Opened about Nov 10-12 (sources conflict) | press | unverified |
| Price | About $80 standard, about $100 Ultimate | https://www.gtaboom.com/gta-6-pre-orders-are-on-track-to-shatter-every-record-e016 | secondary |
| Pre-orders | Take-Two published no count. Sensor Tower estimates 7.7M-10M | https://www.tweaktown.com/rss/click/news/114590/?c=news-mf | third-party estimate |
| Take-Two guidance | FY27 net bookings $8.0-8.2B, Dec-quarter $3.35-3.5B kept; consensus about $8.64B | https://www.ibtimes.co.uk/gta-6-preorders-exceed-expectations-no-holiday-discounts-1813575 | secondary |
| Trailer records | Trailer 1: 90.4M YouTube views in 24h (Guinness). Trailer 2: about 83.6M YouTube, about 475M all platforms in 24h. No Trailer 3 found | https://www.techradar.com/gaming/the-latest-grand-theft-auto-6-trailer-has-set-a-major-record-by-racking-up-475-million-views-in-just-24-hours , https://wnhub.io/news/other/item-42543 | older figures |
| Productivity loss | Economist Jose Garcia Montalvo: about $1B US loss, about 1.5M Americans absent | https://local12.com/news/nation-world/grand-theft-auto-6-release-could-cost-united-states-economy-one-billion-dollars-productivity-loss-cincinnati-1-5-million-americans-plan-work-absences-analyst-jose-garcia-montalvo-estimates-technology-sector-faces-largest-single-day-short-term-hit | ESTIMATE, one source; method unpublished (https://www.ibtimes.co.uk/gta-6-launch-work-absence-productivity-cost-1826839) |
| Download size | About 210GB on PS5 | https://www.gtaboom.com/gta-6-is-reportedly-a-210-gb-download-on-ps5-4269 | unconfirmed |
| Preload network records | DE-CIX peak 33.01 Tbps; Virgin Media O2 record daily volume on Nov 10 | https://www.ggrecon.com/articles/gta-6-pre-load-broadband-records/ , https://techspot.com/news/114566-gta-6-isnt-even-out-but-already-breaking.html | secondary |
| Absence stories | Anecdotal: Burger Motorsports (CA), Fries Lab closures; sick-call stories; no school closures found. GTA V 2013 precedent: reports of up to 6% of workers aged 18-35 in some cities off on launch day | https://www.hcamag.com/ca/news/general/the-gta-6-flu-is-coming-for-office-attendance-on-nov-19/597204 , https://www.gfinityesports.com/article/gta-6-has-employees-calling-dibs-on-launch-day-as-one-company-closes-shop | anecdotal |
| TTWO | About $244.73 early Aug 2026 (https://247wallst.com/cards/take-two-interactive-ttwo-price-swing-01kzerfg46hacyqgz2hwt5j0h7). Q2 FY27 EPS $0.99 vs $0.90 consensus (https://shacknews.com/article/151309/take-two-interactive-ttwo-q2-2027-earnings-results). Live: close about $203.93 (-4.47% Nov 17, CNBC); about $217.73 (+6.77%) pre-market Nov 18 (Nasdaq API) | as listed | live probes |
| Live baseline snapshot | VIX about 24.3, BTC about $64.3k, BTC Fear and Greed 11 (Extreme Fear), Kick: GTA VI about 1.21M viewers vs CS2 41K, GTA V 53K | probes | single snapshots |

All launch facts come from press search on 2026-11-18, mostly secondary. Show estimates as estimates with source attached.

## Architecture implications

**Browser-direct, CORS open (no key):** Wikimedia pageviews and EventStreams (SSE), Bluesky searchPosts (api.bsky.app), Mastodon tag timelines, HN Algolia/Firebase, GitHub/Stack Exchange (shared quota, see below), CNBC restQuote and harmony chart, Binance (data-api.binance.vision), Coinbase, Kraken, CoinGecko, Coinpaprika, CoinLore, Alternative.me F&G, Deribit, Frankfurter, Polymarket Gamma/CLOB, Manifold, Elexon, UK Carbon Intensity, ODRE eco2mix, NESO, em6 free price, Open-Meteo, IODA, RIPEstat, Statuspage feeds (Discord, Twitch, Epic, GitHub, Cloudflare, Reddit, Zoom), Kick categories (unofficial), GBFS bike feeds, TfL, NYC DOT Socrata, Melbourne pedestrians, Paris ODS, Treasury DTS, Indeed raw CSV, iTunes RSS, npm downloads, Google Cloud incidents.

**WebSocket / SSE (true sub-second, browser-direct):** Bluesky Jetstream (about 35 posts/s, verified), Wikimedia EventStreams recentchange (about 40 events/s, verified), Binance trades (verified, many per second), Coinbase matches (connected, ack received), Kraken v2 (connected), Polymarket market WS (snapshot only), Twitch IRC anonymous (handshake verified), Yahoo streamer (verified from node only, protobuf, unofficial). No WS/SSE exists for electricity, mobility or Steam.

**Must go through GitHub Actions cron (no CORS, UA required, key needed, or rate limited):** Yahoo v8 chart/spark, Nasdaq API, CBOE, Steam (per-app CCU, top-100 charts, store, SteamSpy, SteamCharts), Roblox, PlayStation status, Netflix TSV, AEMO CSV, CAISO CSV, TEPCO CSV (Shift-JIS), Energy-Charts (CORS restricted to its own origin), NZ EMI CSVs, EIA v2 (key), Cloudflare Radar (token), Twitch Helix (token), YouTube Data (key), GDELT (1 req/5s), OpenSky/adsb.lol/adsb.fi, FRED CSV, TSA (HTML scrape), GH Archive, Auckland Transport / Metlink / TfNSW / TomTom (keys), GitHub Search (10 req/min unauth; browser visitors share a 60/h events budget), Stack Exchange (300/day per IP without key).

**Free keys to register (store as GitHub Actions secrets, never in browser bundle):** EIA (instant), Cloudflare Radar API token (Account > Radar:Read), Twitch dev app (client credentials, 2FA), YouTube Data API v3 key (10k units/day), Stack Exchange key (10k/day), Auckland Transport portal key, Metlink key, TfNSW key, TomTom key (2,500/day), FRED API key (optional), ENTSO-E token (email request), Finnhub (optional, WS key would be public), NYC Socrata app token (optional), GitHub token (GITHUB_TOKEN built in), TfL app_key (optional), BART own key (demo key shared).

**Realistic per-second live feeds in the browser:** Bluesky Jetstream (total post rate and GTA-regex matches), Wikimedia EventStreams (edit rate), Binance and Coinbase crypto trades (trade rate and price). Next tier (seconds to 30s polling): Kick viewers (15s), Toronto bike share (5s ttl), CNBC quotes (10-30s), Bluesky searchPosts hitsTotal, Polymarket. Everything else is 1-15 minute snapshots from Actions. Browser sessions cannot keep history across reloads, so Actions must store 5-15 min aggregates; start recording baselines now since Jetstream, EventStreams, Steam, Roblox, bike feeds and Kick have no deep backfill.

## Attention and cause signals

| Source | Metric | GTA angle | Transport | Auth | CORS | Cadence | Backfill | Verified |
|---|---|---|---|---|---|---|---|---|
| Wikipedia per-article pageviews (`wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/Grand_Theft_Auto_VI/daily/START/END`) | Daily views per language wiki (en 64,375 on 2026-11-10) | Direct attention curve; swap in de/fr/es/ja/pt. top-per-country also OK. MUST | REST | none (Api-User-Agent) | yes (*) | daily, 1-day lag; hourly returns 400 | from 2015 | yes |
| Wikipedia top articles daily (`.../pageviews/top/en.wikipedia/all-access/2026/11/17`) | Top 1000 by views | Rank of GTA and other games. NICE | REST | none | yes | daily | from 2015 | yes |
| Wikimedia EventStreams recentchange (`https://stream.wikimedia.org/v2/stream/recentchange`) | Live edits; GTA-page edits/min and global edit rate | Edit activity dip as global attention proxy. STRONG | SSE | none | yes (*) | sub-second | ~7 days via Last-Event-ID | yes |
| Bluesky Jetstream (`wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post`) | Posts/s; GTA regex matches (4-6 per 8s sample) | Mention spike per unlock; total post dip. MUST | WebSocket | none | n/a-WS | sub-second (~35 posts/s) | cursor replay ~24-72h | yes |
| Bluesky searchPosts (`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=GTA%20VI&limit=100&sort=latest&since=...`) | hitsTotal (757 since 11:00 UTC), latest posts | Hourly mention counts, baseline backfill. STRONG | REST | none | yes (*) | seconds | yes (since/until, cursor) | yes (public.api.bsky.app gave 403; use api.bsky.app) |
| Mastodon hashtag (`https://mastodon.social/api/v1/timelines/tag/gta6?limit=40`) | Latest tagged posts; /trends/tags OK | Fediverse mentions. NICE | REST | none | yes (*) | seconds | limited (max_id) | yes (streaming WS gave 0 msgs, unreliable) |
| HN Algolia (`https://hn.algolia.com/api/v1/search_by_date?query=GTA%20VI&tags=story&hitsPerPage=50`) | Stories/comments counts (hitsPerPage=0 gives nbHits) | Tech-community attention and HN activity baseline. NICE | REST | none | yes (echo) | 1-2 min | full (created_at_i) | yes |
| HN Firebase (`https://hacker-news.firebaseio.com/v0/maxitem.json`) | Item counter; diff gives post rate | Activity proxy. NICE | REST (SSE supported on .json) | none | yes (echo) | real time | by item id | yes |
| GitHub repo search (`https://api.github.com/search/repositories?q=gta6+created:>2026-11-18&per_page=1`) | total_count (4,705), repos per day | Meme/clone activity. NICE | REST | none (token optional) | yes (*) | minutes | yes (created:) | yes |
| GDELT DOC 2.0 (`https://api.gdeltproject.org/api/v2/doc/doc?query=%22GTA%20VI%22&mode=timelinevol&format=json&timespan=7d`) | News volume timeline, tone | Media attention curve. STRONG | REST | none | conflicting: one report saw ACAO * (headers only), other unknown | 15 min | ~3 months | PARTIAL: one report got 200, another got 429 (1 req/5s); payload not fully seen. Use in Actions with 6-10s spacing |
| Stack Exchange (`https://api.stackexchange.com/2.3/search?order=desc&sort=creation&intitle=gta&site=gaming&pagesize=30`) | gaming.SE questions, SO totals via filter=total | GTA questions; dev help-seeking | REST | none (free key raises 300 to 10k/day) | yes (*) | minutes | yes (fromdate/todate) | yes |
| YouTube Data v3 (`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=ID&key=KEY`) | Trailer view/like counts | Attention gauge. STRONG | REST | free key | yes | 1 min, quota-bound | none (snapshot) | PARTIAL: 403 without key, CORS present; valid call not seen. Trailer IDs must be looked up |
| Twitch Helix (`https://api.twitch.tv/helix/streams?game_id=ID`, `/helix/games/top`) | Viewers per category, top games | Streaming audience. STRONG | REST | free app token | yes (*) | 1 min | none | PARTIAL: 401 with CORS; no token tested |
| Twitch IRC (`wss://irc-ws.chat.twitch.tv:443`, anon justinfan) | Chat msgs/s on chosen channels | Chat velocity. STRONG | WebSocket | none | n/a-WS | sub-second | none | PARTIAL: handshake OK (CAP ACK, 001-003); no live chat captured |
| Polymarket Gamma (`https://gamma-api.polymarket.com/public-search?q=GTA`, `/events?slug=gta-6-launch-postponed-again`) | Probabilities: postponed again 0.25% (vol about $1.36M, ends 2026-11-20), Metacritic >=90 99%, Kai Cenat marathon by Nov 26 50.5%, radio songs | Hype/confirmation widget; will age out. STRONG | REST | none | yes (*) | seconds-minutes | see CLOB | yes |
| Polymarket CLOB (`https://clob.polymarket.com/prices-history?market=<tokenId>&interval=max&fidelity=1440`, `/midpoint`, `wss://ws-subscriptions-clob.polymarket.com/ws/market`) | Probability history (from Nov 2025), live book | Decay of "postponed" odds. STRONG | REST + WS | none | yes (echo) | event-driven | full life | yes (WS gave one snapshot; use full numeric token id) |
| Manifold (`https://api.manifold.markets/v0/search-markets?term=GTA%20VI&limit=6`) | Play-money odds (release by Nov 19: 96.5%) | Extra sentiment, tiny volume. NICE | REST (WS untested) | none | yes (*) | seconds | /v0/bets | yes |

**Rejected:** Reddit JSON (403 everywhere, OAuth needed; use Bluesky/Mastodon/HN), Google Trends (no official API, 404/429; use Wikipedia pageviews), Steam for GTA VI (console-only), Mastodon streaming (401/unreliable), GitHub/IXP live traffic scraping (see Internet).

## Financial markets

| Source | Metric | GTA angle | Transport | Auth | CORS | Cadence | Backfill | Verified |
|---|---|---|---|---|---|---|---|---|
| Yahoo v8 chart (`https://query2.finance.yahoo.com/v8/finance/chart/TTWO?interval=1m&range=1d&includePrePost=true`) | OHLCV for TTWO, SONY, MSFT, NVDA, AMD, GME, EA, UBI.PA, NTDOY, 7974.T, 0700.HK, CDR.WA, RBLX, U, DASH, UBER, NFLX, ^GSPC, ^NDX, ^N225, ^FTSE, ^NZ50, ^VIX, GC=F, CL=F, NZDUSD=X (also HG=F, NG=F, BZ=F) | Core equity/index/commodity feed. MUST | REST | none (browser UA required) | NO (Actions only) | 1 min bars | 1m 7d, 5m 60d, 1d years | yes (all 15 symbols tested; ~1 call/s; empty bodies after ~25 UA-less calls) |
| Yahoo v7 spark (`https://query1.finance.yahoo.com/v7/finance/spark?symbols=TTWO,MSFT&range=1d&interval=5m`) | Batch series | One call per cron run. STRONG | REST | none (UA) | no | 5 min | limited | yes (batch limit untested) |
| Yahoo streamer (`wss://streamer.finance.yahoo.com/?version=2`) | Ticks, base64 protobuf | Sub-second ticks if decoded. STRONG (bonus) | WebSocket | none | n/a-WS | sub-second | none | yes from node only (BTC-USD ticked); unofficial, browser Origin untested |
| CNBC restQuote (`https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=TTWO\|SONY\|MSFT\|.SPX\|.IXIC\|NZD=\|JP10Y-JP&output=json&requestMethod=itv`) | Last, change %, pre/post, FX, yields | Only free CORS equity/index feed. MUST | REST | none | yes (*) | poll 10-30s | none | yes (TTWO 203.93 -4.47%, SPX 7,340.53, JP10Y 2.886%) |
| CNBC harmony chart (`https://ts-api.cnbc.com/harmony/app/charts/1D.json?symbol=TTWO`) | Intraday series | Browser sparklines. NICE | REST | none | yes (*) | 1 min | other ranges untested | PARTIAL: 200 + CORS; payload not parsed |
| Nasdaq API (`https://api.nasdaq.com/api/quote/TTWO/info?assetclass=stocks`, `/chart`, `/watchlist`) | Real-time last sale incl. pre/post market | TTWO +6.77% pre-market. STRONG | REST | none (UA) | no | real time | intraday; historical untested | yes |
| CBOE (`https://cdn-api.cboe.com/api/global/delayed_quotes/quotes/_VIX.json`) | VIX 24.3, SPX | Redundant vol fallback. NICE | REST | none | no | ~15 min delay | none | yes |
| Finnhub (`https://finnhub.io/api/v1/quote?symbol=TTWO&token=KEY`, `wss://ws.finnhub.io?token=KEY`) | US trade ticks | Sub-second equity ticks. STRONG | REST + WS | free key | yes (*) | sub-second WS in market hours | candles premium | NO: demo key rejected (401, CORS present); limits (60/min, 50 WS symbols) from docs only; key would be public in browser |
| Twelve Data (`https://api.twelvedata.com/price?symbol=AAPL&apikey=KEY`) | Price | Fallback. NICE | REST | free key | yes | 8/min, 800/day | time_series 401 on demo | partial (/price OK with demo) |
| Polygon/Massive (`https://api.massive.com/v2/aggs/ticker/AAPL/prev?apiKey=KEY`) | EOD bars | Supplement. NICE | REST | free key | yes (echo) | EOD, 5/min | 2y daily | NO (401 demo key) |
| MarketData.app (`https://api.marketdata.app/v1/stocks/quotes/AAPL/`) | Cached quotes | Failover. NICE | REST | none basic | yes | cached (HTTP 203) | limited | partial (AAPL only) |
| FRED (`https://fred.stlouisfed.org/graph/fredgraph.csv?id=VIXCLS`) | Daily macro | Baseline. NICE | CSV | none | unknown/no | daily | decades | NO (timeouts in finance report; the mobility report did fetch ICSA CSV, no CORS) |
| Binance REST (`https://data-api.binance.vision/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]`, klines) | Price, 24h volume, candles | Crypto trades through the freeze. MUST | REST | none | yes (*) | 1-5s | klines 1000/call; monthly dumps at data.binance.vision | yes (binance.com may 451 from US Actions; use data-api.binance.vision) |
| Binance WS (`wss://data-stream.binance.vision/ws/btcusdt@trade`) | Every trade | Sub-second heartbeat. MUST | WebSocket | none | n/a-WS | sub-second | none | yes (15 msgs in 4.4s; stream.binance.com:9443 OK, stream.binance.us silent) |
| Coinbase (`wss://ws-feed.exchange.coinbase.com`; `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=3600`) | Matches, ticker, candles | US retail flow. MUST | WS + REST | none | yes (*) REST | sub-second | 300 candles/call | yes (REST data seen; WS connected and acked) |
| Kraken (`wss://ws.kraken.com/v2`; `https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=60`) | Trades, OHLC | Third venue. STRONG | WS + REST | none | yes (echo) | real time | last 720 bars | partial (WS trade payload not captured) |
| Bybit, OKX, Bitstamp, Gemini, Hyperliquid WS | Trades | Extra venues. NICE | WebSocket | none | n/a-WS | sub-second | none | connected only; trade payloads not confirmed (OKX 8443 being retired for 443) |
| CoinGecko (`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90`) | Prices, hourly 90d | Backfill. STRONG | REST | none | yes (*) | 1-2 min | up to 365d | yes (tight limits 5-15/min; use Actions) |
| Coinpaprika global / CoinLore global | Total cap, volume, BTC dominance | Headline totals. NICE | REST | none | yes (*) | 1-5 min | none | yes (volume disagrees about 2x; pick one) |
| Alternative.me Fear and Greed (`https://api.alternative.me/fng/?limit=90`) | Index (11, Extreme Fear) | Sentiment baseline. STRONG | REST | none | yes (*) | daily | full (limit=0) | yes |
| Deribit DVOL (`https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=BTC&...&resolution=3600`) | BTC vol index (~39.5) | Crypto VIX. NICE | REST | none | yes (echo) | 1 min candles | long | yes |
| DefiLlama stablecoins (`https://stablecoins.llama.fi/stablecoins`) | Stablecoin supply | Weak. NICE | REST | none | yes | hourly | /stablecoincharts/all | yes (large payload) |
| Frankfurter (`https://api.frankfurter.dev/v1/latest?base=NZD&symbols=USD,JPY`) | ECB daily FX (NZD/USD 0.54986) | Baseline FX. MUST | REST | none | yes (*) | daily ~16:00 CET | since 1999 | yes (use .dev, not .app) |
| open.er-api.com (`https://open.er-api.com/v6/latest/NZD`) | Daily rates | Cross-check. NICE | REST | none (attribution) | yes (*) | daily | none | yes |
| fawazahmed0 currency-api (`https://latest.currency-api.pages.dev/v1/currencies/nzd.json`) | Daily 200+ currencies | Static fallback. NICE | REST | none | yes (*) | daily | date-pinned URLs | yes |
| Yahoo FX/commodities (NZDUSD=X, GC=F, CL=F, ^VIX) | Intraday FX, gold 3774, crude 83.95, VIX 24.33 | Risk and energy gauges. MUST | REST | none (UA) | no | 1-5 min | as Yahoo chart | yes |

**Rejected:** Stooq (JS bot challenge), Alpha Vantage (25/day), FMP (401, paywalled), Tiingo (no CORS, tight), Marketstack (100/month), Google Finance (HTML only), IEX Cloud (shut down 2024), Kalshi (403 from this network; maybe retry from Actions, untested), CoinCap (no response). Prediction-market sources (Polymarket, Manifold) are in the Attention section.

## Internet traffic, connectivity and online behaviour

| Source | Metric | GTA angle | Transport | Auth | CORS | Cadence | Backfill | Verified |
|---|---|---|---|---|---|---|---|---|
| Wikimedia pageviews aggregate (`.../pageviews/aggregate/all-projects/all-access/user/hourly/2026111500/2026111800`) | Global human views per hour (about 13.4M/h) | Global browsing dip. MUST | REST | none | yes (*) | hourly, 1-2h lag | 2015+ | yes |
| Wikimedia top-per-country (`.../pageviews/top-per-country/NZ/all-access/2026/11/17`) | Top articles per country | See GTA rank roll across NZ, US, UK, BR. STRONG | REST | none | yes | daily | months | yes (views_ceil) |
| Wikimedia unique devices (`.../unique-devices/en.wikipedia.org/all-sites/daily/20261101/20261117`) | Unique readers | Smooth attention measure. NICE | REST | none | yes | daily | 2016+ | yes |
| GitHub public events (`https://api.github.com/events?per_page=100`) | Push/PR event density | Developers on leave. STRONG | REST | none | yes | ~60s cache | none | yes (60 req/h/IP, poll from Actions) |
| GitHub Search counts (`https://api.github.com/search/commits?q=committer-date:2026-11-17&per_page=1`, PRs, issues, repos) | Commits (14,054,533 on 2026-11-17), PRs per hour | Best developer-productivity series. MUST | REST | none (token recommended) | yes (*) | real time | any past window | yes (10 req/min unauth, 30 with token; approximate counts) |
| GH Archive (`https://data.gharchive.org/2026-11-17-12.json.gz`) | Exact hourly events | One-off baseline job. NICE | file | none | no | hourly | 2011+ | yes (100-300MB files) |
| Stack Exchange totals (`.../2.3/questions?site=stackoverflow&filter=total&fromdate=..&todate=..`) | Questions per window | Developer help-seeking; noisy, use daily. STRONG | REST | none (key optional) | yes | near real time | yes | yes |
| npm downloads (`https://api.npmjs.org/downloads/range/2026-11-10:2026-11-17`) | Ecosystem daily downloads (about 53B weekday vs 26B Saturday) | Weekday that looks like a weekend. MUST | REST | none | yes (*) | daily | 18 months/range | yes |
| Cloudflare Radar (`https://api.cloudflare.com/client/v4/radar/http/timeseries?dateRange=1d`) | HTTP traffic by country, DNS, outages, rankings | Most direct global traffic series. MUST | REST | free API token | NO | 15 min, ~1h lag | up to 52w | PARTIAL: 400 code 9106 (needs auth), no ACAO; not tested with token |
| IODA (`https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country/NZ?from=..&until=..`) | Country connectivity (bgp, ping-slash24, merit-nt, gtr WEB_SEARCH), outages | Connectivity health. STRONG | REST | none | yes (echo) | 5-30 min | any window | yes (tested with Nov 2025 epochs; retest with current window) |
| RIPEstat (`https://stat.ripe.net/data/bgp-update-activity/data.json?resource=AS13335`) | BGP activity, country stats | Network stress. NICE | REST | none (sourceapp) | yes (*) | minutes | starttime/endtime | yes |
| RIPE Atlas (`https://atlas.ripe.net/api/v2/measurements/?format=json&page_size=1`) | Latency/loss from probes | Congestion proxy. NICE | REST | none | yes (echo) | seconds-minutes | start/stop | yes (needs measurement ids) |
| PeeringDB (`https://www.peeringdb.com/api/ix?limit=1`) | IXP registry capacity | Static context. NICE | REST | none | yes (echo) | static | none | yes |
| Discord status (`https://discordstatus.com/api/v2/summary.json`) | Component status | Gamer coordination load. STRONG | REST | none | yes (*) | poll 1-5 min | recent incidents | yes |
| Twitch status (`https://status.twitch.com/api/v2/summary.json`) | Status | Streaming strain. STRONG | REST | none | yes (*) | 1 min | recent | yes |
| Epic status (`https://status.epicgames.com/api/v2/summary.json`) | Status | Control. NICE | REST | none | yes | 1 min | recent | yes |
| Xbox Live status (`https://xboxlive.statuspage.io/api/v2/summary.json`) | Status | Launch load. NICE | REST | none | yes | 1 min | recent | yes (unofficial mirror; payload freshness not checked) |
| PlayStation Network status (`https://status.playstation.com/data/statuses/region/SCEA.json`; also SCEE) | Per-service status | Launch-day PSN strain. STRONG (gaming report rated MUST) | REST | none | NO | 1-5 min | none (archive ourselves) | yes (SCEA/SCEE 200; SCEJ 404; reduce to count of non-operational services) |
| GitHub, Cloudflare (`www.cloudflarestatus.com`), Reddit (`www.redditstatus.com`), Zoom/Slack status | Status | Controls. NICE | REST | none | yes | 1 min | recent | yes |
| Google Cloud incidents (`https://status.cloud.google.com/incidents.json`) | Incident history | Context. NICE | REST | none | yes | as occurs | long | yes (large; filter in Actions) |
| Cloudflare speed/trace (`https://speed.cloudflare.com/__down?bytes=1000`, `https://1.1.1.1/cdn-cgi/trace`) | Visitor's own speed/latency | Interactive widget only. NICE | REST | none | yes | on demand | none | yes (not evidence; unrepresentative) |

**Rejected:** PyPI Stats (no response, 429-prone), OONI (no CORS, irrelevant), IXP live traffic (AMS-IX, DE-CIX, LINX, NZIX: no JSON), AWS status (no CORS, low value), Rockstar service status (no response, likely SPA behind bot protection), steamstat.us (403), Downdetector (403, paid), Mastodon streaming (401), IHR (unreachable).

## Electricity grids and energy demand

| Source | Metric | GTA angle | Transport | Auth | CORS | Cadence | Backfill | Verified |
|---|---|---|---|---|---|---|---|---|
| Elexon BMRS demand (`https://data.elexon.co.uk/bmrs/api/v1/demand/outturn/summary?format=json`) | GB demand MW, 5-min | Office absence vs evening bump. MUST | REST | none | yes (*) | 5 min | years (`/demand/outturn/stream`; INDO `/stream` 404 for 2025) | yes |
| Elexon FUELINST (`.../datasets/FUELINST/stream?publishDateTimeFrom=..&publishDateTimeTo=..`) | GB generation by fuel | Gas dispatch as demand proxy. STRONG | REST | none | yes | 5 min | arbitrary ranges | yes (~47KB/h) |
| UK Carbon Intensity (`https://api.carbonintensity.org.uk/intensity`, `/generation`, `/regional`) | gCO2/kWh, mix, 17 regions | Secondary, visual. STRONG (regional NICE) | REST | none | yes (*) | 30 min | date ranges (14-day windows) | yes |
| NESO historic demand (`https://api.neso.energy/api/3/action/datastore_search?resource_id=f6d02c0f-957b-48cb-82ee-09003f2ba759`) | Half-hourly historic demand | Multi-year baseline. NICE | REST (CKAN) | none | yes (*) | daily/half-hourly | years | yes (check each resource's year) |
| RTE eco2mix via ODRE (`https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/records?...&where=consommation%20is%20not%20null`) | France consumption (57,446 MW), nuclear, wind, CO2 | Large W. European demand. MUST | REST | none | yes (*) | 15 min | `-cons-def` baseline ends 2026-08-31; `-tr` is ~1-2 month rolling | yes |
| EIA v2 (`https://api.eia.gov/v2/electricity/rto/region-data/data/?api_key=KEY&frequency=hourly&data[0]=value&facets[type][]=D&facets[respondent][]=CISO...`) | Hourly demand per BA (CISO, ERCO, NYIS, PJM, MISO, ISNE) | Largest gaming market. MUST | REST | free key (DEMO_KEY 10/h) | yes (*) | hourly, 1-2h lag | to 2015-07 | yes (use curl -g; ~5000 req/h registered; fetch in Actions) |
| CAISO outlook (`https://www.caiso.com/outlook/current/demand.csv`, `/fuelsource.csv`; history `/outlook/history/20261117/demand.csv`) | CA demand vs forecast, 5-min | Quick deviation vs forecast. STRONG | CSV | none | no | 5 min | per-day folders | yes |
| AEMO NEM (`https://www.aemo.com.au/aemo/data/nem/priceanddemand/PRICE_AND_DEMAND_202611_NSW1.csv`) | TOTALDEMAND, RRP per 5-min per region | Early-timezone large grid. MUST | CSV | none (browser UA) | no | 5 min | monthly files from 1998 | yes |
| em6 free price (`https://api.em6.co.nz/ords/em6/data_api/free/price?`) | NZ daily WAP and MWh by fuel | First country to unlock. MUST (daily only) | REST | none | yes (*) | daily (partial day grows) | ~185 days | yes (sibling free/demand etc. 401) |
| NZ EMI W_P_C (`https://www.emi.ea.govt.nz/Wholesale/Download/DataReport/CSV/W_P_C?DateFrom=..&DateTo=..&RegionType=NZ&TimeScale=DAY`) | NZ spot price | Earliest market signal. STRONG | CSV | none | no | 30 min | any range | yes (~10 metadata lines, DD/MM/YYYY) |
| NZ EMI Generation_MD (`.../Datasets/Generation/Generation_MD/202610_Generation_MD.csv`) | Half-hourly plant generation | NZ baseline. NICE | CSV | none | no | monthly (lags) | to 1997 | yes (302 to blob host) |
| TEPCO juyo (`https://www.tepco.co.jp/forecast/html/images/juyo-d1-j.csv`) | Tokyo demand | Console-heavy market. STRONG | CSV (Shift-JIS) | none | no | hourly/5 min | juyo-2025.csv exists; current-year name unconfirmed (juyo-2026.csv 404) | yes |
| Energy-Charts (`https://api.energy-charts.info/total_power?country=de&start=..&end=..`) | DE/EU load, 15 min | German grid. STRONG | REST | none | NO (ACAO only for its own site) | 15 min | years | yes (CC BY 4.0 attribution) |
| Open-Meteo (`https://api.open-meteo.com/v1/forecast?latitude=-36.85&longitude=174.76&current=temperature_2m`; archive `archive-api.open-meteo.com/v1/archive`) | Weather control | Temperature correction. MUST | REST | none (non-commercial, ~10k/day) | yes (*) | 15 min | since 1940 | yes |
| Electricity Maps (`https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=NZ`) | Zone intensity | One zone on free plan. NICE | REST | free key | yes | hourly | ~24h | NO (401; /v3/zones OK) |
| ENTSO-E (`https://web-api.tp.entsoe.eu/api?documentType=A65&...`) | Actual load per zone | Europe breadth. NICE | REST (XML) | free token via email | no | 15-60 min | years | NO (403 without token) |
| GridStatus (`https://api.gridstatus.io/v1/datasets`) | US ISO data | Backup. NICE | REST | free key (small quota) | yes | 5 min-hourly | limited | NO (401) |

**Rejected:** Red Eléctrica REData (Incapsula 403), ERCOT (Incapsula 403; use EIA ERCO), NYISO CSV (403; use EIA NYIS), Grid-India (no connection), Transpower live (no JSON; use em6 + EMI), OpenNEM/OpenElectricity (410 or key).

## Mobility, commuting, productivity and commerce

| Source | Metric | GTA angle | Transport | Auth | CORS | Cadence | Backfill | Verified |
|---|---|---|---|---|---|---|---|---|
| Citi Bike NYC GBFS (`https://gbfs.citibikenyc.com/gbfs/en/station_status.json`; also Boston `gbfs.lyft.com/gbfs/2.3/bos/en/station_status.json`, DC `gbfs.capitalbikeshare.com`, Divvy `gbfs.divvybikes.com/gbfs/en/station_status.json`) | Idle bikes (about 2,200 stations) | Idle bikes up if commuters stay home. MUST | REST | none | yes (*) | 10-30s | none (monthly trip zips) | yes (970KB; aggregate in Actions) |
| Toronto Bike Share (`https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status`) | Bikes available, ttl 5s | Fast ticker. STRONG | REST | none | yes | 5 s | none | yes (Oslo `gbfs.urbansharing.com/oslobysykkel.no/station_status.json` also OK) |
| Paris Velib (`https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/records?limit=100`) | Bikes/docks | European commute. STRONG | REST | none | yes | 60 s | none | yes (use select=sum(numbikesavailable)) |
| Paris road counts (`.../comptages-routiers-permanents/records?limit=1`) | Hourly flow | Road flow. NICE | REST | none | yes | hourly | 28.9M records | PARTIAL: 200 but sample dated 2025-10-09; check freshness |
| TfL line status (`https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,elizabeth-line/Status`) | Status severity | Mostly a control. STRONG | REST | none (app_key optional) | yes (*) | 30-60 s | none | yes |
| TfL BikePoint (`https://api.tfl.gov.uk/BikePoint`; lighter `https://tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml`) | Bikes per dock | Commute dip. STRONG | REST/XML | none | yes | 1-2 min | none | yes |
| TfL arrivals / road disruptions / JamCam (`/Line/victoria/Arrivals`, `/Road/all/Disruption`, `/Place/Type/JamCam`) | Train counts, disruptions, camera images | Weak; empty-street visuals. NICE | REST | none | yes | 30 s-5 min | none | yes (Occupancy/CarPark 500) |
| BART (`https://api.bart.gov/api/bsa.aspx?cmd=count&key=...&json=y`) | Trains in service, ETD | Timetable-driven. NICE | REST | shared demo key; register own | yes | 30 s | none | yes |
| Toronto TTC via UMOIQ (`https://retro.umoiq.com/service/publicJSONFeed?command=vehicleLocations&a=ttc&t=0`) | Vehicles, speed | Service proxy. NICE | REST | none | yes | 10 s | none | yes |
| NYC DOT traffic speeds (`https://data.cityofnewyork.us/resource/i4gi-tjb9.json?$limit=2`) | Link speeds | Higher weekday speeds = fewer cars. MUST | REST (Socrata) | none (app token optional) | yes (*) | 5 min | recent only | yes (speed is text; cast) |
| Melbourne pedestrians (`https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/pedestrian-counting-system-past-hour-counts-per-minute/records?limit=100`) | Footfall per minute | Oceania office footfall. MUST | REST | none | yes | 1 min | hourly counts to 2009 (ended Jul 2026 at check) | yes |
| Auckland Transport (`https://api.at.govt.nz/realtime/legacy/vehiclelocations`) | Vehicle locations | NZ first timezone. STRONG | REST | free key | yes | 15-30 s | none | PARTIAL: 401 with CORS; key needed; use Actions |
| Metlink (`https://api.opendata.metlink.org.nz/v1/gtfs-rt/vehiclepositions`) | GTFS-RT | NZ. NICE | REST | free key | no | 30 s | none | PARTIAL: 403 without key |
| TfNSW (`https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/sydneytrains`) | GTFS-RT | AU. NICE | REST | free key | no | 10-30 s | Opal files | NO (500 SOAP fault) |
| OpenSky (`https://opensky-network.org/api/states/all`) | Airborne aircraft count | Business-travel proxy. STRONG | REST | none | NO (opensky-network.org only) | 10 s | none | partial (api. host timed out; ~100 global calls/day anon) |
| adsb.lol (`https://api.adsb.lol/v2/point/51.47/-0.45/250`) | Regional aircraft | Hub flights. STRONG | REST | none | no | 1-5 s | none | yes (250nm radius; sum hubs) |
| adsb.fi (`https://opendata.adsb.fi/api/v2/lat/51.47/lon/-0.45/dist/250`) | Regional aircraft | Redundancy. NICE | REST | none | no | 1 s | none | yes |
| Apple iTunes top free apps (`https://itunes.apple.com/us/rss/topfreeapplications/limit=100/json`) | App ranks (PlayStation App, etc.) | Consumer attention. STRONG | REST | none | yes (*) | ~hourly | none | yes (country paths untested) |
| US Treasury DTS (`https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/dts/deposits_withdrawals_operating_cash?page%5Bsize%5D=2&sort=-record_date`) | Withheld taxes (payroll proxy) | Macro context. NICE | REST | none | yes (*) | daily | to 2005 | yes (encode brackets) |
| FRED ICSA (`https://fred.stlouisfed.org/graph/fredgraph.csv?id=ICSA`) | Initial claims (200,000 on 2026-11-07), UMCSENT | Flat control. STRONG | CSV | none | no | weekly | 1967+ | yes (slow/flaky; Actions) |
| Indeed Hiring Lab (`https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/aggregate_job_postings_US.csv`) | Job postings index | Slow labor control. NICE | CSV | none | yes (*) | daily, ~5-day lag | since 2020-02 | yes |
| TSA volumes (`https://www.tsa.gov/travel/passenger-volumes`) | Daily US air passengers | Business travel; Thanksgiving confound. STRONG | HTML scrape | none | no | daily, 1-day lag | 2019+ | yes (fragile scrape) |
| citybik.es (`https://api.citybik.es/v2/networks`) | Many bike systems | Global map across timezones. NICE | REST | none | yes | 1-5 min | none | yes |
| MobilityData systems.csv (`https://raw.githubusercontent.com/MobilityData/gbfs/master/systems.csv`) | GBFS catalogue | Feed discovery. NICE | CSV | none | yes | weekly | n/a | yes |
| TomTom Flow (`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=KEY&point=..`) | Flow vs free-flow | Direct commute proxy. STRONG | REST | free key (2,500/day) | yes (echo) | 1-2 min | none | NO (401 without key; check ToS on caching) |
| Entur SIRI VM / Translink SEQ / HSL | Vehicle positions | Weak vehicle counts. NICE | XML/protobuf | none | Entur yes; others no | ~10 s | none | yes |
| Open-Meteo (see Energy) | Weather | Confound control for bikes/traffic. STRONG | REST | none | yes | 15 min | since 1940 | yes |

**Rejected:** MTA ridership (data ends 2024/2025), Google/Apple Mobility (discontinued 2022), airplanes.live (403), adsb.one (403), 511.org (key, 60/h).

## Gaming world and platform infrastructure

| Source | Metric | GTA angle | Transport | Auth | CORS | Cadence | Backfill | Verified |
|---|---|---|---|---|---|---|---|---|
| Steam GetNumberOfCurrentPlayers (`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=730`) | CCU per app (CS2 935,507; Dota 2 570; GTA V legacy 271590 about 52.9K; RDR2 1174180; PUBG 578080; Apex 1172470; Rust 252490) | Other games dip. MUST | REST | none | NO | ~1 min | none (SteamCharts monthly) | yes |
| Steam Charts top 100 (`https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/`; also `GetMostPlayedGames/v1/`) | Top-100 CCU; sum 6,110,304 | Steam load proxy; rank moves. MUST | REST | none | NO | 1-5 min | none | yes |
| Kick top categories (`https://kick.com/api/v1/categories/top`) | Viewers per category (GTA VI 1,212,298; IRL 199,947; Just Chatting 144,819; GTA V 53,233; CS2 41,526) | Direct streaming share. MUST | REST (unofficial) | none | yes (echo) | 10-30 s | none | yes (can break/block; `/api/v1/subcategories` lists GTA VI id 13155; official api.kick.com 401; Kick pusher WS NOT verified) |
| Roblox explore (`https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId=abc&sortId=top-playing-now&device=computer&country=all`) | Top-100 player counts | Teen platform dip. STRONG | REST (undocumented) | none | NO | 30-60 s | none | yes |
| Roblox games (`https://games.roblox.com/v1/games?universeIds=994732206,4924922222`) | playing and visits per universe | Fixed panel. STRONG | REST | none | NO | ~1 min | none | yes |
| Steam Store (`https://store.steampowered.com/search/results/?filter=topsellers&json=1&count=50`, storesearch, appdetails, featuredcategories) | Top sellers, names | GTA V/RDR2 sales rank. NICE | REST | none | NO | minutes | none | yes |
| SteamCharts (`https://steamcharts.com/app/271590/chart-data.json`) | Monthly player history | Seasonal baseline. NICE | REST | none | NO | daily/monthly | since release | yes (ToS unclear) |
| SteamSpy (`https://steamspy.com/api.php?request=appdetails&appid=271590`; `top100in2weeks`) | Playtime, owners | Slow tile. NICE | REST | none | NO | daily | 2-week window | yes (1 req/s) |
| Steam appnews (`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=271590&count=1`) | Patch/sale items | Event markers. NICE | REST | none | NO | minutes | by count | yes |
| Netflix Top 10 (`https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv`) | Weekly hours viewed | Viewing hours fall from Nov 23. NICE | TSV | none | NO | weekly (Tue) | since 2021 | yes |
| PlayStation status, Epic/Discord/Twitch/GitHub status, Twitch IRC, Twitch Helix | See Internet and Attention sections | | | | | | | |

**Rejected:** Fortnite.gg (403), SteamDB (410), steamstat.us and StreamsCharts (Cloudflare challenge), SullyGnome (404), Spotify charts (login), Xbox displaycatalog topPaid (404). Twitch GQL with the web client's public Client-ID deliberately not used.

## Recommended v1 signal set

Ranked within groups; all items below were verified today unless flagged.

**A. Live pulse (browser, sub-second)**
1. Bluesky Jetstream: total posts/s and GTA-regex share (WS)
2. Wikimedia EventStreams: global edits/s (SSE)
3. Binance BTCUSDT trade rate and price (WS) plus Coinbase matches as second venue
4. Kick category viewers, GTA VI vs rest (15s poll; unofficial)
5. Polymarket "launch postponed" probability plus CNBC TTWO/SONY/MSFT ticker strip (10-30s)

**B. Attention (cause)**
6. Wikipedia daily pageviews of Grand_Theft_Auto_VI (multi-language) with backfill
7. Bluesky searchPosts hitsTotal hourly (with baseline backfill)
8. Wikimedia global hourly pageviews aggregate
9. GDELT news volume (Actions; retest 429)

**C. Markets (Actions every 5 min, Yahoo v8 chart)**
10. TTWO, SONY, MSFT, NVDA, GME, EA, NTDOY, UBI.PA plus NFLX, DASH, UBER
11. Indices: ^GSPC, ^NDX, ^N225, ^FTSE, ^NZ50
12. ^VIX, gold GC=F, crude CL=F, NZDUSD=X
13. Crypto: Alternative.me F&G, Binance klines backfill, DVOL

**D. Productivity and internet**
14. GitHub Search commits and PRs per hour (Actions with token)
15. npm daily downloads (weekday vs weekend shape)
16. Stack Exchange question counts (daily)
17. Statuspage health tiles: Discord, Twitch, Epic, GitHub, Cloudflare; PSN status counts (Actions)
18. Cloudflare Radar HTTP traffic by country (needs free token; unverified with data)

**E. Other games**
19. Steam top-100 summed CCU plus CS2, Dota 2, GTA V, RDR2, PUBG (Actions)
20. Roblox top-100 sum and fixed-universe panel

**F. Energy and mobility**
21. Elexon GB demand (5 min, backfill)
22. ODRE France consumption (15 min)
23. AEMO NSW/VIC/QLD demand (Actions)
24. em6 NZ daily generation by fuel (first unlock country)
25. EIA hourly demand: ERCO, PJM, CISO, NYIS (free key, Actions)
26. Citi Bike idle bikes and Toronto bike share, TfL BikePoint
27. NYC DOT traffic speeds
28. Melbourne pedestrian counts
29. Open-Meteo temperature for each grid/city (control)
30. FRED ICSA / Treasury DTS as slow macro controls

## Confounds to control for

- Calendar: Nov 19 is a Thursday. US Thanksgiving Nov 26 and Black Friday Nov 27 distort commerce, travel (TSA), traffic, energy and market volume; show them as annotated bands and exclude or flag them in baseline comparisons.
- Weekday/weekend: always compare same-weekday baselines (for example the mean of the previous 4 same weekdays), never "yesterday".
- Rolling unlock: NZ unlocks 11:00 UTC Nov 18, rest of world over about 19 hours; use local-time alignment per region, and mark each unlock window as a chart event.
- Weather: normalise grid demand, bike and traffic series by temperature (Open-Meteo); heavy precipitation suppresses biking.
- Markets: TTWO moves (-4.47% Nov 17, +6.77% pre-market Nov 18) are normal earnings/hype news; show alongside index and sector moves and use "sell the news" framing carefully. VIX (24.3) and F&G (11) are already stressed pre-launch. Single snapshots are not a baseline.
- Data quirks: Wikipedia daily data lags about 1 day; EIA lags 1-2h; Cloudflare about 1h; GitHub counts can be approximate; Stack Overflow volume is small, aggregate daily; Coinpaprika vs CoinLore volumes differ about 2x (stay with one source); Polymarket markets resolve and go flat; Steam/Roblox/Kick baselines exist only from our own snapshots (hours old at launch), so label baseline length honestly.
- Other releases/events: sales, patches, esports or Netflix releases (use Steam appnews as annotations).
- Honest presentation: show raw value, baseline band (mean and min/max of baseline period), percent deviation, and baseline length/sample size; label every productivity-loss figure as an estimate; state that correlation is not attribution; show control series (GitHub status, calm services) so viewers can see what did not move.

## Open questions / gaps

- Official confirmation of regional unlock times, pre-order counts, Trailer 3, and a Nov 2026 TTWO series (use Yahoo).
- Origin tests used a spoofed header from curl, not a real browser on the final github.io origin; re-test CORS (many "echo" origins) and blocking from the real Pages origin and from GitHub Actions IPs (Yahoo, Nasdaq, Binance.com 451, Kalshi, Reddit).
- Key-gated sources never tested with a real key: Cloudflare Radar, Twitch Helix, YouTube (trailer video IDs unknown), Finnhub WS, Electricity Maps, ENTSO-E, GridStatus, TomTom, Auckland Transport, Metlink, TfNSW.
- GDELT: conflicting reports (200 with CORS vs 429); payload not fully inspected.
- Kick endpoints are unofficial and its WebSocket was not verified; Roblox explore, Steam charts and Yahoo are unofficial and may break.
- Yahoo streamer in a browser (Origin check, protobuf decoding) untested.
- IODA tested only with Nov 2025 epochs; retest current window. TEPCO current-year archive file name unconfirmed. Paris road counts freshness and Melbourne hourly-baseline dataset currency unconfirmed. Xbox statuspage mirror fidelity unconfirmed. Nasdaq historical endpoint and CNBC chart ranges untested. Deribit/Manifold WS untested. Steam top-100 history only from our own snapshots.
- No free live NZ demand (Transpower); em6 free price is daily only. No free live IXP traffic. No free Steam-wide online-user total (use top-100 sum). Reddit counts unavailable.
- Terms of use: SteamCharts/TSA scraping, TomTom caching, Open-Meteo non-commercial, Energy-Charts CC BY 4.0, ExchangeRate-API attribution.
