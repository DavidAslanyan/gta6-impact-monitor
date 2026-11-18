import { LAUNCH, REPO_URL } from '../config'
import { useData } from '../data/store'
import { fmtAgo, fmtUtc } from '../format'
import { SIGNALS } from '../signals'

export function Methodology() {
  const data = useData()
  const health = Object.entries(data.health).sort(([a], [b]) => a.localeCompare(b))
  const sources = [...new Map(SIGNALS.map((s) => [s.source, s])).values()]
  return (
    <section className="section" id="method">
      <div className="section__head">
        <div className="kicker">How this works</div>
        <h2>Methodology & sources</h2>
      </div>
      <div className="method">
        <div className="panel prose">
          <h3>What is measured</h3>
          <p>
            Every chart is a <b>Signal</b>: a real, time-stamped series from a public source, recorded by this project.
            Nothing is simulated or invented. The only modelled number on the page is the <b>Estimated Loss</b>, and it is labelled as such.
          </p>
          <h3>Launch Moments</h3>
          <p>
            The game unlocks at midnight local time. We mark three moments: New Zealand ({fmtUtc(LAUNCH.nz)}, the first unlock anywhere),
            Europe ({fmtUtc(LAUNCH.eu)}) and the United States ({fmtUtc(LAUNCH.us)}). Each Signal has a <b>home region</b>, and its
            Baseline ends at that region's Launch Moment.
          </p>
          <h3>Baseline and Delta</h3>
          <p>
            The <b>Baseline</b> is what a Signal did before launch. Where four weeks of history exist, each new reading is compared
            with the <i>median</i> of the same weekday and local hour over those four weeks; otherwise with the same local hour of day, and
            otherwise with the pre-launch median — every card says which. Medians and a robust spread (scaled median absolute deviation)
            are used so a single glitchy reading cannot distort the Baseline. Prices are compared with their last pre-launch value. Daily
            series count launch day as "after". The dashed line and grey band on each chart are the Baseline's expectation ± that spread.
            The <b>Delta</b> is the percentage gap; temperatures show the gap in °C.
          </p>
          <h3>Correlation, not causation</h3>
          <p>
            We show what changed around the launch; we don't claim GTA VI caused any particular move. Weather, holidays (shaded on the charts),
            news and markets all move these numbers too. That is why the <b>Control Signals</b> section exists: if things that should not care
            about a video game move as much as everything else, be sceptical.
          </p>
          <h3>Some sources keep no history</h3>
          <p>
            Steam, Roblox, Kick, bike-share docks, PlayStation status and the live-stream rates only exist "now", so their Baselines are
            the readings we recorded ourselves before each Launch Moment — sometimes only hours. Cards say how many hours of pre-launch data they have.
          </p>
          <h3>Zero spoilers</h3>
          <p>
            This page only ever shows numbers. It never displays posts, headlines, titles or any other text written by other people,
            and all imagery is official pre-launch media published by Rockstar Games.
          </p>
          <h3>How it runs</h3>
          <p>
            A GitHub Actions job records every Signal every 5 minutes (GitHub may delay scheduled runs) and commits the readings to the
            repository's <code>data</code> branch; this static page reads them, plus a few feeds streamed straight to your browser. Code and data:{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">{REPO_URL.replace('https://', '')}</a>.
          </p>
        </div>
        <div className="panel">
          <h3 className="panel__title">Collector health</h3>
          <p className="fine">Last successful reading of each collector job. Unofficial sources can break without notice; their history is kept.</p>
          <ul className="health">
            {health.map(([k, h]) => (
              <li key={k} className={h.ok ? 'ok' : 'bad'}>
                <span className="dot" /> <span className="health__name">{k}</span>
                {h.unofficial && <span className="badge badge--warn">unofficial</span>}
                <span className="health__when">{h.ok ? (h.lastOk ? fmtAgo(h.lastOk) : '') : `unavailable since ${h.failingSince ? fmtUtc(h.failingSince) : '?'}`}</span>
              </li>
            ))}
          </ul>
          <h3 className="panel__title" style={{ marginTop: 24 }}>Sources</h3>
          <ul className="sources">
            {sources.map((s) => (
              <li key={s.source}><a href={s.sourceUrl} target="_blank" rel="noreferrer">{s.source}</a>{s.unofficial && <span className="badge badge--warn">unofficial</span>}</li>
            ))}
            <li><a href="https://jetstream.atproto.tools/" target="_blank" rel="noreferrer">Bluesky Jetstream (live)</a></li>
            <li><a href="https://stream.wikimedia.org/?doc" target="_blank" rel="noreferrer">Wikimedia EventStreams (live)</a></li>
            <li><a href="https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams" target="_blank" rel="noreferrer">Binance WebSocket (live)</a></li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <b>GTA VI Global Impact Monitor</b> is an independent open-data research project. Grand Theft Auto and GTA VI are
        trademarks of Take-Two Interactive Software, Inc. This project is not affiliated with or endorsed by Take-Two Interactive
        or Rockstar Games. Game artwork is official pre-launch media published by Rockstar Games, shown credited and unaltered.
      </div>
      <div className="footer__meta">
        All data comes from the public sources listed above, each under its own terms, and every series can be downloaded. Correlation is not causation. ·{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer">Source code & raw data</a> · © 2026 Davit Aslanyan
      </div>
    </footer>
  )
}
