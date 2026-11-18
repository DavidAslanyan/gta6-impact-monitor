// Launch Moments (UTC, seconds). GTA VI unlocks at midnight local time, region by region.
export const LAUNCH = {
  nz: Date.UTC(2026, 10, 18, 11, 0) / 1000, // 00:00 NZDT, 19 Nov — T0, the first unlock anywhere
  eu: Date.UTC(2026, 10, 18, 23, 0) / 1000, // 00:00 CET, 19 Nov
  us: Date.UTC(2026, 10, 19, 5, 0) / 1000, // 00:00 EST, 19 Nov
  usWest: Date.UTC(2026, 10, 19, 8, 0) / 1000, // 00:00 PST, 19 Nov (minor marker)
} as const

export const T0 = LAUNCH.nz

export type Region = 'oceania' | 'europe' | 'americas'

export const REGION_LAUNCH: Record<Region, number> = {
  oceania: LAUNCH.nz,
  europe: LAUNCH.eu,
  americas: LAUNCH.us,
}

export const REGION_LABEL: Record<Region, string> = {
  oceania: 'New Zealand / Oceania',
  europe: 'Europe',
  americas: 'United States / global',
}

export const LAUNCH_MARKERS = [
  { key: 'nz', t: LAUNCH.nz, label: 'NZ unlock', color: '#3df5c8' },
  { key: 'eu', t: LAUNCH.eu, label: 'Europe unlock', color: '#ffd166' },
  { key: 'us', t: LAUNCH.us, label: 'US unlock', color: '#ff5fa2' },
] as const

/** Days that move Signals on their own; charts shade them. */
export const CALENDAR_EFFECTS = [
  { label: 'US Thanksgiving', from: Date.UTC(2026, 10, 26, 5) / 1000, to: Date.UTC(2026, 10, 27, 5) / 1000 },
  { label: 'Black Friday', from: Date.UTC(2026, 10, 27, 5) / 1000, to: Date.UTC(2026, 10, 28, 5) / 1000 },
  { label: 'Cyber Monday', from: Date.UTC(2026, 10, 30, 5) / 1000, to: Date.UTC(2026, 11, 1, 5) / 1000 },
  { label: 'Christmas', from: Date.UTC(2026, 11, 24, 12) / 1000, to: Date.UTC(2026, 11, 26, 12) / 1000 },
  { label: 'New Year', from: Date.UTC(2026, 11, 31, 10) / 1000, to: Date.UTC(2027, 0, 1, 12) / 1000 },
]

const isDev = import.meta.env.DEV
export const DATA_BASE: string =
  import.meta.env.VITE_DATA_BASE ??
  (isDev ? '/data' : 'https://raw.githubusercontent.com/DavidAslanyan/gta6-impact-monitor/data')

export const REPO_URL = 'https://github.com/DavidAslanyan/gta6-impact-monitor'
export const BASELINE_DAYS = 28
export const HOUR = 3600
export const DAY = 86400
