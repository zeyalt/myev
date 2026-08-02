import type { Plugin } from 'chart.js'

export const chartAnimOpts = { duration: 600, easing: 'easeInOutQuart' as const }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tooltipOpts: any = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  borderColor: 'rgba(0,212,255,0.4)',
  borderWidth: 1,
  padding: 10,
  titleColor: '#e6ebf5',
  bodyColor: '#94a3b8',
  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
  titleFont: { family: "'Outfit', sans-serif", weight: 600 },
  cornerRadius: 8,
  displayColors: true,
}

export const legendOpts = {
  position: 'bottom' as const,
  labels: {
    color: '#94a3b8',
    usePointStyle: true,
    pointStyle: 'circle' as const,
    font: { family: "'Outfit', sans-serif", size: 11 },
    padding: 14,
  },
}

export const gridOpts = {
  color: 'rgba(148,163,184,0.08)',
  drawTicks: false,
}

export const tickOpts = {
  color: '#64748b',
  font: { family: "'JetBrains Mono', monospace", size: 10 },
}

/** Draws total value text in the center of a doughnut chart. */
export function makeCenterTextPlugin(getText: () => { label: string; value: string }): Plugin<'doughnut'> {
  return {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const { label, value } = getText()
      const cx = (chartArea.left + chartArea.right) / 2
      const cy = (chartArea.top + chartArea.bottom) / 2
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#e6ebf5'
      ctx.font = "600 20px 'Outfit', sans-serif"
      ctx.fillText(value, cx, cy - 8)
      ctx.fillStyle = '#64748b'
      ctx.font = "500 11px 'Outfit', sans-serif"
      ctx.fillText(label, cx, cy + 14)
      ctx.restore()
    },
  }
}

/** Dashed threshold lines (e.g. 80%/20% battery bounds) drawn over a bar/line chart. */
export function makeThresholdLinesPlugin(
  thresholds: { value: number; color: string; yScaleId?: string }[],
): Plugin<'bar'> {
  return {
    id: 'thresholdLines',
    afterDraw(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      for (const t of thresholds) {
        const scale = chart.scales[t.yScaleId ?? 'y']
        if (!scale) continue
        const y = scale.getPixelForValue(t.value)
        ctx.save()
        ctx.strokeStyle = t.color
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(chartArea.left, y)
        ctx.lineTo(chartArea.right, y)
        ctx.stroke()
        ctx.restore()
      }
    },
  }
}
