import { useQuotes } from '../data/live'
import { fmtPct } from '../format'

export function Ticker() {
  const { data, error, at } = useQuotes()
  if (!data?.length) return <div className="ticker ticker--empty">{error ? 'Market quotes unavailable right now — retrying' : 'Loading market quotes…'}</div>
  const items = data.map((q) => (
    <span key={q.symbol} className="ticker__item">
      <b>{q.name}</b>
      <span className="num">{q.last >= 1000 ? q.last.toLocaleString('en-US', { maximumFractionDigits: 0 }) : q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
      {Number.isFinite(q.changePct) && <span className={`num ${q.changePct > 0 ? 'up' : q.changePct < 0 ? 'down' : ''}`}>{fmtPct(q.changePct, 2)}</span>}
      {q.status && q.status !== 'REG_MKT' && <i>{q.status === 'PRE_MKT' ? 'pre' : q.status === 'POST_MKT' ? 'after' : 'closed'}</i>}
    </span>
  ))
  return (
    <div className="ticker" aria-label="Market quotes">
      <span className="ticker__src">CNBC · {new Date(at).toISOString().slice(11, 16)} UTC</span>
      <div className="ticker__track"><span className="ticker__group">{items}</span><span className="ticker__group" aria-hidden>{items}</span></div>
    </div>
  )
}
