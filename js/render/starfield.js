// Parallax starfield on a fixed full-viewport canvas.
// makeStars is pure (node-testable); Starfield owns the canvas + rAF loop.

import { mulberry32, between } from './rand.js'

const TINTS = ['#ffffff', '#dbe7ff', '#ffe9d0', '#c8d8ff', '#fff4e0']

// Stars live in a tile 2x the viewport tall; parallax wraps within the tile.
export function makeStars(seed, count, w, h) {
  const rng = mulberry32(seed)
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * w,
      y: rng() * h,
      r: between(rng, 0.4, 1) ** 2, // bias small
      alpha: between(rng, 0.25, 1),
      phase: rng() * Math.PI * 2,
      tint: TINTS[Math.floor(rng() * TINTS.length)],
    })
  }
  return stars
}

const LAYERS = [
  { speed: 0.1, densityPer100kPx: 3.2, rScale: 1.0 }, // far
  { speed: 0.26, densityPer100kPx: 2.0, rScale: 1.7 }, // mid
  { speed: 0.52, densityPer100kPx: 0.9, rScale: 2.6 }, // near
]

export class Starfield {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.scrollY = 0
    this.progress = 0 // 0..1 through the journey — deep space gets denser
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.shooting = null
    this.nextShot = performance.now() + 4000
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
    this.tileH = this.h * 2
    this.layers = LAYERS.map((l, i) => ({
      ...l,
      stars: makeStars(1234 + i * 977, Math.round((this.w * this.tileH * l.densityPer100kPx) / 100000), this.w, this.tileH),
    }))
    this.draw(performance.now())
  }

  setScroll(y, progress) {
    this.scrollY = y
    this.progress = progress
    if (this.reduced) this.draw(performance.now())
  }

  start() {
    if (this.reduced) { this.draw(performance.now()); return }
    const loop = t => {
      this.draw(t)
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  draw(t) {
    const { ctx, w, h, tileH } = this
    ctx.clearRect(0, 0, w, h)

    // stars fade in as you leave the Sun's glare, thicken in the deep field
    const visibility = 0.45 + 0.55 * Math.min(this.progress * 10, 1)
    const deep = Math.max(0, (this.progress - 0.55) / 0.45)

    for (const layer of this.layers) {
      const off = this.scrollY * layer.speed
      for (const s of layer.stars) {
        const y = (((s.y - off) % tileH) + tileH) % tileH
        if (y > h + 4) continue
        const tw = this.reduced ? 1 : 0.75 + 0.25 * Math.sin(s.phase + t / 900)
        ctx.globalAlpha = s.alpha * tw * visibility * (0.85 + 0.3 * deep)
        ctx.fillStyle = s.tint
        const r = s.r * layer.rScale * (1 + 0.35 * deep)
        ctx.fillRect(s.x - r / 2, y - r / 2, r, r)
      }
    }
    ctx.globalAlpha = 1

    if (!this.reduced) this.drawShootingStar(t)
  }

  drawShootingStar(t) {
    if (!this.shooting && t > this.nextShot && this.progress > 0.05) {
      const rng = mulberry32(Math.floor(t))
      this.shooting = {
        x: between(rng, 0.1, 0.9) * this.w,
        y: between(rng, 0.05, 0.4) * this.h,
        dx: between(rng, -1, 1) > 0 ? 1 : -1,
        born: t,
      }
      this.nextShot = t + between(rng, 6000, 14000)
    }
    if (!this.shooting) return
    const age = (t - this.shooting.born) / 700 // 0..1 life
    if (age >= 1) { this.shooting = null; return }
    const { ctx } = this
    const len = 90
    const px = this.shooting.x + this.shooting.dx * age * 220
    const py = this.shooting.y + age * 90
    const grad = ctx.createLinearGradient(px, py, px - this.shooting.dx * len, py - len * 0.4)
    grad.addColorStop(0, `rgba(255,255,255,${0.7 * (1 - age)})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px - this.shooting.dx * len, py - len * 0.4)
    ctx.stroke()
  }
}
