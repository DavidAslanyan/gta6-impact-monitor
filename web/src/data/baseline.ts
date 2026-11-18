import { BASELINE_DAYS, DAY, HOUR, REGION_LAUNCH, type Region } from '../config'
import type { Signal } from '../signals'
import type { Point } from './store'

export type BaselineMode = 'weekday-hour' | 'hour-of-day' | 'weekday' | 'overall' | 'since-launch'

export interface Expectation { mean: number; std: number; n: number; mode: BaselineMode }

export interface BaselineModel {
  launch: number
  daily: boolean
  /** Length of one data bucket in seconds (3600 for hourly, 86400 daily, 604800 weekly). */
  bucket: number
  /** How many hours of pre-launch data the Baseline has. */
  spanHours: number
  points: number
  expected(t: number): Expectation | null
}

// Robust statistics: the centre is the median and the spread is the scaled MAD, so a single glitch
// (e.g. a grid reading that drops to a quarter for one hour) cannot drag the Baseline around.
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const mad = (xs: number[], m = median(xs)) => 1.4826 * median(xs.map((x) => Math.abs(x - m)))

// Buckets are keyed by LOCAL weekday and hour in the Signal's home region, so the daylight-saving
// changes inside the four-week window (Europe 25 Oct, US 1 Nov) do not mix different local hours.
const REGION_TZ: Record<Region, string> = { oceania: 'Pacific/Auckland', europe: 'Europe/Paris', americas: 'America/New_York' }
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const fmtCache = new Map<string, Intl.DateTimeFormat>()
const keyCache = new Map<string, { wd: number; h: number }>()
function localParts(t: number, tz: string) {
  const ck = tz + (t - (t % HOUR))
  const hit = keyCache.get(ck)
  if (hit) return hit
  let f = fmtCache.get(tz)
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }); fmtCache.set(tz, f) }
  const parts = f.formatToParts(new Date(t * 1000))
  const r = { wd: WEEKDAYS[parts.find((p) => p.type === 'weekday')!.value], h: +parts.find((p) => p.type === 'hour')!.value % 24 }
  if (keyCache.size > 50000) keyCache.clear()
  keyCache.set(ck, r)
  return r
}

function step(points: Point[]) {
  if (points.length < 3) return HOUR
  const gaps = points.slice(1).map((p, i) => p[0] - points[i][0]).sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

/** A point is "before launch" only if its whole bucket ended before the launch (daily buckets straddle it). */
export const isPre = (model: BaselineModel, t: number) => (model.daily ? t + model.bucket <= model.launch : t < model.launch)

/** Local hour of day (0–23) in a Signal's home region. */
export const localHour = (t: number, region: Region) => localParts(t, REGION_TZ[region]).h

export function buildBaseline(signal: Signal, hourly: Point[]): BaselineModel | null {
  const launch = REGION_LAUNCH[signal.region]
  const gap = step(hourly)
  const daily = gap >= 20 * HOUR
  const bucket = gap >= 6 * DAY ? 7 * DAY : daily ? DAY : HOUR
  const weekly = bucket === 7 * DAY
  // Weekly series get a longer window so the Baseline has more than four points.
  const windowDays = weekly ? 10 * 7 : BASELINE_DAYS
  const pre = hourly.filter(([t]) => (daily ? t + bucket <= launch : t < launch) && t >= launch - windowDays * DAY)
  if (!pre.length) return null
  const spanHours = (launch - pre[0][0]) / HOUR
  const base = { launch, daily, bucket, spanHours, points: pre.length }

  // Prices: compare with the last value before launch ("since launch").
  if (signal.group === 'markets' && signal.fmt !== 'int') {
    const last = pre[pre.length - 1][1]
    const recent = pre.slice(-48).map((p) => p[1])
    const s = Math.max(mad(recent), Math.abs(last) * 0.002)
    return { ...base, expected: () => ({ mean: last, std: s, n: 1, mode: 'since-launch' }) }
  }

  const tz = REGION_TZ[signal.region]
  const values = pre.map((p) => p[1])
  const oMed = median(values)
  const oMad = mad(values, oMed)
  const overall: Expectation = { mean: oMed, std: Math.max(oMad, Math.abs(oMed) * 0.01), n: values.length, mode: 'overall' }

  const byKey = new Map<number, number[]>()
  const byHour = new Map<number, number[]>()
  for (const [t, v] of pre) {
    const { wd, h } = daily ? { wd: new Date(t * 1000).getUTCDay(), h: 0 } : localParts(t, tz)
    const k = daily ? wd : wd * 24 + h
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k)!.push(v)
    if (!daily) {
      if (!byHour.has(h)) byHour.set(h, [])
      byHour.get(h)!.push(v)
    }
  }
  const relSpread = oMad / (Math.abs(oMed) || 1)
  const fromBucket = (xs: number[], mode: BaselineMode): Expectation => {
    const m = median(xs)
    // A bucket with few samples has no reliable spread of its own; borrow the overall relative spread.
    const s = xs.length >= 4 ? mad(xs, m) : relSpread * Math.abs(m)
    return { mean: m, std: Math.max(s, Math.abs(m) * 0.01), n: xs.length, mode }
  }
  const cache = new Map<number, Expectation>()

  return {
    ...base,
    expected(t: number) {
      if (weekly) return overall
      const { wd, h } = daily ? { wd: new Date(t * 1000).getUTCDay(), h: 0 } : localParts(t, tz)
      const k = daily ? wd : wd * 24 + h
      const hit = cache.get(k)
      if (hit) return hit
      let e: Expectation
      const wk = byKey.get(k)
      if (wk && wk.length >= 2) e = fromBucket(wk, daily ? 'weekday' : 'weekday-hour')
      else if (!daily && byHour.get(h)?.length) e = fromBucket(byHour.get(h)!, 'hour-of-day')
      else e = overall
      cache.set(k, e)
      return e
    },
  }
}

export interface DeltaInfo { value: number; expected: Expectation; pct: number; z: number; abs: number }

export function deltaAt(model: BaselineModel | null, t: number, value: number): DeltaInfo | null {
  if (!model || isPre(model, t)) return null
  const e = model.expected(t)
  if (!e) return null
  const abs = value - e.mean
  const pct = e.mean !== 0 ? (abs / Math.abs(e.mean)) * 100 : 0
  const z = e.std > 0 ? abs / e.std : 0
  return { value, expected: e, pct, z, abs }
}

export const MODE_LABEL: Record<BaselineMode, string> = {
  'weekday-hour': 'median of the same weekday & local hour, 4 weeks before launch',
  'hour-of-day': 'median of the same local hour before launch',
  weekday: 'median of the same weekday, 4 weeks before launch',
  overall: 'pre-launch median',
  'since-launch': 'last value before launch',
}

export interface Anomaly { t: number; start: number; signal: Signal; pct: number; z: number; value: number }

/** Unusually large Deltas after launch: |z| ≥ 3 and |Δ| ≥ 5%. Consecutive hours collapse to one episode, stamped at its peak. */
export function findAnomalies(signal: Signal, hourly: Point[], model: BaselineModel | null): Anomaly[] {
  if (!model || ['rank', 'level', 'temp'].includes(signal.fmt) || signal.group === 'control') return []
  const out: Anomaly[] = []
  let run: Anomaly | null = null
  let lastT = 0
  for (const [t, v] of hourly) {
    if (isPre(model, t)) continue
    const d = deltaAt(model, t, v)
    if (!d || Math.abs(d.z) < 3 || Math.abs(d.pct) < 5) continue
    const a: Anomaly = { t, start: t, signal, pct: d.pct, z: d.z, value: v }
    if (run && t - lastT <= 3 * HOUR && Math.sign(run.pct) === Math.sign(a.pct)) {
      if (Math.abs(a.z) > Math.abs(run.z)) run = { ...a, start: run.start }
    } else {
      if (run) out.push(run)
      run = a
    }
    lastT = t
  }
  if (run) out.push(run)
  return out
}
