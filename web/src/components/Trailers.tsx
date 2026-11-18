import { useCallback, useEffect, useRef, useState } from 'react'

// Official trailers published by Rockstar Games on YouTube before launch. Nothing plays until you click.
// Zero-spoiler guard: YouTube shows suggested videos (possibly post-launch ones) when a video is paused or ends.
// We drive the player through the IFrame API: on pause we cover the player with our own overlay, and when the
// video ends we swap the player back to our poster, so YouTube's suggestion screens are never visible.
const TRAILERS = [
  { id: 'QdBZY2fkU-0', title: 'Trailer 1', date: 'December 2023', poster: 'media/beach-bridge-skyline-daytime.jpg' },
  { id: 'VQRLujxTm3c', title: 'Trailer 2', date: 'May 2025', poster: 'media/city-harbor-skyline-dusk.jpg' },
]

interface YTPlayer { playVideo(): void; destroy(): void }
interface YTNamespace { Player: new (el: HTMLElement, opts: object) => YTPlayer; PlayerState: { ENDED: number; PLAYING: number; PAUSED: number } }
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

let apiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT!)
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    })
  }
  return apiPromise
}

function Player({ id, title, onEnd }: { id: string; title: string; onEnd: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !host.current) return
      player.current = new YT.Player(host.current, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.ENDED) onEnd()
            else setPaused(e.data === YT.PlayerState.PAUSED)
          },
        },
      })
    })
    return () => { cancelled = true; player.current?.destroy() }
  }, [id, onEnd])

  return (
    <div className="trailer__player">
      <div ref={host} title={`Grand Theft Auto VI ${title}`} />
      {paused && (
        <div className="trailer__pause">
          <button onClick={() => player.current?.playVideo()}>▶ Resume</button>
          <button className="ghost" onClick={onEnd}>Close</button>
        </div>
      )}
    </div>
  )
}

export function Trailers() {
  const [playing, setPlaying] = useState<string | null>(null)
  const stop = useCallback(() => setPlaying(null), [])
  return (
    <section className="section" id="trailers">
      <div className="section__head">
        <div className="kicker">From Rockstar Games</div>
        <h2>The official trailers</h2>
        <p className="section__intro">The two pre-launch trailers, exactly as Rockstar published them. Click to load — nothing plays on its own, and the player closes itself when the trailer ends.</p>
      </div>
      <div className="trailers">
        {TRAILERS.map((t) => (
          <div key={t.id} className="trailer panel">
            {playing === t.id ? (
              <Player id={t.id} title={t.title} onEnd={stop} />
            ) : (
              <button className="trailer__poster" style={{ backgroundImage: `url(${t.poster})` }} onClick={() => setPlaying(t.id)}>
                <span className="trailer__play">▶</span>
                <span className="trailer__label">Grand Theft Auto VI — {t.title}<small>{t.date} · Rockstar Games on YouTube</small></span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
