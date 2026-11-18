// "The GTA Effect": testable hypotheses, each wired to measured Signals with the direction we would expect
// if the hypothesis were true. Verdicts are computed from the data, never written by hand.

export type Direction = 'up' | 'down' | 'flat'

export interface Test {
  id: string
  /** Expected direction of the Signal itself (for ranks, 'up' means a better = smaller rank). */
  expect: Direction
  /** Only use readings in these LOCAL hours of the Signal's home region, e.g. [0, 4] = midnight to 4 am. */
  hours?: [number, number]
}

export interface Hypothesis {
  key: string
  emoji: string
  claim: string
  why: string
  tests: Test[]
}

export interface Unmeasurable { claim: string; why: string }

export const PHASES = [
  { key: 'launch', label: 'Launch', sub: '19–22 Nov', from: Date.UTC(2026, 10, 18, 11) / 1000, to: Date.UTC(2026, 10, 23) / 1000 },
  { key: 'week1', label: 'Week 1', sub: '23–29 Nov', from: Date.UTC(2026, 10, 23) / 1000, to: Date.UTC(2026, 10, 30) / 1000 },
  { key: 'later', label: 'Later', sub: 'Dec onwards', from: Date.UTC(2026, 10, 30) / 1000, to: Date.UTC(2027, 5, 1) / 1000 },
] as const

export const HYPOTHESES: Hypothesis[] = [
  { key: 'other-games', emoji: '🎮', claim: 'Every other game loses players', why: 'Play time is finite.', tests: [
    { id: 'steam.top100.players', expect: 'down' }, { id: 'roblox.top.players', expect: 'down' }] },
  { key: 'gta5', emoji: '👋', claim: 'GTA V players move on', why: 'The predecessor should empty out first.', tests: [
    { id: 'steam.app.gta5.players', expect: 'down' }, { id: 'kick.gta5.viewers', expect: 'down' }] },
  { key: 'commits', emoji: '💻', claim: 'Developers ship less code', why: 'Days off and late nights.', tests: [
    { id: 'dev.github.commits.hourly', expect: 'down' }, { id: 'dev.github.prs.hourly', expect: 'down' }, { id: 'dev.npm.downloads.daily', expect: 'down' }] },
  { key: 'night-power', emoji: '🌙', claim: 'Night-time electricity rises (00:00–04:00)', why: 'Consoles and TVs running into the small hours.', tests: [
    { id: 'energy.gb.demand_mw', expect: 'up', hours: [0, 4] }, { id: 'energy.fr.demand_mw', expect: 'up', hours: [0, 4] },
    { id: 'energy.au.nsw.demand_mw', expect: 'up', hours: [0, 4] }, { id: 'energy.us.caiso.demand_mw', expect: 'up', hours: [0, 4] }] },
  { key: 'commute', emoji: '🚇', claim: 'Fewer people commute', why: 'Days off and remote work.', tests: [
    { id: 'commute.london.tube_crowding_pct', expect: 'down', hours: [7, 10] }, { id: 'commute.melbourne.parking_occupied_pct', expect: 'down', hours: [9, 17] },
    { id: 'traffic.madrid.vehicles_per_hour', expect: 'down', hours: [7, 10] }] },
  { key: 'roads', emoji: '🛣️', claim: 'Roads get emptier and faster', why: 'Fewer trips.', tests: [
    { id: 'traffic.nyc.speed_mph', expect: 'up' }, { id: 'traffic.hongkong.speed_kmh', expect: 'up' }] },
  { key: 'bikes', emoji: '🚲', claim: 'Bike-share bikes stay docked', why: 'Fewer rides leave more bikes idle.', tests: [
    { id: 'bike.nyc.available', expect: 'up' }, { id: 'bike.london.available', expect: 'up' }, { id: 'bike.paris.available', expect: 'up' }] },
  { key: 'flights', emoji: '✈️', claim: 'Fewer people fly', why: 'Business travel postponed.', tests: [
    { id: 'air.global.aircraft_airborne', expect: 'down' }] },
  { key: 'reading', emoji: '📖', claim: 'The world reads and edits less Wikipedia', why: 'Attention is elsewhere.', tests: [
    { id: 'internet.wiki.views.hourly', expect: 'down' }, { id: 'live.wiki.human_edits_per_sec', expect: 'down' }] },
  { key: 'homework', emoji: '📚', claim: 'Students study less', why: 'Homework vs. Vice City.', tests: [
    { id: 'study.homework_index.daily', expect: 'down' }] },
  { key: 'netflix', emoji: '📺', claim: 'Netflix viewing drops', why: 'Same screen, different use.', tests: [
    { id: 'lifestyle.netflix.top10_hours.weekly', expect: 'down' }] },
  { key: 'delivery', emoji: '🍕', claim: 'Food delivery gets popular', why: 'Nobody wants to leave the couch.', tests: [
    { id: 'appstore.us.doordash.rank', expect: 'up' }, { id: 'appstore.us.ubereats.rank', expect: 'up' }, { id: 'lifestyle.wiki.pizza.daily', expect: 'up' }] },
  { key: 'sleep', emoji: '😵', claim: 'People lose sleep', why: 'Reading about insomnia is the closest public proxy.', tests: [
    { id: 'lifestyle.wiki.insomnia.daily', expect: 'up' }, { id: 'lifestyle.wiki.sleep_deprivation.daily', expect: 'up' }, { id: 'lifestyle.wiki.energy_drink.daily', expect: 'up' }] },
  { key: 'body', emoji: '🪑', claim: 'Back pain and eye strain spike', why: 'Marathon sessions.', tests: [
    { id: 'lifestyle.wiki.back_pain.daily', expect: 'up' }, { id: 'lifestyle.wiki.eye_strain.daily', expect: 'up' }] },
  { key: 'miami', emoji: '🌴', claim: 'Everyone gets curious about Miami', why: 'Vice City is Miami-inspired.', tests: [
    { id: 'lifestyle.wiki.miami.daily', expect: 'up' }] },
  { key: 'crime', emoji: '🚔', claim: 'Crime goes down', why: 'Too busy to cause trouble?', tests: [
    { id: 'safety.sf.police_incidents.daily', expect: 'down' }, { id: 'safety.chicago.crimes.daily', expect: 'down' }, { id: 'safety.seattle.offenses.daily', expect: 'down' }] },
  { key: 'noise', emoji: '🔇', claim: 'Cities get quieter', why: 'Fewer parties — unless the TVs are loud.', tests: [
    { id: 'safety.nyc.noise_complaints.daily', expect: 'down' }] },
  { key: 'crypto', emoji: '₿', claim: 'Crypto traders take a break', why: 'Retail attention moves.', tests: [
    { id: 'crypto.btc.trades_per_hour', expect: 'down' }] },
  { key: 'buried', emoji: '🕵️', claim: 'Bad news gets released while nobody watches', why: 'An old PR trick — now with a global distraction.', tests: [
    { id: 'radar.breaches_disclosed.daily', expect: 'up' }, { id: 'radar.ransomware_posts.daily', expect: 'up' }] },
  { key: 'earthquakes', emoji: '🌍', claim: 'Earthquakes do not care about GTA (control)', why: 'If this "changes", it is noise — calibrate everything else against it.', tests: [
    { id: 'control.earthquakes_m25.daily', expect: 'flat' }] },
  { key: 'jobs', emoji: '🧾', claim: 'Nobody loses their job over GTA (control)', why: 'Weekly jobless claims should not move.', tests: [
    { id: 'control.us.jobless_claims_nsa.weekly', expect: 'flat' }] },
]

export const UNMEASURABLE: Unmeasurable[] = [
  { claim: 'Sick days spike', why: 'No country publishes daily sick-leave data. Surveys exist; live data does not.' },
  { claim: 'Gyms empty out', why: 'Gym chains do not publish attendance.' },
  { claim: 'Sleep duration drops', why: 'Wearable data is private; we use reading about insomnia as a proxy.' },
  { claim: 'Cinemas and restaurants lose customers', why: 'Box office and reservation data are paywalled or weekly-with-lag.' },
  { claim: 'Snack and energy-drink sales jump', why: 'Retail scanner data is commercial.' },
]
