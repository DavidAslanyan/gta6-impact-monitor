import { useEffect, useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { useNow } from '../data/live'
import { C } from '../theme'
import { EChart, echarts } from './EChart'

// Late-November UTC offsets (southern-hemisphere summer time included). Countries not listed fall back to
// their centroid longitude / 15 — good enough for a map whose job is to show the wave moving west.
const OFFSETS: Record<string, number> = {
  'New Zealand': 13, Fiji: 12, Australia: 11, 'Papua New Guinea': 10, Japan: 9, 'South Korea': 9, 'North Korea': 9,
  China: 8, Taiwan: 8, Philippines: 8, Malaysia: 8, Singapore: 8, Mongolia: 8, Indonesia: 7, Thailand: 7, Vietnam: 7,
  Cambodia: 7, Laos: 7, Myanmar: 6.5, Bangladesh: 6, Kazakhstan: 5, India: 5.5, 'Sri Lanka': 5.5, Nepal: 5.75,
  Pakistan: 5, Uzbekistan: 5, Afghanistan: 4.5, 'United Arab Emirates': 4, Oman: 4, Iran: 3.5, 'Saudi Arabia': 3,
  Russia: 3, Turkey: 3, Iraq: 3, Kuwait: 3, Qatar: 3, Israel: 2, Egypt: 2, Ukraine: 2, Greece: 2, Finland: 2,
  Romania: 2, Bulgaria: 2, 'South Africa': 2, Poland: 1, Germany: 1, France: 1, Spain: 1, Italy: 1, Netherlands: 1,
  Belgium: 1, Sweden: 1, Norway: 1, Denmark: 1, Austria: 1, Switzerland: 1, Czechia: 1, Hungary: 1, Nigeria: 1,
  'United Kingdom': 0, Ireland: 0, Portugal: 0, Iceland: 0, Morocco: 1, Brazil: -3, Argentina: -3, Uruguay: -3,
  Chile: -3, Paraguay: -3, Bolivia: -4, Venezuela: -4, Colombia: -5, Peru: -5, Ecuador: -5, Cuba: -5,
  'United States of America': -5, Canada: -5, Mexico: -6, Guatemala: -6, Greenland: -2,
}

let registered = false

export function UnlockMap() {
  const [ready, setReady] = useState(registered)
  const [offsets, setOffsets] = useState<Record<string, number>>({})
  const tick = useNow(30000) / 1000
  // After the last unlock (UTC−12, 19 Nov 12:00Z) the map is final: freeze the clock so it stops re-rendering.
  const now = Math.min(tick, Date.UTC(2026, 10, 19, 13) / 1000)
  const mapHeight = typeof window !== 'undefined' && window.innerWidth < 720 ? 250 : 460

  useEffect(() => {
    if (registered) return
    import('world-atlas/countries-110m.json').then((m) => {
      const topo = m.default as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
      const geo = feature(topo, topo.objects.countries) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>
      // Drop shapes that straddle the antimeridian or carry no population (they draw stray lines across the map).
      geo.features = geo.features.filter((f) => !['Antarctica', 'Fiji', 'Fr. S. Antarctic Lands'].includes(f.properties.name))
      // Outlines that cross the 180° meridian (Russia's Chukotka, Alaska's Aleutians) draw a band across the whole map.
      // Fix each such ring by moving its stray points to the side of the antimeridian where most of the ring lies.
      const fixRing = (ring: number[][]) => {
        const lons = ring.map((p) => p[0])
        if (Math.max(...lons) - Math.min(...lons) < 180) return ring
        const east = lons.filter((x) => x > 0).length >= lons.length / 2
        return ring.map(([x, y]) => [east ? (x < 0 ? 180 : x) : (x > 0 ? -180 : x), y])
      }
      for (const f of geo.features) {
        const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
        if (g.type === 'Polygon') g.coordinates = g.coordinates.map(fixRing)
        else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map((poly) => poly.map(fixRing))
      }
      const offs: Record<string, number> = {}
      for (const f of geo.features) {
        const name = f.properties.name
        if (name in OFFSETS) { offs[name] = OFFSETS[name]; continue }
        // Fallback: mean longitude of the outline.
        let sum = 0, n = 0
        const walk = (c: unknown): void => { if (Array.isArray(c) && typeof c[0] === 'number') { sum += c[0] as number; n++ } else if (Array.isArray(c)) c.forEach(walk) }
        walk((f.geometry as GeoJSON.Polygon).coordinates)
        offs[name] = Math.round((sum / Math.max(n, 1)) / 15)
      }
      echarts.registerMap('world', geo as never)
      registered = true
      setOffsets(offs)
      setReady(true)
    })
  }, [])

  const { option, unlocked, total, next } = useMemo(() => {
    const entries = Object.entries(offsets)
    const data = entries.map(([name, tz]) => {
      const unlock = Date.UTC(2026, 10, 19) / 1000 - tz * 3600
      const d = now - unlock
      return { name, value: d >= 0 ? 2 : d > -3 * 3600 ? 1 : 0, unlock }
    })
    const upcoming = data.filter((d) => d.value < 2).sort((a, b) => a.unlock - b.unlock)
    const opt = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item', backgroundColor: 'rgba(16,9,34,0.95)', borderColor: 'rgba(255,95,162,0.4)', textStyle: { color: C.text },
        formatter: (p: { name: string; data?: { unlock: number; value: number } }) => {
          if (!p.data) return p.name
          const when = new Date(p.data.unlock * 1000).toISOString().slice(5, 16).replace('T', ' ')
          return `<b>${p.name}</b><br/>${p.data.value === 2 ? 'Unlocked' : 'Unlocks'} at ${when} UTC`
        },
      },
      visualMap: {
        type: 'piecewise', show: false, dimension: 0,
        pieces: [
          { value: 2, color: C.pink },
          { value: 1, color: C.gold },
          { value: 0, color: '#2a1d4d' },
        ],
      },
      series: [{
        type: 'map', map: 'world', roam: false, data, left: 8, right: 8, top: 56, bottom: 8,
        itemStyle: { borderColor: 'rgba(13,8,32,0.9)', borderWidth: 0.5, areaColor: '#2a1d4d' },
        emphasis: { label: { show: false }, itemStyle: { areaColor: C.teal } },
        select: { disabled: true },
      }],
    }
    return { option: opt, unlocked: data.filter((d) => d.value === 2).length, total: data.length, next: upcoming[0] }
  }, [offsets, now])

  return (
    <section className="section" id="wave">
      <div className="section__head">
        <div className="kicker">The unlock wave</div>
        <h2>Midnight, country by country</h2>
        <p className="section__intro">
          GTA VI unlocks at midnight local time, so launch rolls west around the planet for ~19 hours — New Zealand first,
          then Australia, Asia, Europe and finally the Americas. <span className="pink">Pink</span> = unlocked,{' '}
          <span className="gold">gold</span> = within 3 hours.
        </p>
      </div>
      <div className="panel map-panel">
        <div className="map-stats">
          <div><div className="stat-num num">{unlocked}<small>/{total}</small></div><div className="stat-label">countries unlocked</div></div>
          {next ? (
            <div><div className="stat-num num">{new Date(next.unlock * 1000).toISOString().slice(11, 16)} <small>UTC</small></div><div className="stat-label">next: {next.name}</div></div>
          ) : (
            <div><div className="stat-num num">100%</div><div className="stat-label">of the world has the game</div></div>
          )}
        </div>
        {ready ? <EChart option={option} height={mapHeight} /> : <div className="card__empty" style={{ height: mapHeight }}>Loading map…</div>}
      </div>
    </section>
  )
}
