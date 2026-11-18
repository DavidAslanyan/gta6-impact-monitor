import { useMemo } from 'react'
import { CALENDAR_EFFECTS, LAUNCH_MARKERS } from '../config'
import { buildBaseline, findAnomalies, type Anomaly } from '../data/baseline'
import { useData } from '../data/store'
import { fmtPct, fmtUtc, fmtValue } from '../format'
import { GROUPS, SIGNALS, type Group } from '../signals'
import { GROUP_COLOR } from '../theme'
import { SignalCard } from './SignalCard'

export function SignalSection({ group }: { group: Group }) {
  const meta = GROUPS.find((g) => g.key === group)!
  const data = useData()
  // Only show Signals that have data (e.g. EIA demand appears once its key is configured).
  const signals = SIGNALS.filter((s) => s.group === group && (data.hourly[s.id]?.length || data.latest[s.id] || !data.loaded))
  const featured = signals.filter((s) => s.featured)
  const rest = signals.filter((s) => !s.featured)
  return (
    <section className="section" id={group} style={{ ['--accent' as string]: GROUP_COLOR[group] }}>
      <div className="section__head">
        <div className="kicker">{meta.kicker}</div>
        <h2>{meta.title}</h2>
        <p className="section__intro">{meta.intro}</p>
      </div>
      {featured.length > 0 && <div className="grid grid--big">{featured.map((s) => <SignalCard key={s.id} signal={s} big />)}</div>}
      {rest.length > 0 && <div className="grid">{rest.map((s) => <SignalCard key={s.id} signal={s} />)}</div>}
    </section>
  )
}

type FeedItem = { t: number; kind: 'launch' | 'calendar' | 'anomaly'; title: string; detail?: string; color: string; a?: Anomaly }

export function AnomalyFeed() {
  const data = useData()
  const items = useMemo(() => {
    const now = Date.now() / 1000
    const out: FeedItem[] = []
    for (const m of LAUNCH_MARKERS) if (m.t <= now) out.push({ t: m.t, kind: 'launch', title: `${m.label}: GTA VI is playable`, detail: 'Launch Moment — midnight local time.', color: m.color })
    for (const c of CALENDAR_EFFECTS) if (c.from <= now) out.push({ t: c.from, kind: 'calendar', title: c.label, detail: 'Calendar Effect — expect unusual readings that have nothing to do with GTA VI.', color: '#8f9bb3' })
    for (const s of SIGNALS) {
      const h = data.hourly[s.id]
      if (!h) continue
      for (const a of findAnomalies(s, h, buildBaseline(s, h))) {
        out.push({ t: a.t, kind: 'anomaly', title: s.label, color: GROUP_COLOR[s.group], a })
      }
    }
    return out.sort((x, y) => y.t - x.t).slice(0, 60)
  }, [data])

  const anomalyCount = items.filter((i) => i.kind === 'anomaly').length
  return (
    <section className="section" id="timeline">
      <div className="section__head">
        <div className="kicker">What happened</div>
        <h2>The timeline</h2>
        <p className="section__intro">
          Written by the data, not by us. A line appears here whenever a Signal moves unusually far from its Baseline —
          at least 3× its normal spread and at least 5% — collapsed to the peak of each episode. {anomalyCount ? `${anomalyCount} so far.` : 'None yet — they appear as the after-launch data comes in.'}
        </p>
      </div>
      <ol className="feed panel">
        {items.map((it, i) => (
          <li key={i} className={`feed__item feed__item--${it.kind}`} style={{ ['--c' as string]: it.color }}>
            <time className="num">{fmtUtc(it.t)}</time>
            <div>
              <div className="feed__title">{it.title}</div>
              {it.a ? (
                <div className="feed__detail">
                  <span className={`delta ${it.a.pct > 0 ? 'delta--up' : 'delta--down'}`}>{fmtPct(it.a.pct)}</span> vs Baseline · reading {fmtValue(it.a.value, it.a.signal.fmt)} {it.a.signal.unit} · {Math.abs(it.a.z).toFixed(1)}σ
                </div>
              ) : (
                <div className="feed__detail">{it.detail}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
