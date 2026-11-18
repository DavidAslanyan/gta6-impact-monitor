// Browser-direct live feeds. Each feed is started once (on first use) and shared by every component.
// Only counts and prices are kept — no third-party text is stored or shown (zero-spoiler rule).
import { useEffect, useState, useSyncExternalStore } from 'react'

const WINDOW = 120 // seconds of per-second history kept for sparklines

export interface RateState {
  status: 'connecting' | 'live' | 'reconnecting' | 'unavailable'
  /** Per-second counts, oldest first, length WINDOW, for each channel. */
  buckets: Record<string, number[]>
  totals: Record<string, number>
  since: number
  last: Record<string, number>
}

function createRateFeed(channels: string[], connect: (api: FeedApi) => () => void) {
  const zero = () => Object.fromEntries(channels.map((c) => [c, new Array(WINDOW).fill(0)]))
  let state: RateState = { status: 'connecting', buckets: zero(), totals: Object.fromEntries(channels.map((c) => [c, 0])), since: Date.now(), last: {} }
  const listeners = new Set<() => void>()
  const counts: Record<string, number> = Object.fromEntries(channels.map((c) => [c, 0]))
  let started = false

  const api: FeedApi = {
    hit(ch, n = 1) { counts[ch] = (counts[ch] || 0) + n },
    set(ch, v) { state.last[ch] = v },
    status(s) { if (state.status !== s) { state = { ...state, status: s }; listeners.forEach((l) => l()) } },
  }

  function start() {
    if (started) return
    started = true
    connect(api)
    setInterval(() => {
      const buckets: Record<string, number[]> = {}
      const totals = { ...state.totals }
      for (const c of channels) {
        buckets[c] = state.buckets[c].slice(1).concat(counts[c] || 0)
        totals[c] += counts[c] || 0
        counts[c] = 0
      }
      state = { ...state, buckets, totals, last: { ...state.last } }
      listeners.forEach((l) => l())
    }, 1000)
  }

  return function useFeed(): RateState {
    useEffect(start, [])
    return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
  }
}

interface FeedApi {
  hit(channel: string, n?: number): void
  set(channel: string, value: number): void
  status(s: RateState['status']): void
}

function reconnecting(open: (api: FeedApi, onClose: () => void) => void) {
  return (api: FeedApi) => {
    let delay = 1000
    const go = () => open(api, () => {
      api.status('reconnecting')
      setTimeout(go, delay)
      delay = Math.min(delay * 2, 30000)
    })
    go()
    return () => {}
  }
}

const GTA_RE = /\bgta\s?(vi|6)\b|grand theft auto (vi|6)|#gta6|\bleonida\b/i

/** Bluesky Jetstream: every new public post on Bluesky, worldwide. */
export const useBluesky = createRateFeed(['posts', 'gta'], reconnecting((api, onClose) => {
  const hosts = ['jetstream2.us-east.bsky.network', 'jetstream1.us-west.bsky.network', 'jetstream2.us-west.bsky.network']
  const host = hosts[Math.floor(Math.random() * hosts.length)]
  const ws = new WebSocket(`wss://${host}/subscribe?wantedCollections=app.bsky.feed.post`)
  ws.onopen = () => api.status('live')
  ws.onmessage = (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : ''
    if (!raw.includes('"operation":"create"')) return
    api.hit('posts')
    if (GTA_RE.test(raw)) api.hit('gta')
  }
  ws.onclose = onClose
}))

/** Wikimedia EventStreams: every edit on every Wikipedia and sister project. */
export const useWikiEdits = createRateFeed(['edits', 'bots'], reconnecting((api, onClose) => {
  const es = new EventSource('https://stream.wikimedia.org/v2/stream/recentchange')
  es.onopen = () => api.status('live')
  es.onmessage = (ev) => {
    const d = ev.data as string
    if (!d.includes('"type":"edit"') && !d.includes('"type":"new"')) return
    api.hit('edits')
    if (d.includes('"bot":true')) api.hit('bots')
  }
  es.onerror = () => { es.close(); onClose() }
}))

/** Binance public trade stream for BTC/USDT. */
export const useBtcTrades = createRateFeed(['trades', 'volume'], reconnecting((api, onClose) => {
  const ws = new WebSocket('wss://data-stream.binance.vision/stream?streams=btcusdt@trade')
  ws.onopen = () => api.status('live')
  ws.onmessage = (ev) => {
    try {
      const m = JSON.parse(ev.data as string).data
      api.hit('trades')
      api.hit('volume', +m.p * +m.q)
      api.set('price', +m.p)
    } catch { /* ignore */ }
  }
  ws.onclose = onClose
}))

/** Generic poller hook with shared state. */
function createPoller<T>(fn: () => Promise<T>, everyMs: number) {
  let state: { data: T | null; at: number; error: string | null } = { data: null, at: 0, error: null }
  const listeners = new Set<() => void>()
  let started = false
  const run = async () => {
    try { state = { data: await fn(), at: Date.now(), error: null } }
    catch (e) { state = { ...state, error: String((e as Error).message) } }
    listeners.forEach((l) => l())
  }
  return function usePoll() {
    useEffect(() => { if (!started) { started = true; run(); setInterval(run, everyMs) } }, [])
    return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
  }
}

export interface KickCats { gta6: number; total: number; top: { name: string; viewers: number }[] }
export const useKick = createPoller<KickCats>(async () => {
  const res = await fetch('https://kick.com/api/v1/categories/top')
  if (!res.ok) throw new Error(`Kick HTTP ${res.status}`)
  const cats = (await res.json()) as { name: string; viewers: number }[]
  const total = cats.reduce((a, c) => a + (c.viewers || 0), 0)
  const gta6 = cats.filter((c) => /Grand Theft Auto VI|GTA VI/i.test(c.name)).reduce((a, c) => a + c.viewers, 0)
  // Category names are game titles, not user text, so they are safe to show.
  const top = cats.slice(0, 8).map((c) => ({ name: c.name.replace(/\s*\(GTA\)\s*$/, ''), viewers: c.viewers }))
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
