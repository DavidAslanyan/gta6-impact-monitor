import { BASELINE_DAYS, DAY, HOUR, REGION_LAUNCH } from '../config'
import type { Signal } from '../signals'
import type { Point } from './store'

export type BaselineMode = 'weekday-hour' | 'hour-of-day' | 'weekday' | 'overall' | 'since-launch'

export interface Expectation { mean: number; std: number; n: number; mode: BaselineMode }

export interface BaselineModel {
  launch: number
  /** How many hours of pre-launch data the Baseline has. */
  spanHours: number
  points: number
  expected(t: number): Expectation | null
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const std = (xs: number[], m = mean(xs)) => (xs.length < 2 ? 0 : Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)))

const MARKET_GROUPS = new Set(['markets'])

function step(points: Point[]) {
  if (points.length < 3) return HOUR
  const gaps = points.slice(1).map((p, i) => p[0] - points[i][0]).sort((a, b) => a - b)
  return gaps[Math.floor(gaps.length / 2)]
}

export function buildBaseline(signal: Signal, hourly: Point[]): BaselineModel | null {
  const launch = REGION_LAUNCH[signal.region]
  const pre = hourly.filter(([t]) => t < launch && t >= launch - BASELINE_DAYS * DAY)
  if (!pre.length) return null
  const spanHours = (launch - pre[0][0]) / HOUR

  // Prices: compare with the last value before launch ("since launch").
  if (MARKET_GROUPS.has(signal.group) && signal.fmt !== 'int') {
    const last = pre[pre.length - 1][1]
    const s = std(pre.slice(-48).map((p) => p[1]))
    return { launch, spanHours, points: pre.length, expected: () => ({ mean: last, std: s, n: 1, mode: 'since-launch' }) }
  }

  const values = pre.map((p) => p[1])
  const overall: Expectation = { mean: mean(values), std: std(values), n: values.length, mode: 'overall' }
  const daily = step(pre) >= 20 * HOUR

  const byKey = new Map<number, number[]>()
  const byHour = new Map<number, number[]>()
  for (const [t, v] of pre) {
    const d = new Date(t * 1000)
    const k = daily ? d.getUTCDay() : d.getUTCDay() * 24 + d.getUTCHours()
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k)!.push(v)
    if (!daily) {
      const h = d.getUTCHours()
      if (!byHour.has(h)) byHour.set(h, [])
      byHour.get(h)!.push(v)
    }
  }
  const cache = new Map<number, Expectation>()
  const fromBucket = (xs: number[], mode: BaselineMode): Expectation => {
    const m = mean(xs)
    // A bucket with one sample has no spread of its own; borrow the overall relative spread.
    const s = xs.length >= 3 ? std(xs, m) : (overall.std / (overall.mean || 1)) * m
    return { mean: m, std: Math.max(s, Math.abs(m) * 0.01), n: xs.length, mode }
  }

  return {
    launch,
    spanHours,
    points: pre.length,
    expected(t: number) {
      const d = new Date(t * 1000)
      const k = daily ? d.getUTCDay() : d.getUTCDay() * 24 + d.getUTCHours()
      const ck = k
      if (cache.has(ck)) return cache.get(ck)!
      let e: Expectation
      const wk = byKey.get(k)
      if (wk && wk.length >= 2) e = fromBucket(wk, daily ? 'weekday' : 'weekday-hour')
      else if (!daily && byHour.get(d.getUTCHours())?.length) e = fromBucket(byHour.get(d.getUTCHours())!, 'hour-of-day')
      else e = { ...overall, std: Math.max(overall.std, Math.abs(overall.mean) * 0.01) }
      cache.set(ck, e)
      return e
    },
  }
}

export interface DeltaInfo { value: number; expected: Expectation; pct: number; z: number; abs: number }

export function deltaAt(model: BaselineModel | null, t: number, value: number): DeltaInfo | null {
  if (!model || t < model.launch) return null
  const e = model.expected(t)
  if (!e) return null
  const abs = value - e.mean
  const pct = e.mean !== 0 ? (abs / Math.abs(e.mean)) * 100 : 0
  const z = e.std > 0 ? abs / e.std : 0
  return { value, expected: e, pct, z, abs }
}

export const MODE_LABEL: Record<BaselineMode, string> = {
  'weekday-hour': 'same weekday & hour, 4 weeks before launch',
  'hour-of-day': 'same hour of day before launch',
  weekday: 'same weekday, 4 weeks before launch',
  overall: 'pre-launch average',
  'since-launch': 'last value before launch',
}

export interface Anomaly { t: number; signal: Signal; pct: number; z: number; value: number }

/** Unusually large Deltas after launch: |z| ≥ 3 and |Δ| ≥ 5%. Consecutive hours collapse to their peak. */
export function findAnomalies(signal: Signal, hourly: Point[], model: BaselineModel | null): Anomaly[] {
  if (!model || signal.fmt === 'rank' || signal.fmt === 'level' || signal.group === 'control') return []
  const out: Anomaly[] = []
  let run: Anomaly | null = null
  let lastT = 0
  for (const [t, v] of hourly) {
    if (t < model.launch) continue
    const d = deltaAt(model, t, v)
    const hit = d && Math.abs(d.z) >= 3 && Math.abs(d.pct) >= 5
    if (hit) {
      const a = { t, signal, pct: d.pct, z: d.z, value: v }
      if (run && t - lastT <= 3 * HOUR && Math.sign(run.pct) === Math.sign(a.pct)) {
        if (Math.abs(a.z) > Math.abs(run.z)) run = { ...a, t: run.t }
      } else {
        if (run) out.push(run)
        run = a
      }
      lastT = t
    }
  }
  if (run) out.push(run)
  return out
}
