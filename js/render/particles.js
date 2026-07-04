// The exoplanet particle field: every confirmed planet with a known distance
// becomes a dot that streams past during the interstellar stretch. Size from
// radius, color from equilibrium temperature, position from real distance.

import { mulberry32, between } from './rand.js'
import { LY } from '../scale.js'

function tempColor(k) {
  if (k == null) return '#8a93a8'
  if (k < 150) return '#7f9fe8'
  if (k < 300) return '#cdd9e8'
  if (k < 700) return '#e8c48a'
  if (k < 1500) return '#e8945c'
  return '#e05c4a'
}

export class Field {
  // planets: [name, dist_ly, radius_earths, eq_temp_K, disc_year, method]
  constructor(canvas, planets, scale, layout) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.layout = layout // { journeyHeight, titleH } — px
    this.scrollY = 0
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const rng = mulberry32(777)
    this.particles = planets
      .filter(p => p[1] != null)
      .map(p => {
        const [name, ly, rade, teq] = p
        return {
          name,
          ly,
          rade,
          teq,
          // journey-relative y set in relayout(); x is a stable fraction
          fx: rng(),
          jitter: (rng() + rng() - 1) * 0.5, // vertical scatter, viewport units
          r: rade == null ? 1 : Math.min(0.6 + 0.4 * Math.sqrt(rade), 3.2),
          color: tempColor(teq),
          alpha: between(rng, 0.35, 0.95),
          frac: scale.fractionAtDistance(ly * LY),
        }
      })
      .sort((a, b) => a.frac - b.frac)

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.width = this.w * dpr
    this.canvas.height = this.h * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.relayout()
  }

  relayout() {
    const { journeyHeight, titleH } = this.layout
    for (const pt of this.particles) {
      pt.y = titleH + pt.frac * journeyHeight + pt.jitter * this.h
      pt.x = pt.fx * this.w
    }
    this.ys = this.particles.map(p => p.y)
  }

  setScroll(y) {
    this.scrollY = y
  }

  // binary search: index of first particle with y >= v
  lower(v) {
    let lo = 0, hi = this.ys.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (this.ys[mid] < v) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  passedCount() {
    return this.lower(this.scrollY + this.h / 2)
  }

  draw(t) {
    const { ctx, w, h } = this
    ctx.clearRect(0, 0, w, h)
    const from = this.lower(this.scrollY - 20)
    const to = this.lower(this.scrollY + h + 20)
    for (let i = from; i < to; i++) {
      const pt = this.particles[i]
      const sy = pt.y - this.scrollY
      const tw = this.reduced ? 1 : 0.8 + 0.2 * Math.sin(i * 1.7 + t / 1100)
      ctx.globalAlpha = pt.alpha * tw
      ctx.fillStyle = pt.color
      ctx.beginPath()
      ctx.arc(pt.x, sy, pt.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // nearest particle to a screen point, within maxPx
  hitTest(sx, sy, maxPx = 26) {
    const from = this.lower(this.scrollY + sy - maxPx)
    const to = this.lower(this.scrollY + sy + maxPx)
    let best = null
    let bestD = maxPx * maxPx
    for (let i = from; i < to; i++) {
      const pt = this.particles[i]
      const dx = pt.x - sx
      const dy = pt.y - this.scrollY - sy
      const d = dx * dx + dy * dy
      if (d < bestD) { bestD = d; best = pt }
    }
    return best
  }
}
