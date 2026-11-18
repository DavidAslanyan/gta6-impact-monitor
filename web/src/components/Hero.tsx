import { useEffect, useState } from 'react'
import { LAUNCH, T0 } from '../config'
import { useNow } from '../data/live'
import { fmtDuration, fmtUsd } from '../format'
import { DEFAULT_PARAMS, ECONOMIES, localUnlock, totalLoss } from '../model/loss'

/** When does the next unlocked-economy working day start? (for the "paused" message) */
function nextTick(now: number, startHour: number) {
  let best: { t: number; name: string } | null = null
  for (const e of ECONOMIES) {
    const unlock = localUnlock(e.tz)
    for (let d = 0; d < 7; d++) {
      const t = unlock + d * 86400 + startHour * 3600
      const wd = new Date((t + e.tz * 3600) * 1000).getUTCDay()
      if (t > now && wd !== 0 && wd !== 6) { if (!best || t < best.t) best = { t, name: e.name }; break }
    }
  }
  return best
}

const SLIDES = [
  'media/city-harbor-skyline-dusk.jpg',
  'media/miami-sunset-skyline-artwork-ultrawide.jpg',
  'media/beach-bridge-skyline-daytime.jpg',
  'media/beach-green-coupe-oceanfront.jpg',
]

const MOMENTS = [
  { label: 'New Zealand', sub: '00:00 NZDT', t: LAUNCH.nz, color: 'var(--teal)' },
  { label: 'Europe', sub: '00:00 CET', t: LAUNCH.eu, color: 'var(--gold)' },
  { label: 'United States', sub: '00:00 EST', t: LAUNCH.us, color: 'var(--pink)' },
]

export function Hero({ lossParams }: { lossParams: typeof DEFAULT_PARAMS }) {
  const now = useNow(100) / 1000
  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 9000)
    return () => clearInterval(id)
  }, [])
  const loss = totalLoss(lossParams, now)
  const since = now - T0

  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden>
        {SLIDES.map((src, i) => (
          <div key={src} className={`hero__slide ${i === slide ? 'is-on' : ''}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
        <div className="hero__shade" />
        <div className="hero__grid" />
      </div>

      <div className="hero__inner">
        <div className="hero__eyebrow">
          <span className="live-dot" /> LIVE · Fan-made data project · Not affiliated with Rockstar Games
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

        <a className="loss" href="#loss">
          <div className="loss__label">Estimated global productivity lost <span className="badge badge--warn">model estimate</span></div>
          <div className="loss__value num">{fmtUsd(loss.total)}</div>
          <div className="loss__rate">
            {loss.rate > 0 ? <>+{fmtUsd(loss.rate)} every second right now · working hours are underway somewhere</> : (() => {
              const n = nextTick(now, lossParams.workStart)
              return n ? <>Starts ticking when offices open in {n.name} — in {fmtDuration(n.t - now)}</> : <>Paused outside working hours</>
            })()}
            <span className="loss__how"> · see how it's calculated ↓</span>
          </div>
        </a>
      </div>
    </section>
  )
}
