// Snapshot sources: each returns { signalId: number } for the current instant.
// Only sources WITHOUT downloadable history live here; backfillable ones are fetched by backfill jobs.
import { getJson, getText, sampleSse, sampleWs } from './lib.mjs';

const STEAM_APPS = {
  730: 'cs2',
  570: 'dota2',
  578080: 'pubg',
  271590: 'gta5',
  1174180: 'rdr2',
  1172470: 'apex',
  252490: 'rust',
  1086940: 'bg3',
  2767030: 'marvel-rivals',
  440: 'tf2',
};

const sum = (arr, f) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);

const statusIndicator = { none: 0, minor: 1, major: 2, critical: 3, maintenance: 1 };

export const SOURCES = [
  {
    key: 'steam-charts',
    async run() {
      const j = await getJson('https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/');
      const ranks = j.response.ranks;
      return {
        'steam.top100.players': sum(ranks, (r) => r.concurrent_in_game),
        'steam.top10.players': sum(ranks.slice(0, 10), (r) => r.concurrent_in_game),
      };
    },
  },
  {
    key: 'steam-apps',
    async run() {
      const out = {};
      for (const [appid, slug] of Object.entries(STEAM_APPS)) {
        try {
          const j = await getJson(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`);
          if (j.response?.result === 1) out[`steam.app.${slug}.players`] = j.response.player_count;
        } catch {}
      }
      if (!Object.keys(out).length) throw new Error('no Steam app counts');
      return out;
    },
  },
  {
    key: 'roblox',
    unofficial: true,
    async run() {
      const j = await getJson('https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId=gta6monitor&sortId=top-playing-now&device=computer&country=all');
      const games = j.games || [];
      return {
        'roblox.top.players': sum(games, (g) => g.playerCount),
        'roblox.top10.players': sum(games.slice(0, 10), (g) => g.playerCount),
      };
    },
  },
  {
    key: 'kick',
    unofficial: true,
    async run() {
      const cats = await getJson('https://kick.com/api/v1/categories/top');
      const by = (re) => cats.filter((c) => re.test(c.name)).reduce((a, c) => a + (c.viewers || 0), 0);
      const total = sum(cats, (c) => c.viewers);
      const gta6 = by(/Grand Theft Auto VI|GTA VI|GTA 6/i);
      return {
        'kick.top.viewers': total,
        'kick.gta6.viewers': gta6,
        'kick.gta5.viewers': by(/Grand Theft Auto V\b(?!I)/i),
        'kick.justchatting.viewers': by(/Just Chatting/i),
        'kick.cs2.viewers': by(/Counter-Strike/i),
        'kick.gta6.share': total ? +((gta6 / total) * 100).toFixed(3) : 0,
      };
    },
  },
  {
    key: 'bike-citibike',
    async run() {
      const j = await getJson('https://gbfs.citibikenyc.com/gbfs/en/station_status.json');
      const st = j.data.stations.filter((s) => s.is_installed && s.is_renting);
      return { 'bike.nyc.available': sum(st, (s) => s.num_bikes_available), 'bike.nyc.docks': sum(st, (s) => s.num_docks_available) };
    },
  },
  {
    key: 'bike-toronto',
    async run() {
      const j = await getJson('https://tor.publicbikesystem.net/ube/gbfs/v1/en/station_status');
      const st = j.data.stations.filter((s) => s.is_installed && s.is_renting);
      return { 'bike.toronto.available': sum(st, (s) => s.num_bikes_available) };
    },
  },
  {
    key: 'bike-velib',
    async run() {
      const j = await getJson(
        'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/records?select=sum(numbikesavailable)%20as%20bikes,sum(numdocksavailable)%20as%20docks&limit=1',
      );
      return { 'bike.paris.available': j.results[0].bikes, 'bike.paris.docks': j.results[0].docks };
    },
  },
  {
    key: 'bike-london',
    async run() {
      const j = await getJson('https://api.tfl.gov.uk/BikePoint');
      let bikes = 0;
      for (const p of j) {
        const nb = p.additionalProperties?.find((a) => a.key === 'NbBikes');
        bikes += Number(nb?.value) || 0;
      }
      return { 'bike.london.available': bikes };
    },
  },
  {
    key: 'nyc-traffic',
    async run() {
      const rows = await getJson('https://data.cityofnewyork.us/resource/i4gi-tjb9.json?$select=speed,data_as_of&$order=data_as_of%20DESC&$limit=400');
      const speeds = rows.map((r) => Number(r.speed)).filter((x) => x > 0 && x < 100);
      if (!speeds.length) throw new Error('no speeds');
      return { 'traffic.nyc.speed_mph': +(speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2) };
    },
  },
  {
    key: 'melbourne-footfall',
    async run() {
      const j = await getJson(
        'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/pedestrian-counting-system-past-hour-counts-per-minute/records?select=sensing_datetime,sum(total_of_directions)%20as%20n&group_by=sensing_datetime&order_by=sensing_datetime%20desc&limit=6',
      );
      // Skip the newest minute (may be partial); sum the next 5 complete minutes.
      const rows = j.results.slice(1, 6);
      return { 'footfall.melbourne.per_min': +(sum(rows, (r) => r.n) / Math.max(rows.length, 1)).toFixed(1) };
    },
  },
  {
    key: 'psn-status',
    unofficial: true,
    async run() {
      let issues = 0;
      for (const region of ['SCEA', 'SCEE']) {
        const j = await getJson(`https://status.playstation.com/data/statuses/region/${region}.json`);
        issues += (j.status || []).length;
        for (const c of j.countries || []) {
          issues += (c.status || []).length;
          for (const s of c.services || []) issues += (s.status || []).length;
        }
      }
      return { 'status.psn.issues': issues };
    },
  },
  {
    key: 'statuspages',
    async run() {
      const pages = {
        discord: 'https://discordstatus.com/api/v2/status.json',
        twitch: 'https://status.twitch.com/api/v2/status.json',
        epic: 'https://status.epicgames.com/api/v2/status.json',
        xbox: 'https://xboxlive.statuspage.io/api/v2/status.json',
        github: 'https://www.githubstatus.com/api/v2/status.json',
        cloudflare: 'https://www.cloudflarestatus.com/api/v2/status.json',
      };
      const out = {};
      for (const [k, u] of Object.entries(pages)) {
        try {
          const j = await getJson(u);
          out[`status.${k}.level`] = statusIndicator[j.status?.indicator] ?? 0;
        } catch {}
      }
      return out;
    },
  },
  {
    key: 'app-store',
    async run() {
      const j = await getJson('https://itunes.apple.com/us/rss/topfreeapplications/limit=200/json');
      const names = (j.feed.entry || []).map((e) => e['im:name'].label);
      const rank = (re) => {
        const i = names.findIndex((n) => re.test(n));
        return i < 0 ? 201 : i + 1;
      };
      return {
        'appstore.us.playstation.rank': rank(/^PlayStation App/i),
        'appstore.us.xbox.rank': rank(/^Xbox$/i),
        'appstore.us.twitch.rank': rank(/^Twitch/i),
        'appstore.us.discord.rank': rank(/^Discord/i),
        'appstore.us.doordash.rank': rank(/^DoorDash/i),
        'appstore.us.ubereats.rank': rank(/^Uber Eats/i),
      };
    },
  },
  {
    key: 'bluesky-firehose',
    async run() {
      const ms = 20000;
      let posts = 0, gta = 0;
      const re = /\bgta\s?(vi|6)\b|grand theft auto (vi|6)|#gta6|\bleonida\b/i; // same pattern as the browser feed
      await sampleWs('wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post', ms, (raw) => {
        try {
          const m = JSON.parse(raw);
          if (m.kind === 'commit' && m.commit?.operation === 'create') {
            posts++;
            if (re.test(m.commit.record?.text || '')) gta++;
          }
        } catch {}
      });
      return {
        'live.bluesky.posts_per_sec': +(posts / (ms / 1000)).toFixed(2),
        'live.bluesky.gta_per_min': +((gta / (ms / 1000)) * 60).toFixed(2),
      };
    },
  },
  {
    key: 'wikimedia-stream',
    async run() {
      const ms = 20000;
      let edits = 0, human = 0;
      await sampleSse('https://stream.wikimedia.org/v2/stream/recentchange', ms, (data) => {
        try {
          const m = JSON.parse(data);
          if (m.type === 'edit' || m.type === 'new') {
            edits++;
            if (!m.bot) human++;
          }
        } catch {}
      });
      return {
        'live.wiki.edits_per_sec': +(edits / (ms / 1000)).toFixed(2),
        'live.wiki.human_edits_per_sec': +(human / (ms / 1000)).toFixed(2),
      };
    },
  },
];

export { getText };
