import { useEffect, useState } from 'react'
import { AnomalyFeed, SignalSection } from './components/Sections'
import { Hero } from './components/Hero'
import { LivePulse } from './components/LivePulse'
import { LossModel } from './components/LossModel'
import { Footer, Methodology } from './components/Methodology'
import { Author } from './components/Author'
import { Ticker } from './components/Ticker'
import { Trailers } from './components/Trailers'
import { UnlockMap } from './components/UnlockMap'
import { useData } from './data/store'
import { fmtAgo } from './format'
import { DEFAULT_PARAMS, type LossParams } from './model/loss'
import { RangeContext, type Range } from './theme'

const NAV = [
  ['pulse', 'Live'], ['timeline', 'Timeline'], ['wave', 'Unlock wave'], ['attention', 'Cause'], ['games', 'Games'],
  ['productivity', 'Work'], ['study', 'School'], ['commute', 'Commute'], ['markets', 'Markets'], ['crypto', 'Crypto'],
  ['energy', 'Grid'], ['mobility', 'Streets'], ['radar', 'Radar'], ['status', 'Load'], ['control', 'Controls'],
  ['loss', 'Scenario'], ['method', 'Method'],
] as const

function readParams(): LossParams {
  try { return { ...DEFAULT_PARAMS, ...JSON.parse(localStorage.getItem('lossParams') || '{}') } } catch { return DEFAULT_PARAMS }
}

export default function App() {
  const [range, setRange] = useState<Range>('7d')
  const [lossParams, setLossParams] = useState<LossParams>(readParams)
  useEffect(() => { try { localStorage.setItem('lossParams', JSON.stringify(lossParams)) } catch { /* private mode */ } }, [lossParams])
  const data = useData()

  return (
    <RangeContext.Provider value={{ range, setRange }}>
      <Ticker />
      <Hero />
      <nav className="nav">
        <div className="nav__inner">
          <a href="#top" className="nav__brand"><img src="media/logo-vi.png" alt="" /> Impact Monitor</a>
          <div className="nav__links">{NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</div>
          <div className="nav__range" role="group" aria-label="Chart range">
            {(['48h', '7d', '30d'] as Range[]).map((r) => (
              <button key={r} className={r === range ? 'is-on' : ''} onClick={() => setRange(r)}>{r === '30d' ? 'all' : r}</button>
            ))}
          </div>
          <div className="nav__fresh" title="When the collector last published data">
            {data.error ? <span className="down">data offline</span> : data.generated ? <>data {fmtAgo(data.generated)}</> : 'loading…'}
          </div>
        </div>
      </nav>
      <main>
        <LivePulse />
        <AnomalyFeed />
        <UnlockMap />
        <SignalSection group="attention" />
        <SignalSection group="games" />
        <SignalSection group="productivity" />
        <SignalSection group="study" />
        <SignalSection group="commute" />
        <SignalSection group="markets" />
        <SignalSection group="crypto" />
        <SignalSection group="energy" />
        <SignalSection group="mobility" />
        <SignalSection group="radar" />
        <SignalSection group="status" />
        <SignalSection group="control" />
        <LossModel params={lossParams} setParams={setLossParams} />
        <Trailers />
        <Methodology />
        <Author />
      </main>
      <Footer />
    </RangeContext.Provider>
  )
}
