import type { Fmt } from './signals'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function fmtValue(v: number | null | undefined, fmt: Fmt, opts: { compact?: boolean } = {}): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  switch (fmt) {
    case 'usd':
      return '$' + (Math.abs(v) >= 10000 ? int.format(v) : v.toFixed(2))
    case 'pct':
      return v.toFixed(1) + '%'
    case 'rank':
      return v > 200 ? 'not ranked' : '#' + int.format(v)
    case 'level':
      return ['Operational', 'Minor issue', 'Major outage', 'Critical'][Math.round(v)] ?? String(v)
    case 'temp':
      return v.toFixed(1) + '°C'
    case 'mw':
      return opts.compact ? compact.format(v) + ' MW' : int.format(v) + ' MW'
    case 'dec':
      return Math.abs(v) >= 1000 ? int.format(v) : v.toFixed(2)
    case 'int':
    default:
      return opts.compact && Math.abs(v) >= 10000 ? compact.format(v) : int.format(v)
  }
}

export const fmtCompact = (v: number) => compact.format(v)
export const fmtInt = (v: number) => int.format(v)

export function fmtPct(p: number, digits = 1): string {
  const s = Math.abs(p) < 0.05 ? '0.0' : p.toFixed(digits)
  return (p > 0 ? '+' : '') + s + '%'
}

export function fmtUsd(v: number): string {
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(3) + 'T'
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(3) + 'B'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M'
  return '$' + int.format(v)
}

export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.floor(Math.abs(sec)))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return (d ? `${d}d ` : '') + `${pad(h)}:${pad(m)}:${pad(ss)}`
}

export function fmtAgo(t: number, now = Date.now() / 1000): string {
  const s = Math.max(0, now - t)
  if (s < 90) return `${Math.round(s)}s ago`
  if (s < 5400) return `${Math.round(s / 60)} min ago`
  if (s < 172800) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} days ago`
}

export function fmtUtc(t: number, withDate = true): string {
  const d = new Date(t * 1000)
  const hm = d.toISOString().slice(11, 16)
  if (!withDate) return `${hm} UTC`
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} ${hm} UTC`
}
