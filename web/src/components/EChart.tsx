import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, MapChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, DataZoomComponent,
  LegendComponent, VisualMapComponent, GeoComponent, TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, BarChart, MapChart, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent,
  DataZoomComponent, LegendComponent, VisualMapComponent, GeoComponent, TitleComponent, CanvasRenderer,
])

export { echarts }

interface Props {
  option: echarts.EChartsCoreOption
  height: number | string
  className?: string
  /** When true, merges the option into the existing chart (cheap updates for live data). */
  merge?: boolean
}

export function EChart({ option, height, className, merge = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const c = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    chart.current = c
    const ro = new ResizeObserver(() => c.resize())
    ro.observe(ref.current)
    return () => { ro.disconnect(); c.dispose(); chart.current = null }
  }, [])

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: !merge, lazyUpdate: true })
  }, [option, merge])

  return <div ref={ref} className={className} style={{ height, width: '100%' }} />
}
