import { useMemo, useState } from 'react'
import { buildBaseline, deltaAt, isPre, localHour } from '../data/baseline'
import { useData } from '../data/store'
import { fmtPct } from '../format'
import { HYPOTHESES, PHASES, UNMEASURABLE, type Direction, type Hypothesis } from '../hypotheses'
import { SIGNAL_BY_ID } from '../signals'

type Verdict = 'supported' | 'contradicted' | 'nochange' | 'holds' | 'broken' | 'waiting'

const VERDICT: Record<Verdict, { label: string; cls: string }> = {
  supported: { label: 'Supported so far', cls: 'v-sup' },
  contradicted: { label: 'Contradicted', cls: 'v-con' },
  nochange: { label: 'No clear change', cls: 'v-none' },
  holds: { label: 'Holds (no change)', cls: 'v-sup' },
  broken: { label: 'Moved anyway', cls: 'v-con' },
  waiting: { label: 'Waiting for data', cls: 'v-wait' },
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

interface TestResult { id: string; label: string; expect: Direction; n: number; pct: number; aligned: number; verdict: Verdict; isRank: boolean }
interface PhaseResult { verdict: Verdict; aligned: number; alignedPct: number; tests: TestResult[]; inProgress: boolean }

// Thresholds: a median robust z of 1.5 in the expected direction AND at least a 2% median change.
const Z = 1.5
const MIN_PCT = 2

function judge(expect: Direction, aligned: number, pct: number, rank: boolean): Verdict {
  if (expect === 'flat') return Math.abs(aligned) < 2 ? 'holds' : 'broken'
  const big = rank || Math.abs(pct) >= MIN_PCT
  if (aligned >= Z && big) return 'supported'
  if (aligned <= -Z && big) return 'contradicted'
  return 'nochange'
}

function useResults() {
  const data = useData()
  return useMemo(() => {
    const now = Date.now() / 1000
    const out: Record<string, Record<string, PhaseResult>> = {}
    for (const h of HYPOTHESES) {
      out[h.key] = {}
      for (const ph of PHASES) {
        const tests: TestResult[] = []
        for (const t of h.tests) {
          const sig = SIGNAL_BY_ID[t.id]
          const hourly = data.hourly[t.id]
          if (!sig || !hourly?.length) continue
          const model = buildBaseline(sig, hourly)
          if (!model) continue
          const pcts: number[] = [], zs: number[] = []
          for (const [ts, v] of hourly) {
            if (ts < ph.from || ts >= ph.to || ts > now || isPre(model, ts)) continue
            if (t.hours && !model.daily) {
              const lh = localHour(ts, sig.region)
              if (lh < t.hours[0] || lh >= t.hours[1]) continue
            }
            const d = deltaAt(model, ts, v)
            if (!d) continue
            pcts.push(d.pct)
            zs.push(d.z)
          }
          const isRank = sig.fmt === 'rank'
          if (!zs.length) { tests.push({ id: t.id, label: sig.label, expect: t.expect, n: 0, pct: 0, aligned: 0, verdict: 'waiting', isRank }); continue }
          const mz = median(zs), mp = median(pcts)
          // For ranks a smaller number is "more popular", so flip the sign.
          const signed = sig.inverted ? -mz : mz
          const aligned = t.expect === 'down' ? -signed : signed
          tests.push({ id: t.id, label: sig.label, expect: t.expect, n: zs.length, pct: mp, aligned, verdict: judge(t.expect, aligned, mp, isRank), isRank })
        }
        const measured = tests.filter((x) => x.n > 0)
        const inProgress = now >= ph.from && now < ph.to
        if (!measured.length) { out[h.key][ph.key] = { verdict: 'waiting', aligned: 0, alignedPct: 0, tests, inProgress }; continue }
        const aligned = measured.reduce((a, x) => a + x.aligned, 0) / measured.length
        const alignedPct = measured.filter((x) => !x.isRank).reduce((a, x) => a + (x.expect === 'down' ? -x.pct : x.pct), 0) / Math.max(1, measured.filter((x) => !x.isRank).length)
        const expect = h.tests[0].expect
        out[h.key][ph.key] = { verdict: judge(expect, aligned, alignedPct, measured.every((x) => x.isRank)), aligned, alignedPct, tests, inProgress }
      }
    }
    return out
  }, [data])
}

function Row({ h, res }: { h: Hypothesis; res: Record<string, PhaseResult> }) {
  const [open, setOpen] = useState(false)
  const dir = h.tests[0].expect
  return (
    <div className={`hyp ${open ? 'is-open' : ''}`}>
      <button className="hyp__main" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="hyp__emoji" aria-hidden>{h.emoji}</span>
        <span className="hyp__claim">
          <b>{h.claim}</b>
          <small>{h.why}</small>
        </span>
        {PHASES.map((ph) => {
          const r = res[ph.key]
          const v = VERDICT[r.verdict]
          return (
            <span key={ph.key} className={`hyp__cell ${v.cls}`} data-phase={ph.label}>
              <span className="hyp__chip">{v.label}{r.inProgress && r.verdict !== 'waiting' ? ' · live' : ''}</span>
              {r.verdict !== 'waiting' && dir !== 'flat' && <span className="hyp__fx num">{fmtPct(r.alignedPct)} in expected direction</span>}
            </span>
          )
        })}
      </button>
      {open && (
        <div className="hyp__detail">
          {PHASES.map((ph) => (
            <div key={ph.key} className="hyp__phase">
              <div className="hyp__phase-title">{ph.label} <span>{ph.sub}</span></div>
              {res[ph.key].tests.map((t) => (
                <div key={t.id} className="hyp__test">
                  <span>{t.label}</span>
                  <span className="dim">expect {t.expect === 'up' ? (t.isRank ? 'higher rank' : '↑') : t.expect === 'down' ? '↓' : 'no change'}</span>
                  <span className={`num ${VERDICT[t.verdict].cls}`}>{t.n ? `${t.isRank ? '' : fmtPct(t.pct) + ' · '}${t.aligned >= 0 ? '+' : ''}${t.aligned.toFixed(1)}σ · ${t.n} readings` : 'no readings yet'}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Hypotheses() {
  const res = useResults()
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const h of HYPOTHESES) {
      // Latest phase that has any data.
      const r = [...PHASES].reverse().map((p) => res[h.key][p.key]).find((x) => x.verdict !== 'waiting')
      const v = r?.verdict ?? 'waiting'
      c[v] = (c[v] || 0) + 1
    }
    return c
  }, [res])

  return (
    <section className="section" id="effect">
      <div className="section__head">
        <div className="kicker">The GTA Effect · {HYPOTHESES.length} hypotheses, tested live</div>
        <h2>What happens when everyone enters Vice City?</h2>
        <p className="section__intro">
          Each claim is wired to real Signals and judged automatically against its Baseline, phase by phase: <b>supported</b> when the
          median change is at least 1.5 robust standard deviations (and 2%) in the expected direction, <b>contradicted</b> when it moves
          the other way, otherwise <b>no clear change</b>. Two controls should never move. Click a row to see every Signal behind it.
        </p>
      </div>
      <div className="hyp-summary">
        {(['supported', 'nochange', 'contradicted', 'waiting'] as Verdict[]).map((v) => (
          <div key={v} className={`hyp-summary__item ${VERDICT[v].cls}`}>
            <b className="num">{(counts[v] || 0) + (v === 'supported' ? counts.holds || 0 : v === 'contradicted' ? counts.broken || 0 : 0)}</b> {VERDICT[v].label.toLowerCase()}
          </div>
        ))}
      </div>
      <div className="hyp-table panel">
        <div className="hyp__head">
          <span />
          <span>Hypothesis</span>
          {PHASES.map((p) => <span key={p.key}>{p.label} <small>{p.sub}</small></span>)}
        </div>
        {HYPOTHESES.map((h) => <Row key={h.key} h={h} res={res[h.key]} />)}
      </div>
      <div className="hyp-unmeasurable">
        <b>Can't be measured with free public data — so we don't pretend:</b>
        <ul>{UNMEASURABLE.map((u) => <li key={u.claim}><span>{u.claim}</span> — {u.why}</li>)}</ul>
      </div>
    </section>
  )
}
