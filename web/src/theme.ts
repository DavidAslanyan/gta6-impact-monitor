import { createContext, useContext } from 'react'
import type { Group } from './signals'

export const C = {
  bg: '#0d0820',
  panel: 'rgba(24, 14, 48, 0.72)',
  line: 'rgba(255,255,255,0.08)',
  text: '#f4ecff',
  muted: '#a99cc4',
  dim: '#6f6390',
  pink: '#ff5fa2',
  orange: '#ff9a4a',
  gold: '#ffd166',
  teal: '#3df5c8',
  cyan: '#4cc9f0',
  purple: '#9b5cff',
  up: '#3df5c8',
  down: '#ff5f7e',
}

export const GROUP_COLOR: Record<Group, string> = {
  attention: C.pink,
  games: C.purple,
  productivity: C.cyan,
  markets: C.gold,
  energy: C.orange,
  mobility: C.teal,
  status: '#c3a6ff',
  control: '#8f9bb3',
}

export type Range = '48h' | '7d' | '30d'
export const RANGE_SECONDS: Record<Range, number> = { '48h': 48 * 3600, '7d': 7 * 86400, '30d': 400 * 86400 } // 'all' = everything in the bundle

export const RangeContext = createContext<{ range: Range; setRange: (r: Range) => void }>({ range: '7d', setRange: () => {} })
export const useRange = () => useContext(RangeContext)

export const axisCommon = {
  axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
  axisLabel: { color: C.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
}

export const tooltipCommon = {
  backgroundColor: 'rgba(16,9,34,0.95)',
  borderColor: 'rgba(255,95,162,0.4)',
  textStyle: { color: C.text, fontFamily: 'Inter, sans-serif', fontSize: 12 },
}
