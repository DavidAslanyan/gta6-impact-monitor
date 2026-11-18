import { useMemo } from 'react'
import { CALENDAR_EFFECTS, LAUNCH_MARKERS, REGION_LABEL, REGION_LAUNCH } from '../config'
import { buildBaseline, deltaAt, MODE_LABEL } from '../data/baseline'
import { seriesFor, useData, type Point } from '../data/store'
import { fmtAgo, fmtPct, fmtUtc, fmtValue } from '../format'
import { tierOf, TIER_LABEL, type Signal } from '../signals'
import { REPO_URL } from '../config'
import { axisCommon, C, GROUP_COLOR, RANGE_SECONDS, tooltipCommon, useRange } from '../theme'
import { EChart } from './EChart'

function downloadCsv(signal: Signal, pts: Point[]) {
  const rows = ['timestamp_utc,unix_seconds,value', ...pts.map(([t, v]) => `${new Date(t * 1000).toISOString()},${t},${v}`)]
  const meta = `# ${signal.label} (${signal.unit}) — source: ${signal.source} ${signal.sourceUrl}\n# Collected by the GTA VI Global Impact Monitor: ${REPO_URL}\n# Hourly averages, plus 5-minute readings for the last 48 hours where available. Full-resolution raw data: ${REPO_URL}/tree/data/series/${signal.id}\n`
  const blob = new Blob([meta + rows.join('\n') + '\n'], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${signal.id}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function SignalCard({ signal, big = false }: { signal: Signal; big?: boolean }) {
  const data = useData()
  const { range } = useRange()
  const color = GROUP_COLOR[signal.group]

  const hourly = data.hourly[signal.id]
  const pts = useMemo(() => seriesFor(data, signal.id), [data, signal.id])
  const model = useMemo(() => (hourly ? buildBaseline(signal, hourly) : null), [signal, hourly])

  // Daily/weekly series: the collector's latest reading can be a partial day, so use the last complete bucket.
  const periodic = /\.(daily|weekly)$/.test(signal.id)
  const latest: Point | undefined = periodic ? pts[pts.length - 1] : data.latest[signal.id] ?? pts[pts.length - 1]
  const delta = latest ? deltaAt(model, latest[0], latest[1]) : null
  const nowS = Date.now() / 1000
  const stale = latest ? nowS - latest[0] > 6 * 3600 && !signal.id.endsWith('.daily') && !signal.id.endsWith('.weekly') : false

  const option = useMemo(() => {
    // Zoom in on Signals that started recording recently instead of leaving the chart mostly empty.
    const first = pts.length ? pts[0][0] : nowS
    const from = Math.max(nowS - RANGE_SECONDS[range], Math.min(first - 3600, nowS - 6 * 3600))
    const shown = pts.filter((p) => p[0] >= from)
    const main = shown.map((p) => [p[0] * 1000, p[1]])
    // Expected band from the Baseline, after launch only (sampled hourly to stay light).
    const lower: number[][] = [], width: number[][] = [], mid: number[][] = []
    if (model) {
      const hourlyPts = (hourly || []).filter((p) => p[0] >= Math.max(from, model.launch))
      for (const [t] of hourlyPts) {
        const e = model.expected(t)
        if (!e) continue
        lower.push([t * 1000, e.mean - e.std])
        width.push([t * 1000, 2 * e.std])
        mid.push([t * 1000, e.mean])
      }
    }
    const inv = !!signal.inverted
    return {
      animation: false,
      grid: { left: 8, right: 12, top: 14, bottom: 22, containLabel: true },
      tooltip: {
        ...tooltipCommon,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,0.3)' } },
        formatter: (ps: { seriesName: string; value: number[]; color: string }[]) => {
          const p = ps.find((x) => x.seriesName === 'value') ?? ps[0]
          if (!p) return ''
          const exp = ps.find((x) => x.seriesName === 'expected')
          const t = p.value[0] / 1000
          let html = `<div style="font:500 11px JetBrains Mono;color:${C.muted}">${fmtUtc(t)}</div>`
          if (p.seriesName === 'value') html += `<div style="font-weight:700">${fmtValue(p.value[1], signal.fmt)} <span style="color:${C.muted};font-weight:400">${signal.unit}</span></div>`
          if (exp) html += `<div style="color:${C.muted}">Baseline: ${fmtValue(exp.value[1], signal.fmt)}</div>`
          return html
        },
      },
      xAxis: { type: 'time', ...axisCommon, splitLine: { show: false }, min: from * 1000, max: nowS * 1000 },
      yAxis: {
        type: 'value', scale: true, inverse: inv, ...axisCommon,
        ...(signal.fmt === 'rank' ? { max: (e: { max: number }) => Math.min(201, e.max + 2), min: (e: { min: number }) => Math.max(1, e.min - 2), minInterval: 1 } : {}),
        ...(signal.fmt === 'level' ? { min: 0, max: 3, interval: 1 } : {}),
        axisLabel: {
          ...axisCommon.axisLabel,
          formatter: (v: number) => signal.fmt === 'rank' ? (v > 200 ? '—' : '#' + Math.round(v)) : signal.fmt === 'level' ? String(v) : fmtValue(v, signal.fmt === 'mw' ? 'int' : signal.fmt, { compact: true }),
        },
      },
      series: [
        { name: 'band-low', type: 'line', data: lower, stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, silent: true, tooltip: { show: false } },
        { name: 'band', type: 'line', data: width, stack: 'band', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(255,255,255,0.07)' }, silent: true, tooltip: { show: false } },
        { name: 'expected', type: 'line', data: mid, symbol: 'none', lineStyle: { color: 'rgba(255,255,255,0.45)', width: 1, type: 'dashed' }, z: 2 },
        {
          name: 'value', type: 'line', data: main, symbol: periodic ? 'circle' : 'none', symbolSize: 4, smooth: periodic ? false : 0.15, z: 3,
          lineStyle: { color, width: 2, shadowColor: color, shadowBlur: 8 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '55' }, { offset: 1, color: color + '00' }] }, origin: inv ? 'end' : 'auto' },
          markLine: {
            symbol: 'none', silent: true,
            label: { color: C.muted, fontSize: 9, fontFamily: 'JetBrains Mono', formatter: '{b}', position: 'insideEndTop' },
            data: LAUNCH_MARKERS.filter((m) => m.t >= from).map((m) => ({ name: m.label, xAxis: m.t * 1000, lineStyle: { color: m.color, type: 'solid', width: 1, opacity: 0.8 } })),
          },
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(255, 209, 102, 0.06)' },
            label: { color: C.dim, fontSize: 9 },
            data: CALENDAR_EFFECTS.filter((c) => c.to >= from && c.from <= nowS).map((c) => [{ name: c.label, xAxis: c.from * 1000 }, { xAxis: c.to * 1000 }]),
          },
        },
      ],
    }
  }, [pts, model, hourly, range, color, signal, nowS])

  const dGood = delta ? (signal.inverted ? -delta.pct : delta.pct) : 0
  const showAbs = signal.fmt === 'rank' || signal.fmt === 'level' || signal.fmt === 'temp'
  const strong = delta && Math.abs(delta.z) >= 3 && Math.abs(delta.pct) >= 5

  return (
    <article className={`card ${big ? 'card--big' : ''} ${strong ? 'card--hot' : ''}`} style={{ ['--accent' as string]: color }}>
      <header className="card__head">
        <div className="card__title">
          <h3>{signal.label}</h3>
          <div className="card__badges">
            <span className={`badge badge--tier-${tierOf(signal)}`} title={tierOf(signal) === 'official' ? 'Published by the operator, agency or company itself' : tierOf(signal) === 'public' ? 'Documented public dataset from a third-party aggregator' : 'Undocumented endpoint: real data, but it may change or break without notice'}>{TIER_LABEL[tierOf(signal)]}</span>
            {signal.group === 'control' && <span className="badge">control</span>}
            <span className="badge badge--dim" title={`Baseline ends at the ${REGION_LABEL[signal.region]} Launch Moment`}>{signal.region === 'oceania' ? 'NZ/AU clock' : signal.region === 'europe' ? 'EU clock' : 'US clock'}</span>
          </div>
        </div>
        <div className="card__value">
          <span className="num">{latest ? fmtValue(latest[1], signal.fmt) : '—'}</span>
          {!['usd', 'pct', 'rank', 'level', 'temp', 'mw'].includes(signal.fmt) && <span className="unit">{signal.unit}</span>}
          {delta && !showAbs && (
            <span className={`delta ${dGood > 0 ? 'delta--up' : dGood < 0 ? 'delta--down' : ''}`} title={`vs Baseline (${MODE_LABEL[delta.expected.mode]}); z = ${delta.z.toFixed(1)}`}>
              {fmtPct(delta.pct)}
            </span>
          )}
          {delta && signal.fmt === 'temp' && (
            <span className="delta" title={`vs Baseline (${MODE_LABEL[delta.expected.mode]})`}>{delta.abs >= 0 ? '+' : '−'}{Math.abs(delta.abs).toFixed(1)} °C</span>
          )}
          {delta && showAbs && signal.fmt === 'rank' && (
            <span className={`delta ${delta.abs < 0 ? 'delta--up' : delta.abs > 0 ? 'delta--down' : ''}`}>{delta.abs < 0 ? '▲' : delta.abs > 0 ? '▼' : '='} {Math.abs(Math.round(delta.abs))} places</span>
          )}
        </div>
      </header>
      {pts.length ? <EChart option={option} height={big ? 240 : 150} /> : <div className="card__empty">{data.loaded ? 'Waiting for the first readings…' : 'Loading…'}</div>}
      <footer className="card__foot">
        <span className="card__note">{signal.note}</span>
        <span className="card__meta">
          {delta ? (
            <>Baseline: {MODE_LABEL[delta.expected.mode]}{model && model.spanHours < 72 ? ` (${Math.round(model.spanHours)} h of pre-launch data)` : ''} · </>
          ) : nowS < REGION_LAUNCH[signal.region] ? (
            <>Recording the Baseline until the {signal.region === 'oceania' ? 'NZ' : signal.region === 'europe' ? 'Europe' : 'US'} unlock (in {Math.max(1, Math.round((REGION_LAUNCH[signal.region] - nowS) / 3600))} h) · </>
          ) : !model ? (
            <>No pre-launch readings were recorded, so this Signal has no Baseline · </>
          ) : periodic ? (
            <>First post-launch {signal.id.endsWith('.weekly') ? 'week' : 'day'} not complete yet · </>
          ) : null}
          {latest ? <span className={stale ? 'stale' : ''}>updated {fmtAgo(latest[0])}</span> : null} ·{' '}
          {signal.source}
        </span>
        <span className="card__links">
          <a href={signal.sourceUrl} target="_blank" rel="noreferrer">Verify at source ↗</a>
          <button onClick={() => downloadCsv(signal, pts)}>Download CSV</button>
          <a href={`${REPO_URL}/tree/data/series/${signal.id}`} target="_blank" rel="noreferrer">Raw data ↗</a>
        </span>
      </footer>
    </article>
  )
}
