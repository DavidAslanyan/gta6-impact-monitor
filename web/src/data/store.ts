import { useEffect, useSyncExternalStore } from 'react'
import { DATA_BASE } from '../config'

export type Point = [number, number]
interface Grid { s: number; d: number; v: (number | null)[] }
interface Bundle { generated: number; series: Record<string, Grid> }
export interface Health { ok: boolean; lastOk: number | null; failingSince: number | null; unofficial?: boolean; error?: string }

interface State {
  loaded: boolean
  error: string | null
  generated: number | null
  hourly: Record<string, Point[]>
  recent: Record<string, Point[]>
  latest: Record<string, Point>
  health: Record<string, Health>
  version: number
}

let state: State = { loaded: false, error: null, generated: null, hourly: {}, recent: {}, latest: {}, health: {}, version: 0 }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function expand(g: Grid): Point[] {
  const out: Point[] = []
  g.v.forEach((v, i) => { if (v !== null) out.push([g.s + i * g.d, v]) })
  return out
}

async function fetchJson<T>(path: string): Promise<T> {
  // Bust the CDN cache in 1-minute buckets so every visitor sees fresh data without hammering the origin.
  const bucket = Math.floor(Date.now() / 60000)
  const res = await fetch(`${DATA_BASE}/${path}?v=${bucket}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}

// The long hourly bundle changes slowly: fetch it every 10 minutes; the 5-minute bundle every 2.
let hourlyFetchedAt = 0
let hourlyGenerated: number | null = null
async function load() {
  try {
    const needHourly = hourlyGenerated === null || Date.now() - hourlyFetchedAt > 10 * 60 * 1000
    const [h, r, latest, health] = await Promise.all([
      needHourly ? fetchJson<Bundle>('bundle/hourly.json') : Promise.resolve(null),
      fetchJson<Bundle>('bundle/recent.json'),
      fetchJson<Record<string, Point>>('latest.json'),
      fetchJson<Record<string, Health>>('health.json'),
    ])
    let hourly = state.hourly
    if (h) {
      hourlyFetchedAt = Date.now()
      if (h.generated !== hourlyGenerated) {
        hourlyGenerated = h.generated
        hourly = {}
        for (const [id, g] of Object.entries(h.series)) hourly[id] = expand(g)
      }
    }
    // Nothing new since last time: skip the re-render.
    if (state.loaded && !state.error && r.generated === state.generated && hourly === state.hourly) return
    const recent: Record<string, Point[]> = {}
    for (const [id, g] of Object.entries(r.series)) recent[id] = expand(g)
    state = { loaded: true, error: null, generated: r.generated, hourly, recent, latest, health, version: state.version + 1 }
  } catch (e) {
    state = { ...state, loaded: true, error: String((e as Error).message) }
  }
  emit()
}

let started = false
export function startDataStore() {
  if (started) return
  started = true
  load()
  setInterval(load, 2 * 60 * 1000)
}

export function useData(): State {
  useEffect(startDataStore, [])
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => state,
  )
}

/** Merge hourly history with the 5-minute recent window (recent wins where it exists). */
export function seriesFor(s: State, id: string, resolution: 'auto' | 'hourly' = 'auto'): Point[] {
  const h = s.hourly[id] || []
  const r = resolution === 'auto' ? s.recent[id] : undefined
  if (!r?.length) return h
  const cut = r[0][0]
  return h.filter((p) => p[0] < cut).concat(r)
}
