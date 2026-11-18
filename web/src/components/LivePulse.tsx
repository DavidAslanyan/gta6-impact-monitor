import { useMemo } from 'react'
import { useBluesky, useBtcTrades, useKick, useWikiEdits, type RateState } from '../data/live'
import { seriesFor, useData } from '../data/store'
import { fmtCompact, fmtInt } from '../format'
import { C, tooltipCommon } from '../theme'
import { EChart } from './EChart'

function Spark({ values, color, height = 70 }: { values: number[]; color: string; height?: number }) {
  const option = useMemo(() => ({
    animation: false,
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: 0 },
    tooltip: { ...tooltipCommon, trigger: 'axis', formatter: (p: { value: number; dataIndex: number }[]) => `${values.length - 1 - p[0].dataIndex}s ago: <b>${fmtInt(p[0].value)}</b>` },
    series: [{
      type: 'line', data: values, symbol: 'none', smooth: 0.3,
      lineStyle: { color, width: 1.6, shadowColor: color, shadowBlur: 6 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '66' }, { offset: 1, color: color + '00' }] } },
    }],
  }), [values, color])
  return <EChart option={option} height={height} merge />
}

const avg = (xs: number[], n: number) => {
  const s = xs.slice(-n)
  return s.reduce((a, b) => a + b, 0) / Math.max(s.length, 1)
}

function Status({ s }: { s: RateState['status'] }) {
  return <span className={`feed-status feed-status--${s}`}>{s === 'live' ? '● LIVE' : s === 'connecting' ? 'connecting…' : s === 'reconnecting' ? 'reconnecting…' : 'unavailable'}</span>
}

/** Compares a live per-second rate with the pre-launch mean of the same Signal recorded by the collector. */
function useBaselineRate(id: string, launch: number) {
  const data = useData()
  return useMemo(() => {
    const pts = seriesFor(data, id).filter((p) => p[0] < launch)
    if (!pts.length) return null
    return pts.reduce((a, p) => a + p[1], 0) / pts.length
  }, [data, id, launch])
}

export function LivePulse() {
  const bsky = useBluesky()
  const wiki = useWikiEdits()
  const btc = useBtcTrades()
  const kick = useKick()
  const bskyBase = useBaselineRate('live.bluesky.posts_per_sec', Date.UTC(2026, 10, 19, 5) / 1000)
  const wikiBase = useBaselineRate('live.wiki.edits_per_sec', Date.UTC(2026, 10, 19, 5) / 1000)

  const postsNow = avg(bsky.buckets.posts, 10)
  const gtaPerMin = avg(bsky.buckets.gta, 60) * 60
  const editsNow = avg(wiki.buckets.edits, 10)
  const botShare = wiki.totals.edits ? (wiki.totals.bots / wiki.totals.edits) * 100 : 0
  const tradesNow = avg(btc.buckets.trades, 10)
  const price = btc.last.price

  return (
    <section className="section" id="pulse">
      <div className="section__head">
        <div className="kicker">Live pulse · updates every second</div>
        <h2>The world, right now</h2>
        <p className="section__intro">
          Streamed straight into your browser from public feeds — every Bluesky post, every Wikipedia edit, every Bitcoin
          trade on Binance — counted per second. Only numbers are kept; nobody's posts are shown.
        </p>
      </div>
      <div className="pulse-grid">
        <div className="panel pulse">
          <div className="pulse__head"><span>Bluesky posts / second</span><Status s={bsky.status} /></div>
          <div className="pulse__value num">{postsNow.toFixed(1)}</div>
          <div className="pulse__sub">{bskyBase ? <>pre-US-launch average {bskyBase.toFixed(1)}/s · </> : null}{fmtInt(bsky.totals.posts)} counted since you opened this page</div>
          <Spark values={bsky.buckets.posts} color={C.cyan} />
        </div>
        <div className="panel pulse">
          <div className="pulse__head"><span>Posts mentioning GTA VI / minute</span><Status s={bsky.status} /></div>
          <div className="pulse__value num pink">{gtaPerMin.toFixed(0)}</div>
          <div className="pulse__sub">{postsNow ? ((avg(bsky.buckets.gta, 60) / Math.max(avg(bsky.buckets.posts, 60), 0.01)) * 100).toFixed(2) : '0.00'}% of everything posted on Bluesky in the last minute</div>
          <Spark values={bsky.buckets.gta} color={C.pink} />
        </div>
        <div className="panel pulse">
          <div className="pulse__head"><span>Wikipedia edits / second</span><Status s={wiki.status} /></div>
          <div className="pulse__value num">{editsNow.toFixed(1)}</div>
          <div className="pulse__sub">{wikiBase ? <>pre-US-launch average {wikiBase.toFixed(1)}/s · </> : null}{botShare.toFixed(0)}% by bots this session</div>
          <Spark values={wiki.buckets.edits} color={C.teal} />
        </div>
        <div className="panel pulse">
          <div className="pulse__head"><span>Bitcoin trades / second (Binance)</span><Status s={btc.status} /></div>
          <div className="pulse__value num gold">{tradesNow.toFixed(1)}</div>
          <div className="pulse__sub">BTC {price ? '$' + fmtInt(price) : '—'} · ${fmtCompact(avg(btc.buckets.volume, 60))}/s traded over the last minute</div>
          <Spark values={btc.buckets.trades} color={C.gold} />
        </div>
        <div className="panel pulse pulse--wide">
          <div className="pulse__head">
            <span>Live streaming audience by category — Kick</span>
            <span className={`feed-status feed-status--${kick.data ? 'live' : kick.error ? 'unavailable' : 'connecting'}`}>{kick.data ? '● every 20s' : kick.error ? 'unavailable from this browser' : 'connecting…'}</span>
          </div>
          {kick.data ? (
            <>
              <div className="pulse__value num pink">{fmtInt(kick.data.gta6)} <small>watching GTA VI · {((kick.data.gta6 / Math.max(kick.data.total, 1)) * 100).toFixed(1)}% of top categories</small></div>
              <div className="cat-bars">
                {kick.data.top.map((c) => (
                  <div key={c.name} className={`cat-bar ${/Grand Theft Auto VI/i.test(c.name) ? 'is-gta' : ''}`}>
                    <span className="cat-bar__name">{c.name}</span>
                    <span className="cat-bar__track"><span style={{ width: `${(c.viewers / kick.data!.top[0].viewers) * 100}%` }} /></span>
                    <span className="cat-bar__num num">{fmtCompact(c.viewers)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="pulse__sub">Kick's category API is unofficial and may block some browsers; the 5-minute history in "The Cause" below is recorded server-side either way.</div>
          )}
        </div>
      </div>
    </section>
  )
}
