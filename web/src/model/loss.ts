// Estimated Loss: a transparent model, not a measurement.
// loss = Σ over economies of absent workers × loss per worker-hour × working hours elapsed since local unlock,
// with a decay for the days after launch day ("afterglow").

export interface Economy {
  key: string
  name: string
  /** Standard UTC offset in hours during late November. */
  tz: number
  absent: number
  lossPerHour: number
  basis: string
}

export const MONTALVO_URL = 'https://local12.com/news/nation-world/grand-theft-auto-6-release-could-cost-united-states-economy-one-billion-dollars-productivity-loss-cincinnati-1-5-million-americans-plan-work-absences-analyst-jose-garcia-montalvo-estimates-technology-sector-faces-largest-single-day-short-term-hit'

// US figures come from the only published estimate (José García Montalvo: ~1.5M US absences, ~$1B per launch day,
// i.e. ≈ $83 per absent worker-hour over an 8-hour day). Every other economy is OUR scaling assumption: absences scaled
// by its share of current-generation console owners relative to the US, and loss per hour by average labour cost.
export const ECONOMIES: Economy[] = [
  { key: 'nz', name: 'New Zealand', tz: 13, absent: 30_000, lossPerHour: 42, basis: 'scaled from US by console base; NZ labour cost' },
  { key: 'au', name: 'Australia', tz: 11, absent: 180_000, lossPerHour: 48, basis: 'scaled from US by console base; AU labour cost' },
  { key: 'jp', name: 'Japan', tz: 9, absent: 220_000, lossPerHour: 32, basis: 'scaled from US by console base; JP labour cost' },
  { key: 'kr', name: 'South Korea', tz: 9, absent: 60_000, lossPerHour: 30, basis: 'scaled from US by console base' },
  { key: 'in', name: 'India & Gulf', tz: 4.5, absent: 120_000, lossPerHour: 9, basis: 'scaled from US by console base' },
  { key: 'eu', name: 'Euro area & rest of Europe', tz: 1, absent: 1_100_000, lossPerHour: 44, basis: 'scaled from US by console base; EU labour cost' },
  { key: 'uk', name: 'United Kingdom', tz: 0, absent: 330_000, lossPerHour: 46, basis: 'scaled from US by console base; UK labour cost' },
  { key: 'br', name: 'Brazil & South America', tz: -3, absent: 260_000, lossPerHour: 11, basis: 'scaled from US by console base' },
  { key: 'us', name: 'United States', tz: -5, absent: 1_500_000, lossPerHour: 83, basis: 'Montalvo estimate: 1.5M absences, ≈$1B per launch day' },
  { key: 'ca', name: 'Canada', tz: -5, absent: 140_000, lossPerHour: 50, basis: 'scaled from US by console base' },
  { key: 'mx', name: 'Mexico & Central America', tz: -6, absent: 150_000, lossPerHour: 10, basis: 'scaled from US by console base' },
]

export interface LossParams {
  /** Multiplier on every economy's absences. */
  scale: number
  /** Share of launch-day absences that repeat on the next working day. */
  dayTwo: number
  /** Share that keeps recurring on each further working day of the first two weeks. */
  afterglow: number
  workStart: number
  workEnd: number
}

export const DEFAULT_PARAMS: LossParams = { scale: 1, dayTwo: 0.6, afterglow: 0.12, workStart: 9, workEnd: 17 }

const DAY = 86400
/** Local midnight that starts 19 Nov 2026 in an economy (= its unlock moment), in UTC seconds. */
export const localUnlock = (tz: number) => Date.UTC(2026, 10, 19, 0, 0) / 1000 - tz * 3600

export function economyLoss(e: Economy, p: LossParams, now: number): { total: number; ratePerSec: number } {
  const unlock = localUnlock(e.tz)
  if (now <= unlock) return { total: 0, ratePerSec: 0 }
  const perSecFull = (e.absent * p.scale * e.lossPerHour) / 3600
  let total = 0
  let rate = 0
  let workday = 0
  for (let d = 0; d < 30; d++) {
    const dayStart = unlock + d * DAY
    if (dayStart > now) break
    const weekday = new Date((dayStart + e.tz * 3600 + 12 * 3600) * 1000).getUTCDay() // local weekday
    if (weekday === 0 || weekday === 6) continue
    const factor = workday === 0 ? 1 : workday === 1 ? p.dayTwo : workday < 10 ? p.afterglow : 0
    workday++
    if (!factor) continue
    const a = dayStart + p.workStart * 3600
    const b = dayStart + p.workEnd * 3600
    const overlap = Math.max(0, Math.min(now, b) - a)
    total += overlap * perSecFull * factor
    if (now >= a && now < b) rate += perSecFull * factor
  }
  return { total, ratePerSec: rate }
}

export function totalLoss(p: LossParams, now: number) {
  let total = 0, rate = 0
  const parts = ECONOMIES.map((e) => {
    const r = economyLoss(e, p, now)
    total += r.total
    rate += r.ratePerSec
    return { economy: e, ...r }
  })
  return { total, rate, parts }
}
