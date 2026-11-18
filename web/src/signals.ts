import type { Region } from './config'

export type Group = 'attention' | 'games' | 'productivity' | 'study' | 'commute' | 'markets' | 'crypto' | 'energy' | 'mobility' | 'radar' | 'safety' | 'lifestyle' | 'status' | 'control'
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
  /** official = published by the operator/agency itself; public = documented public API; unofficial = undocumented endpoint. */
  tier?: 'official' | 'public' | 'unofficial'
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
  S({ id: 'internet.cf.nz.http', label: 'Web traffic — New Zealand', group: 'productivity', unit: 'index', fmt: 'dec', region: 'oceania', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from New Zealand (hourly).' }),
  S({ id: 'internet.cf.au.http', label: 'Web traffic — Australia', group: 'productivity', unit: 'index', fmt: 'dec', region: 'oceania', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from Australia (hourly).' }),
  S({ id: 'internet.cf.jp.http', label: 'Web traffic — Japan', group: 'productivity', unit: 'index', fmt: 'dec', region: 'oceania', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from Japan (hourly).' }),
  S({ id: 'internet.cf.gb.http', label: 'Web traffic — United Kingdom', group: 'productivity', unit: 'index', fmt: 'dec', region: 'europe', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from United Kingdom (hourly).', featured: true }),
  S({ id: 'internet.cf.de.http', label: 'Web traffic — Germany', group: 'productivity', unit: 'index', fmt: 'dec', region: 'europe', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from Germany (hourly).' }),
  S({ id: 'internet.cf.fr.http', label: 'Web traffic — France', group: 'productivity', unit: 'index', fmt: 'dec', region: 'europe', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from France (hourly).' }),
  S({ id: 'internet.cf.us.http', label: 'Web traffic — United States', group: 'productivity', unit: 'index', fmt: 'dec', region: 'americas', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from United States (hourly).', featured: true }),
  S({ id: 'internet.cf.br.http', label: 'Web traffic — Brazil', group: 'productivity', unit: 'index', fmt: 'dec', region: 'americas', source: 'Cloudflare Radar', sourceUrl: 'https://radar.cloudflare.com/', note: 'Normalised HTTP request volume seen by Cloudflare from Brazil (hourly).' }),
  S({ id: 'live.wiki.edits_per_sec', label: 'Wikipedia edits per second', group: 'productivity', unit: 'edits/s', fmt: 'dec', region: 'americas', source: 'Wikimedia EventStreams', sourceUrl: 'https://stream.wikimedia.org/?doc', note: 'All edits across Wikimedia, sampled for 20 seconds every 5 minutes.' }),
  S({ id: 'live.wiki.human_edits_per_sec', label: 'Human (non-bot) Wikipedia edits per second', group: 'productivity', unit: 'edits/s', fmt: 'dec', region: 'americas', source: 'Wikimedia EventStreams', sourceUrl: 'https://stream.wikimedia.org/?doc', note: 'Edits not flagged as bots.' }),
  S({ id: 'live.bluesky.posts_per_sec', label: 'Bluesky posts per second (all topics)', group: 'productivity', unit: 'posts/s', fmt: 'dec', region: 'americas', source: 'Bluesky Jetstream', sourceUrl: 'https://docs.bsky.app/blog/jetstream', note: 'Global posting rate on Bluesky.' }),
  S({ id: 'appstore.us.doordash.rank', label: 'DoorDash — US App Store rank', group: 'lifestyle', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Food delivery: people staying in.', inverted: true }),
  S({ id: 'appstore.us.ubereats.rank', label: 'Uber Eats — US App Store rank', group: 'lifestyle', unit: 'rank', fmt: 'rank', region: 'americas', source: 'Apple iTunes RSS', sourceUrl: 'https://rss.marketingtools.apple.com/', note: 'Food delivery: people staying in.', inverted: true }),
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
  S({ id: 'crypto.btc.price', label: 'Bitcoin (BTC/USDT)', group: 'crypto', unit: 'USD', fmt: 'usd', region: 'americas', source: 'Binance market data', sourceUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/rest-api', note: 'Hourly close.' }),
  S({ id: 'crypto.btc.trades_per_hour', label: 'Bitcoin trades per hour (Binance)', group: 'crypto', unit: 'trades/h', fmt: 'int', region: 'americas', source: 'Binance market data', sourceUrl: 'https://developers.binance.com/docs/binance-spot-api-docs/rest-api', note: 'Number of BTC/USDT trades each hour — retail traders busy elsewhere trade less.', featured: true }),
  S({ id: 'crypto.fear_greed', label: 'Crypto Fear & Greed Index', group: 'crypto', unit: '0–100', fmt: 'int', region: 'americas', source: 'Alternative.me', sourceUrl: 'https://alternative.me/crypto/fear-and-greed-index/', note: 'Daily sentiment index.' }),

  // ── Energy
  S({ id: 'energy.gb.demand_mw', label: 'Great Britain electricity demand', group: 'energy', unit: 'MW', fmt: 'mw', region: 'europe', source: 'Elexon BMRS', sourceUrl: 'https://bmrs.elexon.co.uk/', note: '5-minute national demand outturn. If people stay home, demand can shift from offices to living rooms.', featured: true }),
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
  S({ id: 'bike.nyc.available', label: 'Idle Citi Bikes in New York', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'americas', source: 'Citi Bike GBFS', sourceUrl: 'https://citibikenyc.com/system-data', note: 'Bikes sitting in docks. More idle bikes usually means fewer people riding — but also night-time and operator rebalancing.', featured: true }),
  S({ id: 'bike.london.available', label: 'Idle Santander Cycles in London', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'europe', source: 'TfL Unified API', sourceUrl: 'https://api.tfl.gov.uk/', note: 'Bikes sitting in docks. More idle bikes = fewer people riding.', featured: true }),
  S({ id: 'bike.paris.available', label: 'Idle Vélib\' bikes in Paris', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'europe', source: 'Paris Open Data', sourceUrl: 'https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/', note: 'Bikes sitting in docks. More idle bikes = fewer people riding.' }),
  S({ id: 'bike.toronto.available', label: 'Idle Bike Share bikes in Toronto', group: 'mobility', unit: 'bikes', fmt: 'int', region: 'americas', source: 'Bike Share Toronto GBFS', sourceUrl: 'https://bikesharetoronto.com/system-data/', note: 'Bikes sitting in docks.' }),
  S({ id: 'traffic.nyc.speed_mph', label: 'New York average road speed', group: 'mobility', unit: 'mph', fmt: 'dec', region: 'americas', source: 'NYC DOT real-time speeds', sourceUrl: 'https://data.cityofnewyork.us/Transportation/DOT-Traffic-Speeds-NBE/i4gi-tjb9', note: 'Mean speed over the latest sensor readings. Emptier roads tend to move faster.', featured: true }),
  S({ id: 'footfall.melbourne.per_min', label: 'Melbourne CBD pedestrians per minute', group: 'mobility', unit: 'people/min', fmt: 'dec', region: 'oceania', source: 'City of Melbourne', sourceUrl: 'https://data.melbourne.vic.gov.au/', note: 'Footfall sensors across the city centre.', featured: true }),

  // ── School & study
  S({ id: 'study.homework_index.daily', label: 'Homework index — school-topic reading on Wikipedia', group: 'study', unit: 'views/day', fmt: 'int', region: 'americas', ...WIKI, note: 'Daily English-Wikipedia views of 16 classic curriculum articles (photosynthesis, the Pythagorean theorem, the French Revolution…). A proxy for students studying.', featured: true }),
  S({ id: 'status.canvas.level', label: 'Canvas (school & university LMS) status', group: 'study', unit: 'level', fmt: 'level', region: 'americas', source: 'Instructure status page', sourceUrl: 'https://status.instructure.com/', note: 'Canvas runs coursework for thousands of schools and universities. 0 = operational … 3 = critical.' }),

  // ── Going to work
  S({ id: 'commute.london.tube_crowding_pct', label: 'London Underground crowding at six central stations', group: 'commute', unit: '% of TfL typical', fmt: 'dec', region: 'europe', source: 'TfL Unified API — Crowding', sourceUrl: 'https://api-portal.tfl.gov.uk/', note: 'TfL\'s live crowding at Bank, Oxford Circus, King\'s Cross, Liverpool Street, Canary Wharf and Waterloo, as a percentage of TfL\'s own typical level.', featured: true }),
  S({ id: 'commute.melbourne.parking_occupied_pct', label: 'Melbourne CBD on-street parking occupied', group: 'commute', unit: '% of bays', fmt: 'pct', region: 'oceania', source: 'City of Melbourne parking sensors', sourceUrl: 'https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors/', note: 'Share of ~6,000 sensor-equipped bays with a car in them right now.', featured: true }),
  S({ id: 'traffic.madrid.vehicles_per_hour', label: 'Madrid road traffic (sum of ~4,900 sensors)', group: 'commute', unit: 'vehicles/h', fmt: 'int', region: 'europe', source: 'Ayuntamiento de Madrid — Informo', sourceUrl: 'https://informo.madrid.es/', note: 'Total hourly vehicle intensity reported by the city\'s traffic measuring points.' }),
  S({ id: 'traffic.hongkong.speed_kmh', label: 'Hong Kong strategic-road average speed', group: 'commute', unit: 'km/h', fmt: 'dec', region: 'oceania', source: 'HK Transport Department', sourceUrl: 'https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads', note: 'Mean lane speed across valid detectors on major roads. Emptier roads tend to move faster.' }),
  S({ id: 'traffic.hongkong.volume', label: 'Hong Kong strategic-road vehicle count', group: 'commute', unit: 'vehicles/interval', fmt: 'int', region: 'oceania', source: 'HK Transport Department', sourceUrl: 'https://data.gov.hk/en-data/dataset/hk-td-sm_4-traffic-data-strategic-major-roads', note: 'Vehicles counted by valid detectors in the latest 30-second interval.' }),
  S({ id: 'air.global.aircraft_airborne', label: 'Aircraft airborne worldwide', group: 'commute', unit: 'aircraft', fmt: 'int', region: 'americas', source: 'OpenSky Network', sourceUrl: 'https://opensky-network.org/', note: 'Transponder-equipped aircraft in the air right now (sampled every 20 minutes). Business travel shows up here.', featured: true }),
  S({ id: 'air.nyc.aircraft', label: 'Aircraft within 150 nm of New York (JFK)', group: 'commute', unit: 'aircraft', fmt: 'int', region: 'americas', source: 'adsb.lol', sourceUrl: 'https://adsb.lol/', note: 'Airborne aircraft around the New York area.' }),
  S({ id: 'air.london.aircraft', label: 'Aircraft within 150 nm of London (LHR)', group: 'commute', unit: 'aircraft', fmt: 'int', region: 'europe', source: 'adsb.lol', sourceUrl: 'https://adsb.lol/', note: 'Airborne aircraft around London.' }),
  S({ id: 'air.frankfurt.aircraft', label: 'Aircraft within 150 nm of Frankfurt (FRA)', group: 'commute', unit: 'aircraft', fmt: 'int', region: 'europe', source: 'adsb.lol', sourceUrl: 'https://adsb.lol/', note: 'Airborne aircraft around Frankfurt.' }),
  S({ id: 'air.tokyo.aircraft', label: 'Aircraft within 150 nm of Tokyo (HND)', group: 'commute', unit: 'aircraft', fmt: 'int', region: 'oceania', source: 'adsb.lol', sourceUrl: 'https://adsb.lol/', note: 'Airborne aircraft around Tokyo.' }),

  // ── Crypto & on-chain
  S({ id: 'crypto.btc.onchain_tx.daily', label: 'Bitcoin transactions confirmed per day', group: 'crypto', unit: 'tx/day', fmt: 'int', region: 'americas', source: 'Blockchain.com Charts API', sourceUrl: 'https://www.blockchain.com/explorer/charts/n-transactions', note: 'Every confirmed on-chain Bitcoin transaction.', featured: true }),
  S({ id: 'crypto.eth.onchain_tx.daily', label: 'Ethereum transactions per day', group: 'crypto', unit: 'tx/day', fmt: 'int', region: 'americas', source: 'Blockscout (Ethereum)', sourceUrl: 'https://eth.blockscout.com/stats', note: 'Every on-chain Ethereum mainnet transaction.', featured: true }),
  S({ id: 'crypto.btc.mempool_tx', label: 'Bitcoin transactions waiting (mempool)', group: 'crypto', unit: 'tx', fmt: 'int', region: 'americas', source: 'mempool.space', sourceUrl: 'https://mempool.space/', note: 'Unconfirmed transactions queued for the next blocks.' }),
  S({ id: 'crypto.btc.tx_per_block', label: 'Transactions per Bitcoin block (last 6)', group: 'crypto', unit: 'tx/block', fmt: 'int', region: 'americas', source: 'mempool.space', sourceUrl: 'https://mempool.space/', note: 'Average over the six most recent blocks.' }),
  S({ id: 'crypto.btc.fee_fastest_sat_vb', label: 'Bitcoin next-block fee', group: 'crypto', unit: 'sat/vB', fmt: 'dec', region: 'americas', source: 'mempool.space', sourceUrl: 'https://mempool.space/', note: 'Recommended fee for next-block confirmation.' }),
  S({ id: 'crypto.usdt.supply_usd', label: 'Tether (USDT) supply', group: 'crypto', unit: 'USD', fmt: 'usd', region: 'americas', source: 'Tether transparency', sourceUrl: 'https://tether.to/en/transparency/', note: 'Total USDT issued across all chains — new minting shows up as a step.' }),

  // ── Life at home
  S({ id: 'lifestyle.netflix.top10_hours.weekly', label: 'Netflix: hours watched of its global Top 10s', group: 'lifestyle', unit: 'hours/week', fmt: 'int', region: 'americas', source: 'Netflix Top 10 (Tudum)', sourceUrl: 'https://www.netflix.com/tudum/top10', note: 'Total hours viewed of the 40 titles in Netflix\'s weekly global Top 10 lists (films and TV, English and non-English). Weeks run Monday–Sunday; published the following Tuesday.', featured: true }),
  S({ id: 'lifestyle.wiki.insomnia.daily', label: 'Readers of “Insomnia” on Wikipedia', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day. Up all night?', featured: true }),
  S({ id: 'lifestyle.wiki.sleep_deprivation.daily', label: 'Readers of “Sleep deprivation”', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day.' }),
  S({ id: 'lifestyle.wiki.back_pain.daily', label: 'Readers of “Low back pain”', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day. Long sessions, bad chairs.' }),
  S({ id: 'lifestyle.wiki.eye_strain.daily', label: 'Readers of “Computer vision syndrome” (eye strain)', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day.' }),
  S({ id: 'lifestyle.wiki.pizza.daily', label: 'Readers of “Pizza”', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day. The snack economy, measured the only free way we can.' }),
  S({ id: 'lifestyle.wiki.energy_drink.daily', label: 'Readers of “Energy drink”', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day.' }),
  S({ id: 'lifestyle.wiki.miami.daily', label: 'Readers of “Miami”', group: 'lifestyle', unit: 'readers/day', fmt: 'int', region: 'americas', source: 'Wikimedia Pageviews API', sourceUrl: 'https://pageviews.wmcloud.org/', note: 'English-Wikipedia readers per day. GTA VI is set in a Miami-inspired Vice City.' }),

  // ── Crime & disorder (settled days only)
  S({ id: 'safety.sf.police_incidents.daily', label: 'San Francisco police incident reports', group: 'safety', unit: 'reports/day', fmt: 'int', region: 'americas', source: 'DataSF — Police Department Incident Reports', sourceUrl: 'https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783', note: 'Incidents by the day they happened. Reports keep arriving for days, so each day appears only once it has settled (5 days later).', featured: true }),
  S({ id: 'safety.chicago.crimes.daily', label: 'Chicago reported crimes', group: 'safety', unit: 'crimes/day', fmt: 'int', region: 'americas', source: 'Chicago Data Portal — Crimes', sourceUrl: 'https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-Present/ijzp-q8t2', note: 'Crimes by the day they occurred. Chicago publishes with about a week of delay, so days appear 10 days later.', featured: true }),
  S({ id: 'safety.seattle.offenses.daily', label: 'Seattle reported offenses', group: 'safety', unit: 'offenses/day', fmt: 'int', region: 'americas', source: 'Seattle Open Data — SPD Crime Data', sourceUrl: 'https://data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5', note: 'Offenses by the day they occurred; each day appears once settled (5 days later).' }),
  S({ id: 'safety.nyc.noise_complaints.daily', label: 'New York 311 noise complaints', group: 'safety', unit: 'complaints/day', fmt: 'int', region: 'americas', source: 'NYC Open Data — 311 Service Requests', sourceUrl: 'https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9', note: 'Fewer parties — or louder living rooms? Each day appears once settled (3 days later).' }),

  // ── Under the radar
  S({ id: 'radar.ransomware_posts.daily', label: 'Ransomware leak-site victim posts per day', group: 'radar', unit: 'posts/day', fmt: 'int', region: 'americas', source: 'ransomware.live', sourceUrl: 'https://www.ransomware.live/', note: 'Organisations newly listed on ransomware groups\' leak sites, by discovery date. Counts only — no names are shown.', featured: true }),
  S({ id: 'radar.breaches_disclosed.daily', label: 'Data breaches added to Have I Been Pwned', group: 'radar', unit: 'breaches/day', fmt: 'int', region: 'americas', source: 'Have I Been Pwned', sourceUrl: 'https://haveibeenpwned.com/PwnedWebsites', note: 'Breaches loaded into HIBP each day (disclosure, not occurrence, date).' }),
  S({ id: 'radar.breached_accounts.daily', label: 'Breached accounts added to Have I Been Pwned', group: 'radar', unit: 'accounts/day', fmt: 'int', region: 'americas', source: 'Have I Been Pwned', sourceUrl: 'https://haveibeenpwned.com/PwnedWebsites', note: 'Accounts in the breaches loaded each day.' }),
  S({ id: 'radar.cves_published.daily', label: 'New security vulnerabilities (CVEs) published', group: 'radar', unit: 'CVEs/day', fmt: 'int', region: 'americas', source: 'NIST National Vulnerability Database', sourceUrl: 'https://nvd.nist.gov/', note: 'CVE records published per day.', featured: true }),
  S({ id: 'radar.cisa_kev_added.daily', label: 'Actively exploited vulnerabilities added by CISA', group: 'radar', unit: 'CVEs/day', fmt: 'int', region: 'americas', source: 'CISA KEV catalog', sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', note: 'Vulnerabilities CISA confirms are being exploited in the wild.' }),
  S({ id: 'radar.us.federal_register_docs.daily', label: 'US Federal Register documents published', group: 'radar', unit: 'docs/day', fmt: 'int', region: 'americas', source: 'FederalRegister.gov API', sourceUrl: 'https://www.federalregister.gov/', note: 'Rules, proposed rules, notices and presidential documents published each federal workday.' }),
  S({ id: 'radar.sec_8k.daily', label: 'US company 8-K filings (material events)', group: 'radar', unit: 'filings/day', fmt: 'int', region: 'americas', source: 'SEC EDGAR', sourceUrl: 'https://www.sec.gov/edgar/search/', note: 'Companies must file an 8-K within four business days of a material event.' }),
  S({ id: 'radar.sec_form4.daily', label: 'US insider-trading filings (Form 4)', group: 'radar', unit: 'filings/day', fmt: 'int', region: 'americas', source: 'SEC EDGAR', sourceUrl: 'https://www.sec.gov/edgar/search/', note: 'Executives and directors reporting trades in their own companies\' shares.' }),

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
  S({ id: 'control.earthquakes_m25.daily', label: 'Earthquakes of magnitude 2.5+ worldwide', group: 'control', unit: 'quakes/day', fmt: 'int', region: 'americas', source: 'USGS', sourceUrl: 'https://earthquake.usgs.gov/', note: 'The planet does not care about video games. If this "moves", that is just noise — a useful reminder.' }),
  S({ id: 'control.us.jobless_claims_nsa.weekly', label: 'US initial jobless claims (not seasonally adjusted)', group: 'control', unit: 'claims/week', fmt: 'int', region: 'americas', source: 'U.S. Department of Labor (ETA 539)', sourceUrl: 'https://oui.doleta.gov/unemploy/claims.asp', note: 'Weekly US jobless claims. A video game should not move this — if it does, look for another cause.' }),
]

// Third-party aggregators or community projects (documented, public, but not the original publisher).
const PUBLIC_SOURCES = new Set(['Open-Meteo', 'Blockchain.com Charts API', 'Blockscout (Ethereum)', 'mempool.space', 'adsb.lol', 'OpenSky Network', 'Have I Been Pwned', 'ransomware.live', 'Alternative.me'])
export const tierOf = (s: Signal): 'official' | 'public' | 'unofficial' => s.tier ?? (s.unofficial ? 'unofficial' : PUBLIC_SOURCES.has(s.source) ? 'public' : 'official')
export const TIER_LABEL = { official: 'official source', public: 'public dataset', unofficial: 'unofficial endpoint' } as const

export const SIGNAL_BY_ID = Object.fromEntries(SIGNALS.map((s) => [s.id, s])) as Record<string, Signal>

type GroupMeta = { key: Group; title: string; kicker: string; intro: string }
export const GROUPS: GroupMeta[] = ([
  { key: 'attention', title: 'The Cause', kicker: 'Attention', intro: 'Direct measures of how much of the world is looking at GTA VI right now.' },
  { key: 'games', title: 'Every Other Game', kicker: 'Gaming', intro: 'If everyone is in Leonida, who is left playing everything else? Concurrent players and viewers across PC, Roblox and streaming.' },
  { key: 'productivity', title: 'Work & the Internet', kicker: 'Productivity', intro: 'Code commits, package downloads, reading and posting — the rhythm of a working world.' },
  { key: 'energy', title: 'The Grid', kicker: 'Energy', intro: 'If offices go quiet and living rooms light up, the grid should show it. National electricity demand, every 5–60 minutes.' },
  { key: 'commute', title: 'Going to Work', kicker: 'Commuting', intro: 'Packed trains, parked cars, busy roads and full skies are what a normal working day looks like. Is it one?' },
  { key: 'mobility', title: 'The Streets', kicker: 'Mobility', intro: 'Fewer commutes would mean bikes left in their docks, faster roads and quieter pavements. Do we see it?' },
  { key: 'safety', title: 'Crime & Disorder', kicker: 'Public safety', intro: 'Is everyone too busy to cause trouble? Police reports and noise complaints from city open data. Reports trickle in for days, so a day is only shown once it has settled — post-launch days appear from around 21–28 November.' },
  { key: 'lifestyle', title: 'Life at Home', kicker: 'Sleep, snacks & screens', intro: 'Streaming hours, food-delivery apps, and what people suddenly want to read about — insomnia, back pain, pizza. Reading interest is a real measurement of curiosity, not of behaviour; treat it as a clue.' },
  { key: 'markets', title: 'Markets', kicker: 'Money', intro: 'The publisher, the platform makers, the competition for screen time, and the broader market.' },
  { key: 'crypto', title: 'Crypto & On-chain', kicker: 'Crypto', intro: 'Prices, but also raw activity on the blockchains themselves — transactions, queues and new stablecoin supply.' },
  { key: 'radar', title: 'While You Were Playing', kicker: 'Under the radar', intro: 'Some news is best released when nobody is watching. These are public records — breaches, ransomware claims, exploited vulnerabilities, government and company filings — counted per day against the four weeks before launch. Counts only; no names, no accusations.' },
  { key: 'study', title: 'School & Study', kicker: 'Education', intro: 'No one publishes live school attendance, so we watch what students leave behind: what they read, and the platform their coursework runs on.' },
  { key: 'status', title: 'Under Load', kicker: 'Infrastructure', intro: 'Console networks and the services gamers lean on.' },
  { key: 'control', title: 'Control Signals', kicker: 'Controls', intro: 'Things that should NOT move because of a video game. If these move too, be sceptical about everything above.' },
] as GroupMeta[]).map((g, i) => ({ ...g, kicker: `${String(i + 1).padStart(2, '0')} — ${g.kicker}` }))
