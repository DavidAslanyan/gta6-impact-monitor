import { useEffect, useMemo, useRef } from 'react'
import { LAUNCH } from '../config'
import { recentRate, setLiveOnScreen, useBluesky, useBtcTrades, useKick, useWikiEdits, type Bucket, type RateState } from '../data/live'
import { seriesFor, useData } from '../data/store'
import { fmtCompact, fmtInt } from '../format'
import { C, tooltipCommon } from '../theme'
import { EChart } from './EChart'

function Spark({ values, color, height = 70 }: { values: Bucket[]; color: string; height?: number }) {
  const option = useMemo(() => ({
    animation: false,
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: 0 },
    tooltip: {
      ...tooltipCommon, trigger: 'axis',
      formatter: (p: { value: number | null; dataIndex: number }[]) => `${values.length - 1 - p[0].dataIndex}s ago: <b>${p[0].value === null ? '—' : fmtInt(p[0].value)}</b>`,
    },
    series: [{
      type: 'line', data: values, symbol: 'none', smooth: 0.3, connectNulls: false,
      lineStyle: { color, width: 1.6, shadowColor: color, shadowBlur: 6 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '66' }, { offset: 1, color: color + '00' }] } },
    }],
  }), [values, color])
  return <EChart option={option} height={height} merge />
}

function Status({ s }: { s: RateState['status'] }) {
  const label = { idle: 'paused', connecting: 'connecting…', live: '● LIVE', reconnecting: 'reconnecting…', unavailable: 'blocked on this network' }[s]
  return <span className={`feed-status feed-status--${s}`}>{label}</span>
}

const fix = (v: number | null, d = 1) => (v === null ? '—' : v.toFixed(d))

/** Pre-launch average of the same rate, recorded server-side by the collector (20-second samples every 5 minutes). */
function useBaselineRate(id: string, launch: number) {
  const data = useData()
  return useMemo(() => {
    const pts = seriesFor(data, id).filter((p) => p[0] < launch)
    if (!pts.length) return null
    return pts.reduce((a, p) => a + p[1], 0) / pts.length
  }, [data, id, launch])
}

export function LivePulse() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => setLiveOnScreen(e.isIntersecting), { rootMargin: '200px 0px' })
    io.observe(ref.current)
    return () => { io.disconnect(); setLiveOnScreen(false) }
  }, [])

  const bsky = useBluesky()
  const wiki = useWikiEdits()
  const btc = useBtcTrades()
  const kick = useKick()
  const bskyBase = useBaselineRate('live.bluesky.posts_per_sec', LAUNCH.us)
  const wikiBase = useBaselineRate('live.wiki.edits_per_sec', LAUNCH.us)

  const postsNow = recentRate(bsky.buckets.posts, 10)
  const gtaMin = recentRate(bsky.buckets.gta, 60)
  const postsMin = recentRate(bsky.buckets.posts, 60)
  const editsNow = recentRate(wiki.buckets.edits, 10)
  const botShare = wiki.totals.edits ? (wiki.totals.bots / wiki.totals.edits) * 100 : null
  const tradesNow = recentRate(btc.buckets.trades, 10)
  const volMin = recentRate(btc.buckets.volume, 60)
  const price = btc.last.price

  return (
    <section className="section" id="pulse" ref={ref}>
      <div className="section__head">
        <div className="kicker">Live pulse · updates every second</div>
        <h2>The world, right now</h2>
        <p className="section__intro">
          Streamed straight into your browser from public feeds — every Bluesky post, every Wikipedia edit, every Bitcoin
          trade on Binance — counted per second. Only numbers are kept; nobody's posts are shown. The streams run only
          while this section is on screen.
        </p>
      </div>
      <div className="pulse-grid">
        <div className="panel pulse">
          <div className="pulse__head"><span>Bluesky posts / second</span><Status s={bsky.status} /></div>
          <div className="pulse__value num">{fix(postsNow)}</div>
          <div className="pulse__sub">{bskyBase ? <>pre-US-launch average {bskyBase.toFixed(1)}/s · </> : null}{fmtInt(bsky.totals.posts)} counted while you watched</div>
          <Spark values={bsky.buckets.posts} color={C.cyan} />
        </div>
        <div className="panel pulse">
          <div className="pulse__head"><span>Posts mentioning GTA VI / minute</span><Status s={bsky.status} /></div>
          <div className="pulse__value num pink">{gtaMin === null ? '—' : (gtaMin * 60).toFixed(0)}</div>
          <div className="pulse__sub">{gtaMin !== null && postsMin ? ((gtaMin / postsMin) * 100).toFixed(2) + '% of everything posted on Bluesky in the last minute' : 'share of all Bluesky posts'}</div>
          <Spark values={bsky.buckets.gta} color={C.pink} />
        </div>
        <div className="panel pulse">
          <div className="pulse__head"><span>Wikipedia edits / second</span><Status s={wiki.status} /></div>
          <div className="pulse__value num">{fix(editsNow)}</div>
          <div className="pulse__sub">{wikiBase ? <>pre-US-launch average {wikiBase.toFixed(1)}/s · </> : null}{botShare === null ? '' : `${botShare.toFixed(0)}% by bots while you watched`}</div>
          <Spark values={wiki.buckets.edits} color={C.teal} />
        </div>
        <div className="panel pulse">
          <div className="pulse__head"><span>Bitcoin trades / second (Binance)</span><Status s={btc.status} /></div>
          <div className="pulse__value num gold">{fix(tradesNow)}</div>
          <div className="pulse__sub">BTC {price ? '$' + fmtInt(price) : '—'}{volMin !== null ? <> · ${fmtCompact(volMin)}/s traded over the last minute</> : null}</div>
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
                  <div key={c.label} className={`cat-bar ${c.gta ? 'is-gta' : ''}`}>
                    <span className="cat-bar__name">{c.label}</span>
                    <span className="cat-bar__track"><span style={{ width: `${(c.viewers / Math.max(...kick.data!.top.map((x) => x.viewers))) * 100}%` }} /></span>
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
