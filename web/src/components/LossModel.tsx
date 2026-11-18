import { useNow } from '../data/live'
import { fmtUsd, fmtInt } from '../format'
import { ECONOMIES, localUnlock, MONTALVO_URL, totalLoss, type LossParams } from '../model/loss'

interface Props { params: LossParams; setParams: (p: LossParams) => void }

export function LossModel({ params, setParams }: Props) {
  const now = useNow(250) / 1000
  const { total, rate, parts } = totalLoss(params, now)
  const max = Math.max(...parts.map((p) => p.total), 1)
  const set = (k: keyof LossParams) => (e: React.ChangeEvent<HTMLInputElement>) => setParams({ ...params, [k]: +e.target.value })

  return (
    <section className="section" id="loss">
      <div className="section__head">
        <div className="kicker">Scenario · model estimate, not data</div>
        <h2>What might it cost?</h2>
        <p className="section__intro">
          This is a <strong>model estimate, not a measurement</strong>. For every economy: <code>absent workers × loss per
          worker-hour × working hours elapsed since its local midnight unlock</code>. It only ticks during local working
          hours ({params.workStart}:00–{params.workEnd}:00, weekdays). The US inputs come from the only published estimate
          (<a href={MONTALVO_URL} target="_blank" rel="noreferrer">economist José García Montalvo: ≈1.5M absences, ≈$1B for launch day</a>);
          every other economy is our own scaling by console ownership and labour cost. Move the sliders and the number follows.
        </p>
      </div>

      <div className="loss-grid">
        <div className="panel loss-total">
          <div className="loss-total__label">Running total</div>
          <div className="loss-total__value num">{fmtUsd(total)}</div>
          <div className="loss-total__rate num">{rate > 0 ? `+${fmtUsd(rate)}/s` : 'paused'}</div>
          <div className="sliders">
            <label>
              <span>Absence scale <b>{params.scale.toFixed(2)}×</b></span>
              <input type="range" min={0.1} max={3} step={0.05} value={params.scale} onChange={set('scale')} />
            </label>
            <label>
              <span>Repeat absences on day 2 <b>{Math.round(params.dayTwo * 100)}%</b></span>
              <input type="range" min={0} max={1} step={0.05} value={params.dayTwo} onChange={set('dayTwo')} />
            </label>
            <label>
              <span>Afterglow, working days 3–10 <b>{Math.round(params.afterglow * 100)}%</b></span>
              <input type="range" min={0} max={0.6} step={0.01} value={params.afterglow} onChange={set('afterglow')} />
            </label>
          </div>
        </div>

        <div className="panel loss-table">
          <table>
            <thead>
              <tr><th>Economy</th><th>Unlocked (UTC)</th><th className="r">Absent</th><th className="r">$/worker-h</th><th>Loss so far</th></tr>
            </thead>
            <tbody>
              {parts.map(({ economy: e, total: t, ratePerSec }) => {
                const u = localUnlock(e.tz)
                return (
                  <tr key={e.key} title={e.basis}>
                    <td>{e.name} {ratePerSec > 0 && <span className="live-dot live-dot--sm" title="Working hours now" />}</td>
                    <td className="num dim">{now >= u ? new Date(u * 1000).toISOString().slice(5, 16).replace('T', ' ') : 'locked'}</td>
                    <td className="r num">{fmtInt(e.absent * params.scale)}</td>
                    <td className="r num">${e.lossPerHour}</td>
                    <td>
                      <div className="bar"><div className="bar__fill" style={{ width: `${(t / max) * 100}%` }} /><span className="num">{fmtUsd(t)}</span></div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="fine">Absences outside the US = US figure × the economy's share of PS5 + Xbox Series owners relative to the US (our assumption). Hover a row to see its basis. {ECONOMIES.length} economies modelled.</p>
        </div>
      </div>
    </section>
  )
}
