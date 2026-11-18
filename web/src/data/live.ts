// Browser-direct live feeds. Feeds connect only while the Live Pulse section is on screen AND the tab is
// visible (they stream ~100 KB/s together), and disconnect otherwise. Only counts and prices are kept —
// no third-party text is stored or shown (zero-spoiler rule).
import { useEffect, useState, useSyncExternalStore } from 'react'

const WINDOW = 120 // seconds of per-second history kept for sparklines

export type Bucket = number | null // null = not connected during that second

export interface RateState {
  status: 'idle' | 'connecting' | 'live' | 'reconnecting' | 'unavailable'
  /** Per-second counts, oldest first, length WINDOW, for each channel. */
  buckets: Record<string, Bucket[]>
  totals: Record<string, number>
  last: Record<string, number>
  connectedSeconds: number
}

interface FeedApi {
  hit(channel: string, n?: number): void
  set(channel: string, value: number): void
  opened(): void
  closed(): void
}

// ── Gate: is the live section on screen in a visible tab?
let onScreen = false
const gateListeners = new Set<() => void>()
const gateOpen = () => onScreen && typeof document !== 'undefined' && document.visibilityState === 'visible'
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => gateListeners.forEach((l) => l()))
export function setLiveOnScreen(v: boolean) {
  if (v === onScreen) return
  onScreen = v
  gateListeners.forEach((l) => l())
}

function createRateFeed(channels: string[], open: (api: FeedApi) => () => void) {
  const empty = (): Record<string, Bucket[]> => Object.fromEntries(channels.map((c) => [c, new Array<Bucket>(WINDOW).fill(null)]))
  let state: RateState = { status: 'idle', buckets: empty(), totals: Object.fromEntries(channels.map((c) => [c, 0])), last: {}, connectedSeconds: 0 }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  const counts: Record<string, number> = {}
  let connected = false
  let close: (() => void) | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let delay = 1000
  let failures = 0
  let lastSecond = Math.floor(Date.now() / 1000)
  let ticker: ReturnType<typeof setInterval> | null = null

  const api: FeedApi = {
    hit(ch, n = 1) { counts[ch] = (counts[ch] || 0) + n },
    set(ch, v) { state.last[ch] = v },
    opened() { connected = true; delay = 1000; failures = 0; state = { ...state, status: 'live' }; emit() },
    closed() {
      const wasOpen = connected
      connected = false
      close = null
      if (!gateOpen()) return
      if (!wasOpen) failures++
      state = { ...state, status: failures >= 4 ? 'unavailable' : 'reconnecting' }
      emit()
      retryTimer = setTimeout(connect, delay)
      delay = Math.min(delay * 2, 30000)
    },
  }

  function connect() {
    retryTimer = null
    if (!gateOpen() || close) return
    if (state.status === 'idle') { state = { ...state, status: 'connecting' }; emit() }
    try { close = open(api) } catch { api.closed() }
  }

  function tick() {
    // Bucket by wall-clock second; seconds skipped (throttled timers) are filled, not dumped into one bucket.
    const sec = Math.floor(Date.now() / 1000)
    const steps = Math.min(sec - lastSecond, WINDOW)
    if (steps <= 0) return
    lastSecond = sec
    const buckets: Record<string, Bucket[]> = {}
    const totals = { ...state.totals }
    for (const c of channels) {
      const add: Bucket[] = []
      for (let i = 0; i < steps; i++) add.push(connected ? (i === steps - 1 ? counts[c] || 0 : 0) : null)
      if (connected) totals[c] += counts[c] || 0
      counts[c] = 0
      buckets[c] = state.buckets[c].slice(steps).concat(add)
    }
    state = { ...state, buckets, totals, last: { ...state.last }, connectedSeconds: state.connectedSeconds + (connected ? steps : 0) }
    emit()
  }

  function onGate() {
    if (gateOpen()) {
      lastSecond = Math.floor(Date.now() / 1000)
      if (!ticker) ticker = setInterval(tick, 1000)
      connect()
    } else {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      if (ticker) { clearInterval(ticker); ticker = null }
      const c = close
      close = null
      connected = false
      c?.()
      // Start fresh next time: a gap in a per-second sparkline means nothing useful.
      state = { ...state, status: 'idle', buckets: empty(), connectedSeconds: 0 }
      for (const k of Object.keys(counts)) counts[k] = 0
      emit()
    }
  }
  gateListeners.add(onGate)

  return function useFeed(): RateState {
    useEffect(() => { onGate() }, [])
    return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
  }
}

/** Mean of the last n connected seconds (null when nothing was connected). */
export function recentRate(b: Bucket[], n: number): number | null {
  const xs = b.slice(-n).filter((x): x is number => x !== null)
  return xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null
}

const GTA_RE = /\bgta\s?(vi|6)\b|grand theft auto (vi|6)|#gta6|\bleonida\b/i // same pattern as the collector
const GTA_HINT = /gta|grand theft|leonida/i

/** Bluesky Jetstream: every new public post on Bluesky, worldwide. */
export const useBluesky = createRateFeed(['posts', 'gta'], (api) => {
  const hosts = ['jetstream2.us-east.bsky.network', 'jetstream1.us-west.bsky.network', 'jetstream2.us-west.bsky.network']
  const ws = new WebSocket(`wss://${hosts[Math.floor(Math.random() * hosts.length)]}/subscribe?wantedCollections=app.bsky.feed.post`)
  ws.onopen = api.opened
  ws.onmessage = (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : ''
    if (!raw.includes('"operation":"create"')) return
    api.hit('posts')
    if (!GTA_HINT.test(raw)) return
    try {
      // Match only the post text, exactly like the server-side collector does. The text is never kept.
      if (GTA_RE.test(JSON.parse(raw).commit?.record?.text || '')) api.hit('gta')
    } catch { /* ignore */ }
  }
  ws.onclose = api.closed
  return () => { ws.onclose = null; ws.close() }
})

/** Wikimedia EventStreams: every edit on every Wikipedia and sister project. */
export const useWikiEdits = createRateFeed(['edits', 'bots'], (api) => {
  const es = new EventSource('https://stream.wikimedia.org/v2/stream/recentchange')
  es.onopen = api.opened
  es.onmessage = (ev) => {
    const d = ev.data as string
    if (!d.includes('"type":"edit"') && !d.includes('"type":"new"')) return
    api.hit('edits')
    if (d.includes('"bot":true')) api.hit('bots')
  }
  es.onerror = () => { es.close(); api.closed() }
  return () => es.close()
})

/** Binance public trade stream for BTC/USDT. */
export const useBtcTrades = createRateFeed(['trades', 'volume'], (api) => {
  const ws = new WebSocket('wss://data-stream.binance.vision/stream?streams=btcusdt@trade')
  ws.onopen = api.opened
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(ev.data as string).data
      api.hit('trades')
      api.hit('volume', +m.p * +m.q)
      api.set('price', +m.p)
    } catch { /* ignore */ }
  }
  ws.onclose = api.closed
  return () => { ws.onclose = null; ws.close() }
})

/** Generic poller hook with shared state (pauses while the tab is hidden). */
function createPoller<T>(fn: () => Promise<T>, everyMs: number) {
  let state: { data: T | null; at: number; error: string | null } = { data: null, at: 0, error: null }
  const listeners = new Set<() => void>()
  let started = false
  const run = async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible' && state.data) return
    try { state = { data: await fn(), at: Date.now(), error: null } }
    catch (e) { state = { ...state, error: String((e as Error).message) } }
    listeners.forEach((l) => l())
  }
  return function usePoll() {
    useEffect(() => { if (!started) { started = true; run(); setInterval(run, everyMs) } }, [])
    return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
  }
}

// Kick category labels are written by us, never taken from the API (no third-party text on the page).
const KICK_LABELS: Record<string, string> = {
  'grand-theft-auto-vi': 'Grand Theft Auto VI',
  'grand-theft-auto-v': 'Grand Theft Auto V',
  'just-chatting': 'Just Chatting',
  irl: 'IRL',
  'counter-strike-2': 'Counter-Strike 2',
  'slots-casino': 'Slots & Casino',
  'league-of-legends': 'League of Legends',
  fortnite: 'Fortnite',
  valorant: 'Valorant',
  'call-of-duty-warzone': 'Call of Duty: Warzone',
  minecraft: 'Minecraft',
  'fall-guys': 'Fall Guys',
  'ea-sports-fc-27': 'EA Sports FC 27',
  rust: 'Rust',
  'dota-2': 'Dota 2',
  'apex-legends': 'Apex Legends',
  pubg: 'PUBG',
  'marvel-rivals': 'Marvel Rivals',
  'red-dead-redemption-ii': 'Red Dead Redemption 2',
  'call-of-duty-modern-warfare-4': 'Call of Duty: Modern Warfare 4',
  roblox: 'Roblox',
}

export interface KickCats { gta6: number; total: number; top: { label: string; viewers: number; gta: boolean }[] }
export const useKick = createPoller<KickCats>(async () => {
  const res = await fetch('https://kick.com/api/v1/categories/top')
  if (!res.ok) throw new Error(`Kick HTTP ${res.status}`)
  const cats = (await res.json()) as { slug: string; viewers: number; is_mature?: boolean }[]
  const total = cats.reduce((a, c) => a + (c.viewers || 0), 0)
  const gta6 = cats.filter((c) => c.slug === 'grand-theft-auto-vi').reduce((a, c) => a + c.viewers, 0)
  const named = cats.filter((c) => KICK_LABELS[c.slug] && !c.is_mature).slice(0, 7)
  const other = total - named.reduce((a, c) => a + c.viewers, 0)
  const top = named.map((c) => ({ label: KICK_LABELS[c.slug], viewers: c.viewers, gta: c.slug === 'grand-theft-auto-vi' }))
  top.push({ label: 'All other top categories', viewers: other, gta: false })
  return { gta6, total, top }
}, 20000)

export interface Quote { symbol: string; name: string; last: number; changePct: number; status: string }
const QUOTE_SYMBOLS = ['TTWO', 'SONY', 'MSFT', 'NVDA', 'AMD', 'GME', 'EA', 'NTDOY', 'RBLX', 'NFLX', 'DASH', '.SPX', '.IXIC', '.N225', '.FTSE', '.NZ50', '.VIX', '@CL.1', '@GC.1', 'NZD=']
const QUOTE_NAMES: Record<string, string> = { '.SPX': 'S&P 500', '.IXIC': 'NASDAQ', '.N225': 'NIKKEI', '.FTSE': 'FTSE 100', '.NZ50': 'NZX 50', '.VIX': 'VIX', '@CL.1': 'CRUDE', '@GC.1': 'GOLD', 'NZD=': 'NZD/USD' }
export const useQuotes = createPoller<Quote[]>(async () => {
  const url = `https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=${encodeURIComponent(QUOTE_SYMBOLS.join('|'))}&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json&events=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Quotes HTTP ${res.status}`)
  const j = await res.json()
  const list = j?.FormattedQuoteResult?.FormattedQuote ?? []
  return list.map((q: Record<string, string>) => {
    const ext = q.ExtendedMktQuote as unknown as Record<string, string> | undefined
    const useExt = ext && q.curmktstatus !== 'REG_MKT' && ext.last
    const last = parseFloat(String(useExt ? ext!.last : q.last).replace(/,/g, ''))
    const pct = parseFloat(String(useExt ? ext!.change_pct : q.change_pct).replace(/[%+,]/g, ''))
    // Symbols and names are tickers we list ourselves (QUOTE_NAMES) — no free text from the API is shown.
    return { symbol: q.symbol, name: QUOTE_NAMES[q.symbol] ?? q.symbol, last, changePct: pct, status: q.curmktstatus }
  }).filter((q: Quote) => Number.isFinite(q.last))
}, 20000)

/** A clock that re-renders every `ms` milliseconds. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
