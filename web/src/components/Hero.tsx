import { useEffect, useState } from 'react'
import { LAUNCH, T0 } from '../config'
import { useNow } from '../data/live'
import { fmtDuration } from '../format'
import { useMemo } from 'react'
import { buildBaseline, deltaAt } from '../data/baseline'
import { seriesFor, useData } from '../data/store'
import { fmtPct, fmtValue } from '../format'
import { SIGNAL_BY_ID } from '../signals'

// Served at 1600px (desktop) or 900px (phones); only the visible and the next slide are ever downloaded.
const SLIDE_NAMES = ['city-harbor-skyline-dusk', 'miami-sunset-skyline-artwork-ultrawide', 'beach-bridge-skyline-daytime']
const SIZE = typeof window !== 'undefined' && window.innerWidth <= 900 ? 900 : 1600
const SLIDES = SLIDE_NAMES.map((n) => `media/${n}-${SIZE}.jpg`)

const MOMENTS = [
  { label: 'New Zealand', sub: '00:00 NZDT', t: LAUNCH.nz, color: 'var(--teal)' },
  { label: 'Europe', sub: '00:00 CET', t: LAUNCH.eu, color: 'var(--gold)' },
  { label: 'United States', sub: '00:00 EST', t: LAUNCH.us, color: 'var(--pink)' },
]

export function Hero() {
  const now = useNow(100) / 1000
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 9000)
    return () => clearInterval(id)
  }, [])
  const since = now - T0

  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden>
        {SLIDES.map((src, i) => (
          <div key={src} className={`hero__slide ${i === slide ? 'is-on' : ''}`} style={i === slide || i === (slide + 1) % SLIDES.length || i === (slide + SLIDES.length - 1) % SLIDES.length ? { backgroundImage: `url(${src})` } : undefined} />
        ))}
        <div className="hero__shade" />
        <div className="hero__grid" />
      </div>

      <div className="hero__inner">
        <div className="hero__eyebrow">
          <span className="live-dot" /> LIVE · Independent open-data project · Zero spoilers, promise
        </div>
        <img className="hero__logo" src="media/logo-vi.png" alt="Grand Theft Auto VI logo" />
        <h1 className="hero__title">
          Global Impact <span>Monitor</span>
        </h1>
        <p className="hero__tagline">
          Grand Theft Auto VI is unlocking around the world, one midnight at a time. This page records what the rest of
          the world does meanwhile — markets, power grids, the internet, every other game, the streets — live, from
          public data, against the four weeks before launch.
        </p>

        <div className="hero__clock">
          <div className="hero__clock-label">{since >= 0 ? 'Time since the first unlock' : 'First unlock in'}</div>
          <div className="hero__clock-value num">{fmtDuration(since)}</div>
        </div>

        <div className="moments">
          {MOMENTS.map((m) => {
            const d = now - m.t
            return (
              <div key={m.label} className={`moment ${d >= 0 ? 'is-done' : ''}`} style={{ ['--c' as string]: m.color }}>
                <div className="moment__label">{m.label}</div>
                <div className="moment__sub">{m.sub} · 19 Nov</div>
                <div className="moment__state num">{d >= 0 ? <>UNLOCKED · {fmtDuration(d)} ago</> : <>in {fmtDuration(-d)}</>}</div>
              </div>
            )
          })}
        </div>

        <Headlines />
      </div>
    </section>
  )
}

// Measured headline numbers (never modelled ones): latest reading + Delta vs Baseline where it exists,
// otherwise vs the median of the four weeks before launch for daily series.
const HEADLINES = [
  { id: 'kick.gta6.viewers', caption: 'people watching GTA VI live on Kick' },
  { id: 'attention.wiki.gta6.all.daily', caption: 'GTA VI Wikipedia readers, latest full day' },
  { id: 'steam.top100.players', caption: "playing Steam's top 100 games right now" },
  { id: 'dev.github.commits.hourly', caption: 'public commits pushed to GitHub, last hour' },
]

function Headlines() {
  const data = useData()
  const tiles = useMemo(() => HEADLINES.map(({ id, caption }) => {
    const sig = SIGNAL_BY_ID[id]
    const pts = seriesFor(data, id)
    const daily = /\.(daily|weekly)$/.test(id)
    const last = daily ? pts[pts.length - 1] : data.latest[id] ?? pts[pts.length - 1]
    if (!sig || !last) return { id, caption, value: null as string | null, delta: null as string | null, vs: '' }
    const model = data.hourly[id] ? buildBaseline(sig, data.hourly[id]) : null
    const d = deltaAt(model, last[0], last[1])
    let delta: string | null = null
    let vs = ''
    if (d) { delta = fmtPct(d.pct); vs = 'vs Baseline' }
    else if (daily) {
      const prev = pts.filter((p) => p[0] < last[0] && p[0] >= last[0] - 28 * 86400).map((p) => p[1]).sort((a, b) => a - b)
      if (prev.length >= 7) { const m = prev[prev.length >> 1]; delta = (last[1] / m).toFixed(1) + '×'; vs = 'its 4-week median' }
    }
    return { id, caption, value: fmtValue(last[1], sig.fmt, { compact: true }), delta, vs }
  }), [data])
  return (
    <div className="headlines">
      {tiles.map((t) => (
        <a key={t.id} className="headline" href={`#${SIGNAL_BY_ID[t.id]?.group ?? 'pulse'}`}>
          <div className="headline__value num">{t.value ?? '—'}</div>
          <div className="headline__caption">{t.caption}</div>
          {t.delta && <div className="headline__delta num">{t.delta} <span>{t.vs}</span></div>}
        </a>
      ))}
      <div className="headline__foot">Measured, not modelled · every number links to its public source below</div>
    </div>
  )
}
