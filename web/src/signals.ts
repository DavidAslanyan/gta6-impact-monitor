import type { Region } from './config'

export type Group = 'attention' | 'games' | 'productivity' | 'markets' | 'energy' | 'mobility' | 'status' | 'control'
export type Fmt = 'int' | 'dec' | 'usd' | 'pct' | 'rank' | 'level' | 'mw' | 'temp'

export interface Signal {
  id: string
  label: string
  group: Group
  unit: string
  fmt: Fmt
  region: Region
  source: string
  sourceUrl: string
  note: string
  unofficial?: boolean
  featured?: boolean
  /** Rank-like signals: a smaller number is "more". */
  inverted?: boolean
}

const S = (s: Signal) => s

const STEAM = { source: 'Steam Web API', sourceUrl: 'https://partner.steamgames.com/doc/webapi/ISteamUserStats' }
const KICK = { source: 'Kick (public site API)', sourceUrl: 'https://kick.com/categories', unofficial: true }
const CNBC = { source: 'CNBC market data', sourceUrl: 'https://www.cnbc.com/markets/', unofficial: true }
const WIKI = { source: 'Wikimedia Pageviews API', sourceUrl: 'https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/' }

const stock = (slug: string, label: string, note: string, featured = false): Signal =>
  S({ id: `mkt.${slug}.price`, label, group: 'markets', unit: 'USD', fmt: 'usd', region: 'americas', ...CNBC, note, featured })

export const SIGNALS: Signal[] = [
  // ── Attention (Cause Signals)
  S({ id: 'attention.wiki.gta6.all.daily', label: 'GTA VI Wikipedia readers (8 languages)', group: 'attention', unit: 'views/day', fmt: 'int', region: 'oceania', ...WIKI, note: 'Daily human pageviews of the GTA VI article in English, German, French, Spanish, Portuguese, Italian, Russian and Japanese.', featured: true }),
  S({ id: 'attention.wiki.gta6.en.daily', label: 'English Wikipedia — GTA VI', group: 'attention', unit: 'views/day', fmt: 'int', region: 'oceania', ...WIKI, note: 'Daily human pageviews, English Wikipedia.' }),
  S({ id: 'attention.wiki.gta6.de.daily', label: 'German Wikipedia — GTA VI', group: 'attention', unit: 'views/day', fmt: 'int', region: 'europe', ...WIKI, note: 'Daily human pageviews, German Wikipedia.' }),
  S({ id: 'attention.wiki.gta6.ja.daily', label: 'Japanese Wikipedia — GTA VI', group: 'attention', unit: 'views/day', fmt: 'int', region: 'oceania', ...WIKI, note: 'Daily human pageviews, Japanese Wikipedia.' }),
  S({ id: 'kick.gta6.viewers', label: 'Live viewers watching GTA VI on Kick', group: 'attention', unit: 'viewers', fmt: 'int', region: 'americas', ...KICK, note: 'Concurrent viewers in the GTA VI category.', featured: true }),
  S({ id: 'kick.gta6.share', label: 'GTA VI share of Kick top-category viewers', group: 'attention', unit: '%', fmt: 'pct', region: 'americas', ...KICK, note: 'GTA VI viewers as a share of all viewers across Kick\'s top categories.' }),
  S({ id: 'live.bluesky.gta_per_min', label: 'Bluesky posts mentioning GTA VI', group: 'attention', unit: 'posts/min', fmt: 'dec', region: 'americas', source: 'Bluesky Jetstream', sourceUrl: 'https://docs.bsky.app/blog/jetstream', note: 'Matched by keyword over a 20-second sample every 5 minutes. Only counts are kept — never post text.' }),
  S({ id: 'appstore.us.playstation.rank', label: 'PlayStation App — US App Store rank', group: 'attention', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Position among the top 200 free iPhone apps (201 = not in the chart).', inverted: true }),
  S({ id: 'appstore.us.xbox.rank', label: 'Xbox app — US App Store rank', group: 'attention', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Position among the top 200 free iPhone apps (201 = not in the chart).', inverted: true }),

  // ── Other games
  S({ id: 'steam.top100.players', label: 'Players in Steam\'s top 100 games', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Sum of concurrent players across Steam\'s 100 most-played games right now. GTA VI is console-only, so it is not part of this number.', featured: true }),
  S({ id: 'roblox.top.players', label: 'Players in Roblox\'s top experiences', group: 'games', unit: 'players', fmt: 'int', region: 'americas', source: 'Roblox explore API', sourceUrl: 'https://www.roblox.com/charts', unofficial: true, note: 'Sum of concurrent players across the "Top Playing Now" chart.', featured: true }),
  S({ id: 'steam.app.gta5.players', label: 'GTA V (PC) players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players of the previous game on Steam.' }),
  S({ id: 'steam.app.rdr2.players', label: 'Red Dead Redemption 2 (PC) players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'steam.app.cs2.players', label: 'Counter-Strike 2 players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'steam.app.dota2.players', label: 'Dota 2 players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'steam.app.pubg.players', label: 'PUBG players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'steam.app.apex.players', label: 'Apex Legends players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'steam.app.rust.players', label: 'Rust players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'steam.app.marvel-rivals.players', label: 'Marvel Rivals players', group: 'games', unit: 'players', fmt: 'int', region: 'americas', ...STEAM, note: 'Concurrent players on Steam.' }),
  S({ id: 'kick.gta5.viewers', label: 'GTA V viewers on Kick', group: 'games', unit: 'viewers', fmt: 'int', region: 'americas', ...KICK, note: 'Concurrent viewers in the GTA V category.' }),
  S({ id: 'kick.justchatting.viewers', label: '"Just Chatting" viewers on Kick', group: 'games', unit: 'viewers', fmt: 'int', region: 'americas', ...KICK, note: 'The usual biggest category on streaming sites.' }),
  S({ id: 'kick.cs2.viewers', label: 'Counter-Strike viewers on Kick', group: 'games', unit: 'viewers', fmt: 'int', region: 'americas', ...KICK, note: 'Concurrent viewers in Counter-Strike categories.' }),

  // ── Productivity & internet
  S({ id: 'dev.github.commits.hourly', label: 'Public commits pushed to GitHub per hour', group: 'productivity', unit: 'commits/h', fmt: 'int', region: 'americas', source: 'GitHub Search API', sourceUrl: 'https://docs.github.com/en/rest/search', note: 'Commits by committer date in each complete hour, worldwide. A developer-productivity gauge.', featured: true }),
  S({ id: 'dev.github.prs.hourly', label: 'Pull requests opened on GitHub per hour', group: 'productivity', unit: 'PRs/h', fmt: 'int', region: 'americas', source: 'GitHub Search API', sourceUrl: 'https://docs.github.com/en/rest/search', note: 'New public pull requests per complete hour, worldwide.' }),
  S({ id: 'dev.npm.downloads.daily', label: 'npm package downloads per day', group: 'productivity', unit: 'downloads/day', fmt: 'int', region: 'americas', source: 'npm registry API', sourceUrl: 'https://github.com/npm/registry/blob/main/docs/download-counts.md', note: 'All packages. Weekdays run ~2× weekends; a weekday that looks like a weekend means people are not building software.' }),
  S({ id: 'internet.wiki.views.hourly', label: 'All Wikipedia pageviews per hour', group: 'productivity', unit: 'views/h', fmt: 'int', region: 'americas', ...WIKI, note: 'Human pageviews across every Wikimedia project — how much the world is reading.', featured: true }),
  S({ id: 'live.wiki.edits_per_sec', label: 'Wikipedia edits per second', group: 'productivity', unit: 'edits/s', fmt: 'dec', region: 'americas', source: 'Wikimedia EventStreams', sourceUrl: 'https://stream.wikimedia.org/?doc', note: 'All edits across Wikimedia, sampled for 20 seconds every 5 minutes.' }),
  S({ id: 'live.wiki.human_edits_per_sec', label: 'Human (non-bot) Wikipedia edits per second', group: 'productivity', unit: 'edits/s', fmt: 'dec', region: 'americas', source: 'Wikimedia EventStreams', sourceUrl: 'https://stream.wikimedia.org/?doc', note: 'Edits not flagged as bots.' }),
  S({ id: 'live.bluesky.posts_per_sec', label: 'Bluesky posts per second (all topics)', group: 'productivity', unit: 'posts/s', fmt: 'dec', region: 'americas', source: 'Bluesky Jetstream', sourceUrl: 'https://docs.bsky.app/blog/jetstream', note: 'Global posting rate on Bluesky.' }),
  S({ id: 'appstore.us.doordash.rank', label: 'DoorDash — US App Store rank', group: 'productivity', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Food delivery: people staying in.', inverted: true }),
  S({ id: 'appstore.us.ubereats.rank', label: 'Uber Eats — US App Store rank', group: 'productivity', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Food delivery: people staying in.', inverted: true }),
  S({ id: 'appstore.us.discord.rank', label: 'Discord — US App Store rank', group: 'productivity', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Gamers coordinating.', inverted: true }),

  // ── Markets
  stock('ttwo', 'Take-Two Interactive (TTWO)', 'The publisher of GTA VI.', true),
  stock('sony', 'Sony Group (SONY)', 'Maker of the PlayStation 5.', true),
  stock('msft', 'Microsoft (MSFT)', 'Maker of the Xbox Series X|S.'),
  stock('gme', 'GameStop (GME)', 'Video-game retailer.'),
  stock('ea', 'Electronic Arts (EA)', 'Rival publisher.'),
  stock('ntdoy', 'Nintendo (NTDOY)', 'Rival platform holder.'),
  stock('rblx', 'Roblox (RBLX)', 'Competing for the same play time.'),
  stock('nflx', 'Netflix (NFLX)', 'Competing for the same screen time.'),
  stock('dash', 'DoorDash (DASH)', 'Food delivery to people who are not leaving the house.'),
  stock('uber', 'Uber (UBER)', 'Rides and delivery.'),
  stock('nvda', 'Nvidia (NVDA)', 'The market\'s bellwether.'),
  stock('amd', 'AMD (AMD)', 'Supplies the chips inside both PS5 and Xbox Series X|S.'),
  S({ id: 'mkt.spx.price', label: 'S&P 500', group: 'markets', unit: 'pts', fmt: 'dec', region: 'americas', ...CNBC, note: 'US large-cap index.', featured: true }),
  S({ id: 'mkt.nasdaq.price', label: 'Nasdaq Composite', group: 'markets', unit: 'pts', fmt: 'dec', region: 'americas', ...CNBC, note: 'US tech-heavy index.' }),
  S({ id: 'mkt.nikkei.price', label: 'Nikkei 225', group: 'markets', unit: 'pts', fmt: 'dec', region: 'oceania', ...CNBC, note: 'Japan — home of Sony.' }),
  S({ id: 'mkt.ftse.price', label: 'FTSE 100', group: 'markets', unit: 'pts', fmt: 'dec', region: 'europe', ...CNBC, note: 'UK — home of Rockstar North.' }),
  S({ id: 'mkt.nzx50.price', label: 'NZX 50', group: 'markets', unit: 'pts', fmt: 'dec', region: 'oceania', ...CNBC, note: 'New Zealand — the first market to trade after an unlock.' }),
  S({ id: 'mkt.vix.price', label: 'VIX volatility index', group: 'markets', unit: 'pts', fmt: 'dec', region: 'americas', ...CNBC, note: 'Wall Street\'s "fear gauge".' }),
  S({ id: 'mkt.crude.price', label: 'Crude oil (WTI front month)', group: 'markets', unit: 'USD/bbl', fmt: 'usd', region: 'americas', ...CNBC, note: 'Fewer commutes, less fuel.' }),
  S({ id: 'mkt.gold.price', label: 'Gold (front month)', group: 'markets', unit: 'USD/oz', fmt: 'usd', region: 'americas', ...CNBC, note: 'Safe-haven demand.' }),
  S({ id: 'mkt.nzdusd.price', label: 'NZD / USD', group: 'markets', unit: 'USD', fmt: 'dec', region: 'oceania', ...CNBC, note: 'The first currency to open after an unlock.' }),
  S({ id: 'crypto.btc.price', label: 'Bitcoin (BTC/USDT)', group: 'markets', unit: 'USD', fmt: 'usd', region: 'americas', source: 'Binance market data', sourceUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/rest-api', note: 'Hourly close.' }),
  S({ id: 'crypto.btc.trades_per_hour', label: 'Bitcoin trades per hour (Binance)', group: 'markets', unit: 'trades/h', fmt: 'int', region: 'americas', source: 'Binance market data', sourceUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/rest-api', note: 'Number of BTC/USDT trades each hour — retail traders busy elsewhere trade less.', featured: true }),
  S({ id: 'crypto.fear_greed', label: 'Crypto Fear & Greed Index', group: 'markets', unit: '0–100', fmt: 'int', region: 'americas', source: 'Alternative.me', sourceUrl: 'https://alternative.me/crypto/fear-and-greed-index/', note: 'Daily sentiment index.' }),

  // ── Energy
  S({ id: 'energy.gb.demand_mw', label: 'Great Britain electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'europe', source: 'Elexon BMRS', sourceUrl: 'https://bmrs.elexon.co.uk/', note: '5-minute national demand outturn. Offices empty, living rooms full.', featured: true }),
  S({ id: 'energy.fr.demand_mw', label: 'France electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'europe', source: 'RTE eco2mix (ODRÉ)', sourceUrl: 'https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/', note: '15-minute national consumption.', featured: true }),
  S({ id: 'energy.au.nsw.demand_mw', label: 'New South Wales electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'oceania', source: 'AEMO', sourceUrl: 'https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/aggregated-data', note: '5-minute total demand, Sydney\'s grid region.' }),
  S({ id: 'energy.au.vic.demand_mw', label: 'Victoria electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'oceania', source: 'AEMO', sourceUrl: 'https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/aggregated-data', note: '5-minute total demand, Melbourne\'s grid region.' }),
  S({ id: 'energy.au.qld.demand_mw', label: 'Queensland electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'oceania', source: 'AEMO', sourceUrl: 'https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/aggregated-data', note: '5-minute total demand.' }),
  S({ id: 'energy.us.caiso.demand_mw', label: 'California electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'americas', source: 'CAISO Today\'s Outlook', sourceUrl: 'https://www.caiso.com/todays-outlook', note: '5-minute demand for the California grid.', featured: true }),
  S({ id: 'energy.us.erco.demand_mw', label: 'Texas (ERCOT) electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'americas', source: 'U.S. EIA', sourceUrl: 'https://www.eia.gov/electricity/gridmonitor/', note: 'Hourly demand.' }),
  S({ id: 'energy.us.pjm.demand_mw', label: 'PJM (US Mid-Atlantic) electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'americas', source: 'U.S. EIA', sourceUrl: 'https://www.eia.gov/electricity/gridmonitor/', note: 'Hourly demand.' }),
  S({ id: 'energy.us.nyis.demand_mw', label: 'New York electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'americas', source: 'U.S. EIA', sourceUrl: 'https://www.eia.gov/electricity/gridmonitor/', note: 'Hourly demand.' }),
  S({ id: 'energy.nz.generation_mwh.daily', label: 'New Zealand electricity generated per day', group: 'energy', unit: 'MWh/day', fmt: 'int', region: 'oceania', source: 'em6 (Transpower)', sourceUrl: 'https://www.em6.co.nz/', note: 'All fuels. The first country to unlock.' }),

  // ── Mobility
  S({ id: 'bike.nyc.available', label: 'Idle Citi Bikes in New York', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'americas', source: 'Citi Bike GBFS', sourceUrl: 'https://citibikenyc.com/system-data', note: 'Bikes sitting in docks. More idle bikes = fewer people riding.', featured: true }),
  S({ id: 'bike.london.available', label: 'Idle Santander Cycles in London', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'europe', source: 'TfL Unified API', sourceUrl: 'https://api.tfl.gov.uk/', note: 'Bikes sitting in docks. More idle bikes = fewer people riding.', featured: true }),
  S({ id: 'bike.paris.available', label: 'Idle Vélib\' bikes in Paris', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'europe', source: 'Paris Open Data', sourceUrl: 'https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/', note: 'Bikes sitting in docks. More idle bikes = fewer people riding.' }),
  S({ id: 'bike.toronto.available', label: 'Idle Bike Share bikes in Toronto', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'americas', source: 'Bike Share Toronto GBFS', sourceUrl: 'https://bikesharetoronto.com/system-data/', note: 'Bikes sitting in docks.' }),
  S({ id: 'traffic.nyc.speed_mph', label: 'New York average road speed', group: 'mobility', unit: 'mph', fmt: 'dec', region: 'americas', source: 'NYC DOT real-time speeds', sourceUrl: 'https://data.cityofnewyork.us/Transportation/DOT-Traffic-Speeds-NBE/i4gi-tjb9', note: 'Mean speed over the latest sensor readings. Emptier roads move faster.', featured: true }),
  S({ id: 'footfall.melbourne.per_min', label: 'Melbourne CBD pedestrians per minute', group: 'mobility', unit: 'people/min', fmt: 'dec', region: 'oceania', source: 'City of Melbourne', sourceUrl: 'https://data.melbourne.vic.gov.au/', note: 'Footfall sensors across the city centre.', featured: true }),

  // ── Platform status
  S({ id: 'status.psn.issues', label: 'PlayStation Network active issues', group: 'status', unit: 'issues', fmt: 'int', region: 'americas', source: 'PlayStation Network status', sourceUrl: 'https://status.playstation.com/', unofficial: true, note: 'Count of reported service problems in the Americas and Europe.' }),
  S({ id: 'status.xbox.level', label: 'Xbox network status', group: 'status', unit: 'level', fmt: 'level', region: 'americas', source: 'Xbox status page', sourceUrl: 'https://support.xbox.com/xbox-live-status', note: '0 = operational … 3 = critical.' }),
  S({ id: 'status.discord.level', label: 'Discord status', group: 'status', unit: 'level', fmt: 'level', region: 'americas', source: 'Discord status page', sourceUrl: 'https://discordstatus.com/', note: '0 = operational … 3 = critical.' }),
  S({ id: 'status.twitch.level', label: 'Twitch status', group: 'status', unit: 'level', fmt: 'level', region: 'americas', source: 'Twitch status page', sourceUrl: 'https://status.twitch.com/', note: '0 = operational … 3 = critical.' }),
  S({ id: 'status.cloudflare.level', label: 'Cloudflare status', group: 'status', unit: 'level', fmt: 'level', region: 'americas', source: 'Cloudflare status page', sourceUrl: 'https://www.cloudflarestatus.com/', note: '0 = operational … 3 = critical.' }),
  S({ id: 'status.github.level', label: 'GitHub status', group: 'status', unit: 'level', fmt: 'level', region: 'americas', source: 'GitHub status page', sourceUrl: 'https://www.githubstatus.com/', note: '0 = operational … 3 = critical.' }),
  S({ id: 'status.epic.level', label: 'Epic Games status', group: 'status', unit: 'level', fmt: 'level', region: 'americas', source: 'Epic Games status page', sourceUrl: 'https://status.epicgames.com/', note: '0 = operational … 3 = critical.' }),

  // ── Control Signals
  S({ id: 'control.weather.london.temp_c', label: 'London temperature', group: 'control', unit: '°C', fmt: 'temp', region: 'europe', source: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', note: 'Weather drives electricity demand and cycling — check it before blaming GTA.' }),
  S({ id: 'control.weather.paris.temp_c', label: 'Paris temperature', group: 'control', unit: '°C', fmt: 'temp', region: 'europe', source: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', note: 'Weather control for French demand and Vélib\'.' }),
  S({ id: 'control.weather.nyc.temp_c', label: 'New York temperature', group: 'control', unit: '°C', fmt: 'temp', region: 'americas', source: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', note: 'Weather control for Citi Bike and traffic.' }),
  S({ id: 'control.weather.la.temp_c', label: 'Los Angeles temperature', group: 'control', unit: '°C', fmt: 'temp', region: 'americas', source: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', note: 'Weather control for California demand.' }),
  S({ id: 'control.weather.sydney.temp_c', label: 'Sydney temperature', group: 'control', unit: '°C', fmt: 'temp', region: 'oceania', source: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', note: 'Weather control for NSW demand.' }),
  S({ id: 'control.weather.auckland.temp_c', label: 'Auckland temperature', group: 'control', unit: '°C', fmt: 'temp', region: 'oceania', source: 'Open-Meteo', sourceUrl: 'https://open-meteo.com/', note: 'Weather control for New Zealand.' }),
  S({ id: 'control.us.jobless_claims.weekly', label: 'US initial jobless claims', group: 'control', unit: 'claims/week', fmt: 'int', region: 'americas', source: 'FRED (U.S. Dept. of Labor)', sourceUrl: 'https://fred.stlouisfed.org/series/ICSA', note: 'Nobody gets fired for playing GTA — at least not in the first week. This should not move.' }),
]

export const SIGNAL_BY_ID = Object.fromEntries(SIGNALS.map((s) => [s.id, s])) as Record<string, Signal>

export const GROUPS: { key: Group; title: string; kicker: string; intro: string }[] = [
  { key: 'attention', title: 'The Cause', kicker: '01 — Attention', intro: 'Direct measures of how much of the world is looking at GTA VI right now.' },
  { key: 'games', title: 'Every Other Game', kicker: '02 — Gaming', intro: 'If everyone is in Leonida, who is left playing everything else? Concurrent players and viewers across PC, Roblox and streaming.' },
  { key: 'productivity', title: 'Work & the Internet', kicker: '03 — Productivity', intro: 'Code commits, package downloads, reading and posting — the rhythm of a working world.' },
  { key: 'markets', title: 'Markets', kicker: '04 — Money', intro: 'The publisher, the platform makers, the competition for screen time, and the broader market.' },
  { key: 'energy', title: 'The Grid', kicker: '05 — Energy', intro: 'Offices go dark, living rooms light up. National electricity demand, every 5–60 minutes.' },
  { key: 'mobility', title: 'The Streets', kicker: '06 — Mobility', intro: 'Bikes left in their docks, faster roads, quieter pavements.' },
  { key: 'status', title: 'Under Load', kicker: '07 — Infrastructure', intro: 'Console networks and the services gamers lean on.' },
  { key: 'control', title: 'Control Signals', kicker: '08 — Controls', intro: 'Things that should NOT move because of a video game. If these move too, be sceptical about everything above.' },
]
