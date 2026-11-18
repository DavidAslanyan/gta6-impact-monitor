import { useMemo } from 'react'
import { CALENDAR_EFFECTS, LAUNCH_MARKERS } from '../config'
import { buildBaseline, deltaAt, findAnomalies, type Anomaly } from '../data/baseline'
import { seriesFor, useData } from '../data/store'
import { fmtPct, fmtUtc, fmtValue } from '../format'
import { GROUPS, SIGNALS, tierOf, type Group } from '../signals'
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
      {data.error && !data.generated && <div className="panel data-down">Recorded data could not be loaded right now ({data.error}). Retrying every 2 minutes — the live feeds above are unaffected.</div>}
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
          at least 3× its normal spread and at least 5% — stamped at the peak of each episode. {data.error && !data.generated ? 'Recorded data could not be loaded right now — retrying.' : !data.loaded ? 'Loading…' : anomalyCount ? `${anomalyCount} so far.` : 'None yet — they appear as the after-launch data comes in.'}
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
                  <span className={`delta ${it.a.pct > 0 ? 'delta--up' : 'delta--down'}`}>{fmtPct(it.a.pct)}</span> vs Baseline at the peak · reading {fmtValue(it.a.value, it.a.signal.fmt)} {it.a.signal.unit} · {Math.abs(it.a.z).toFixed(1)} robust σ{it.a.start !== it.a.t ? ` · episode began ${fmtUtc(it.a.start, false)}` : ''}
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

/** Every Signal section, in the editorial order defined by GROUPS (most visual first). */
export function AllSections() {
  return <>{GROUPS.map((g) => <SignalSection key={g.key} group={g.key} />)}</>
}

/**
 * The six Signals that have moved furthest from their Baseline right now, chosen automatically by robust z-score.
 * Before enough post-launch data exists, it falls back to the strongest measured Cause Signals.
 */
export function BiggestMoves() {
  const data = useData()
  const picks = useMemo(() => {
    const scored: { id: string; score: number }[] = []
    for (const s of SIGNALS) {
      if (['rank', 'level', 'temp'].includes(s.fmt) || s.group === 'control' || s.group === 'status' || tierOf(s) === 'unofficial' && s.group !== 'attention') continue
      const h = data.hourly[s.id]
      if (!h?.length) continue
      const model = buildBaseline(s, h)
      const pts = seriesFor(data, s.id)
      const periodic = /\.(daily|weekly)$/.test(s.id)
      const last = periodic ? pts[pts.length - 1] : data.latest[s.id] ?? pts[pts.length - 1]
      if (!last || Date.now() / 1000 - last[0] > (periodic ? 3 * 86400 : 6 * 3600)) continue
      const d = deltaAt(model, last[0], last[1])
      if (!d || Math.abs(d.pct) < 3) continue
      scored.push({ id: s.id, score: Math.abs(d.z) })
    }
    scored.sort((a, b) => b.score - a.score)
    const ids = scored.slice(0, 6).map((x) => x.id)
    for (const fallback of ['attention.wiki.gta6.all.daily', 'kick.gta6.viewers', 'steam.top100.players', 'dev.github.commits.hourly', 'energy.gb.demand_mw', 'commute.london.tube_crowding_pct']) {
      if (ids.length >= 6) break
      if (!ids.includes(fallback) && data.hourly[fallback]?.length) ids.push(fallback)
    }
    return { ids, automatic: scored.length }
  }, [data])
  const bySig = Object.fromEntries(SIGNALS.map((s) => [s.id, s]))
  return (
    <section className="section" id="moves">
      <div className="section__head">
        <div className="kicker">Right now</div>
        <h2>Biggest moves</h2>
        <p className="section__intro">
          Chosen automatically, not by us: the Signals furthest from their Baseline at this moment, ranked by how unusual the
          change is. {picks.automatic < 6 ? 'Until enough after-launch data exists, the strongest Cause Signals fill the remaining slots.' : ''}
        </p>
      </div>
      <div className="grid grid--moves">{picks.ids.map((id) => <SignalCard key={id} signal={bySig[id]} />)}</div>
    </section>
  )
}
