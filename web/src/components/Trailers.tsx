import { useState } from 'react'

// Official trailers published by Rockstar Games on YouTube before launch. Nothing plays until you click.
const TRAILERS = [
  { id: 'QdBZY2fkU-0', title: 'Trailer 1', date: 'December 2023', poster: 'media/beach-bridge-skyline-daytime.jpg' },
  { id: 'VQRLujxTm3c', title: 'Trailer 2', date: 'May 2025', poster: 'media/city-harbor-skyline-dusk.jpg' },
]

export function Trailers() {
  const [playing, setPlaying] = useState<string | null>(null)
  return (
    <section className="section" id="trailers">
      <div className="section__head">
        <div className="kicker">From Rockstar Games</div>
        <h2>The official trailers</h2>
        <p className="section__intro">The two pre-launch trailers, exactly as Rockstar published them. Click to load — nothing plays on its own.</p>
      </div>
      <div className="trailers">
        {TRAILERS.map((t) => (
          <div key={t.id} className="trailer panel">
            {playing === t.id ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${t.id}?autoplay=1&rel=0`}
                title={`Grand Theft Auto VI ${t.title}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
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
