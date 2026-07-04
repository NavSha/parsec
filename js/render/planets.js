// Procedural planet painter. Every world is drawn, not downloaded.
// visualFor(id, px) → <canvas> (or null for stops with no visual).

import { mulberry32, between } from './rand.js'

const SPECS = {
  sun: { type: 'star', palette: ['#fff7e8', '#ffd98a', '#ff9d3d'] },
  mercury: { type: 'rocky', palette: ['#9a9187', '#6e675f'], speckle: 900, seed: 11 },
  venus: { type: 'rocky', palette: ['#e8cf9e', '#c9a86a'], haze: '#f4e3bd', bands: 5, seed: 12 },
  earth: { type: 'rocky', palette: ['#3a6db5', '#2c4f86'], patches: '#4b8a4e', cap: '#eef4f8', clouds: true, moon: true, glow: '#7fb2ff', seed: 13 },
  mars: { type: 'rocky', palette: ['#b5643c', '#8a4a2c'], speckle: 400, cap: '#e8dcd2', glow: '#d98a63', seed: 14 },
  jupiter: { type: 'gas', palette: ['#d8b48f', '#b08a64', '#e8d4b8', '#a9764f'], bands: 9, spot: '#c25b3f', seed: 15 },
  saturn: { type: 'gas', palette: ['#e2c896', '#c9ae78', '#efe0bc'], bands: 7, ring: { tilt: -0.32, color: '#d9c49a' }, seed: 16 },
  uranus: { type: 'ice', palette: ['#aee3e8', '#7fc4cf'], bands: 2, glow: '#bdeef2', seed: 17 },
  neptune: { type: 'ice', palette: ['#3f6de0', '#2c4bb0'], bands: 3, spot: '#2a3f8f', glow: '#5f8aff', seed: 18 },
  pluto: { type: 'rocky', palette: ['#c4a986', '#96765a'], patches: '#e3d3c0', speckle: 200, seed: 19 },
  heliopause: { type: 'threshold' },
  'voyager-1': { type: 'probe' },
  'proxima-b': { type: 'exo', palette: ['#8f5a4a', '#5c3a33'], rim: '#ff8a5c', seed: 21 },
  'barnards-b': { type: 'exo', palette: ['#7a6a5f', '#4d423b'], rim: '#d98a63', seed: 22 },
  'trappist-1': { type: 'system', seed: 23 },
  'pso-j318': { type: 'exo', palette: ['#3a3f4d', '#22242e'], rim: '#6a7390', dim: true, seed: 28 },
  'wasp-76b': { type: 'exo', palette: ['#d97a3f', '#8f3a24'], rim: '#ffc46b', molten: true, seed: 24 },
  'kepler-452b': { type: 'exo', palette: ['#5f8a5a', '#3f5f7a'], rim: '#cfe8a8', seed: 25 },
  sweeps: { type: 'exo', palette: ['#5a5f7a', '#3a3f52'], rim: '#8a93c4', dim: true, seed: 26 },
  finale: { type: 'galaxy', seed: 27 },
}

export function visualFor(id, px) {
  const spec = SPECS[id]
  if (!spec) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const pad =
    spec.type === 'system' ? 2.4
    : spec.type === 'star' || spec.type === 'galaxy' ? 1.9
    : spec.ring || spec.moon ? 2.1
    : 1.35
  const size = Math.round(px * pad)
  const c = document.createElement('canvas')
  c.width = size * dpr
  c.height = size * dpr
  c.style.width = `${size}px`
  c.style.height = `${size}px`
  const ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const cx = size / 2, cy = size / 2, r = px / 2

  const painters = {
    star: paintStar, rocky: paintSphere, gas: paintSphere, ice: paintSphere,
    exo: paintExo, system: paintSystem, probe: paintProbe,
    galaxy: paintGalaxy, threshold: paintThreshold,
  }
  painters[spec.type](ctx, spec, cx, cy, r)
  return c
}

function sphereClip(ctx, cx, cy, r, fn) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  fn()
  ctx.restore()
}

function paintBase(ctx, cx, cy, r, palette) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r * 1.05)
  g.addColorStop(0, palette[0])
  g.addColorStop(1, palette[1])
  ctx.fillStyle = g
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
}

function paintBands(ctx, spec, cx, cy, r, rng) {
  const n = spec.bands
  for (let i = 0; i < n; i++) {
    const yc = cy - r + ((i + 0.5) / n) * 2 * r
    const bandH = (2 * r) / n * between(rng, 0.55, 0.95)
    const color = spec.palette[2 + (i % Math.max(spec.palette.length - 2, 1))] ?? spec.palette[i % 2]
    ctx.globalAlpha = between(rng, 0.18, 0.4)
    ctx.fillStyle = color
    ctx.beginPath()
    const wob = between(rng, 2, 6)
    const ph = rng() * Math.PI * 2
    ctx.moveTo(cx - r, yc - bandH / 2)
    for (let x = -r; x <= r; x += 6) {
      ctx.lineTo(cx + x, yc - bandH / 2 + Math.sin(x / (r / 3) + ph) * wob)
    }
    for (let x = r; x >= -r; x -= 6) {
      ctx.lineTo(cx + x, yc + bandH / 2 + Math.sin(x / (r / 3.4) + ph * 1.7) * wob)
    }
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function paintLimb(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.35, cx, cy, r * 1.02)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(0.72, 'rgba(0,0,0,0.06)')
  g.addColorStop(1, 'rgba(2,4,10,0.62)')
  ctx.fillStyle = g
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
}

function paintGlowRing(ctx, cx, cy, r, color, strength = 0.5) {
  ctx.save()
  ctx.globalAlpha = strength
  ctx.shadowColor = color
  ctx.shadowBlur = r * 0.35
  ctx.strokeStyle = color
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function paintSphere(ctx, spec, cx, cy, r) {
  const rng = mulberry32(spec.seed ?? 1)

  if (spec.ring) paintRing(ctx, spec, cx, cy, r, 'back')

  sphereClip(ctx, cx, cy, r, () => {
    paintBase(ctx, cx, cy, r, spec.palette)
    if (spec.bands) paintBands(ctx, spec, cx, cy, r, rng)
    if (spec.patches) {
      // irregular landmasses: clusters of overlapping soft blobs
      ctx.globalAlpha = 0.5
      ctx.fillStyle = spec.patches
      for (let i = 0; i < 6; i++) {
        const px = cx + between(rng, -0.6, 0.6) * r
        const py = cy + between(rng, -0.6, 0.6) * r
        for (let j = 0; j < 8; j++) {
          ctx.beginPath()
          ctx.ellipse(
            px + between(rng, -0.16, 0.16) * r, py + between(rng, -0.12, 0.12) * r,
            between(rng, 0.05, 0.14) * r, between(rng, 0.04, 0.1) * r,
            rng() * Math.PI, 0, Math.PI * 2
          )
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }
    if (spec.clouds) {
      ctx.globalAlpha = 0.16
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 9; i++) {
        ctx.beginPath()
        ctx.ellipse(
          cx + between(rng, -0.8, 0.8) * r, cy + between(rng, -0.8, 0.8) * r,
          between(rng, 0.2, 0.5) * r, between(rng, 0.03, 0.07) * r,
          between(rng, -0.25, 0.25), 0, Math.PI * 2
        )
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    if (spec.speckle) {
      for (let i = 0; i < spec.speckle; i++) {
        const a = between(rng, 0.04, 0.16)
        ctx.fillStyle = rng() > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.7})`
        const sr = between(rng, 0.4, 2.2)
        ctx.beginPath()
        ctx.arc(cx + between(rng, -1, 1) * r, cy + between(rng, -1, 1) * r, sr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    if (spec.cap) {
      ctx.globalAlpha = 0.55
      ctx.fillStyle = spec.cap
      ctx.beginPath()
      ctx.ellipse(cx, cy - r * 0.97, r * 0.34, r * 0.13, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    if (spec.haze) {
      ctx.globalAlpha = 0.25
      ctx.fillStyle = spec.haze
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.ellipse(cx + between(rng, -0.3, 0.3) * r, cy + (i - 1.5) * r * 0.4, r * 0.9, r * 0.16, between(rng, -0.1, 0.1), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    if (spec.spot) {
      ctx.globalAlpha = 0.8
      ctx.fillStyle = spec.spot
      ctx.beginPath()
      ctx.ellipse(cx + r * 0.3, cy + r * 0.28, r * 0.22, r * 0.13, -0.15, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    paintLimb(ctx, cx, cy, r)
  })

  if (spec.ring) paintRing(ctx, spec, cx, cy, r, 'front')
  if (spec.glow) paintGlowRing(ctx, cx, cy, r + 1, spec.glow, 0.4)

  if (spec.moon) {
    const mx = cx + r * 1.55, my = cy - r * 0.85, mr = r * 0.16
    sphereClip(ctx, mx, my, mr, () => {
      paintBase(ctx, mx, my, mr, ['#cfd2d8', '#8a8f99'])
      paintLimb(ctx, mx, my, mr)
    })
  }
}

function paintRing(ctx, spec, cx, cy, r, half) {
  const { tilt, color } = spec.ring
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(tilt)
  ctx.beginPath()
  // clip to the half of the ring plane behind or in front of the planet
  const H = r * 3
  ctx.rect(-H, half === 'back' ? -H : 0, H * 2, H)
  ctx.clip()
  for (const [rr, w, a] of [[1.45, 0.16, 0.55], [1.72, 0.1, 0.4], [1.92, 0.05, 0.25]]) {
    ctx.strokeStyle = color
    ctx.globalAlpha = a
    ctx.lineWidth = r * w
    ctx.beginPath()
    ctx.ellipse(0, 0, r * rr, r * rr * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function paintStar(ctx, spec, cx, cy, r) {
  const [core, mid, edge] = spec.palette
  for (const [rr, a] of [[2.1, 0.1], [1.6, 0.2], [1.25, 0.4]]) {
    const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * rr)
    g.addColorStop(0, mid)
    g.addColorStop(1, 'rgba(255,157,61,0)')
    ctx.globalAlpha = a
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r * rr, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.55, core)
  g.addColorStop(1, edge)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function paintExo(ctx, spec, cx, cy, r) {
  // rim-lit mystery worlds: mostly shadow, lit crescent on one side
  const rng = mulberry32(spec.seed ?? 2)
  sphereClip(ctx, cx, cy, r, () => {
    paintBase(ctx, cx, cy, r, spec.palette)
    if (spec.molten) {
      // glowing day-side veins
      ctx.globalAlpha = 0.5
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = i % 2 ? '#ffb35c' : '#ff7a3d'
        ctx.lineWidth = between(rng, 0.5, 1.6)
        ctx.beginPath()
        const x0 = cx - r + rng() * 1.1 * r, y0 = cy - r + rng() * 2 * r
        ctx.moveTo(x0, y0)
        ctx.quadraticCurveTo(x0 + between(rng, -20, 20), y0 + between(rng, -20, 20), x0 + between(rng, -40, 40), y0 + between(rng, -30, 30))
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    // heavy terminator shadow — these are worlds seen from deep space
    const sh = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
    sh.addColorStop(0, 'rgba(2,4,10,0)')
    sh.addColorStop(0.45, `rgba(2,4,10,${spec.dim ? 0.75 : 0.45})`)
    sh.addColorStop(1, 'rgba(2,4,10,0.92)')
    ctx.fillStyle = sh
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    paintLimb(ctx, cx, cy, r)
  })
  // lit rim on the star-facing side
  ctx.save()
  ctx.strokeStyle = spec.rim
  ctx.shadowColor = spec.rim
  ctx.shadowBlur = r * 0.3
  ctx.lineWidth = 1.6
  ctx.globalAlpha = spec.dim ? 0.5 : 0.9
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI * 0.62, Math.PI * 1.42)
  ctx.stroke()
  ctx.restore()
}

function paintSystem(ctx, spec, cx, cy, r) {
  // TRAPPIST-1: a dim red star and its seven worlds strung in a line
  const rng = mulberry32(spec.seed)
  const sy = cy
  const starR = r * 0.3
  const sx = cx - r * 1.05
  const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, starR * 2.4)
  g.addColorStop(0, '#ffb08a')
  g.addColorStop(0.4, '#c4523a')
  g.addColorStop(1, 'rgba(196,82,58,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(sx, sy, starR * 2.4, 0, Math.PI * 2)
  ctx.fill()
  const tints = ['#8a7a6a', '#9a8a74', '#7a8a8f', '#6a7a8f', '#8f7a70', '#74808a', '#8a8578']
  for (let i = 0; i < 7; i++) {
    const px = sx + starR * 2.2 + i * r * 0.32
    const pr = r * between(rng, 0.055, 0.095)
    sphereClip(ctx, px, sy, pr, () => {
      paintBase(ctx, px, sy, pr, [tints[i], '#2c2c34'])
      paintLimb(ctx, px, sy, pr)
    })
    // faint rim from their red sun
    ctx.strokeStyle = 'rgba(255,138,92,0.5)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(px, sy, pr, Math.PI * 0.6, Math.PI * 1.4)
    ctx.stroke()
  }
}

function paintProbe(ctx, spec, cx, cy, r) {
  // Voyager silhouette: dish, bus, magnetometer boom, RTG
  ctx.strokeStyle = '#c9d2e0'
  ctx.fillStyle = '#141a26'
  ctx.lineWidth = 1.3
  // dish
  ctx.beginPath()
  ctx.ellipse(cx, cy - r * 0.1, r * 0.52, r * 0.2, -0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx + r * 0.08, cy - r * 0.22, r * 0.05, 0, Math.PI * 2)
  ctx.stroke()
  // bus
  ctx.beginPath()
  ctx.rect(cx - r * 0.14, cy + r * 0.02, r * 0.28, r * 0.18)
  ctx.fill()
  ctx.stroke()
  // booms
  ctx.beginPath()
  ctx.moveTo(cx + r * 0.14, cy + r * 0.1)
  ctx.lineTo(cx + r * 0.95, cy + r * 0.34)
  ctx.moveTo(cx - r * 0.14, cy + r * 0.1)
  ctx.lineTo(cx - r * 0.7, cy + r * 0.28)
  ctx.stroke()
  // RTG fins
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(cx - r * (0.34 + i * 0.12), cy + r * (0.17 + i * 0.045), r * 0.035, 0, Math.PI * 2)
    ctx.stroke()
  }
  // the long antenna line into the dark
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.moveTo(cx, cy + r * 0.2)
  ctx.lineTo(cx, cy + r * 0.95)
  ctx.stroke()
  ctx.globalAlpha = 1
}

function paintGalaxy(ctx, spec, cx, cy, r) {
  const rng = mulberry32(spec.seed)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.35)
  ctx.scale(1, 0.42)
  // core
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.5)
  g.addColorStop(0, 'rgba(255,240,214,0.9)')
  g.addColorStop(1, 'rgba(255,240,214,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2)
  ctx.fill()
  // spiral arms
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 1400; i++) {
      const t = rng() * 3.1
      const angle = t * 2.2 + arm * Math.PI + between(rng, -0.28, 0.28)
      const dist = (0.16 + t / 3.1) * r * between(rng, 0.85, 1.1)
      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist
      const warm = rng() > 0.75
      ctx.fillStyle = warm ? 'rgba(255,224,178,0.5)' : 'rgba(190,214,255,0.42)'
      ctx.globalAlpha = between(rng, 0.15, 0.7) * (1.15 - t / 3.1)
      const s = between(rng, 0.5, 1.6)
      ctx.fillRect(x, y, s, s)
    }
  }
  ctx.restore()
  ctx.globalAlpha = 1
}

function paintThreshold(ctx, spec, cx, cy, r) {
  // the heliopause: a faint shimmering boundary arc
  for (let i = 0; i < 3; i++) {
    const rr = r * (0.9 + i * 0.16)
    const g = ctx.createLinearGradient(cx - rr, cy, cx + rr, cy)
    g.addColorStop(0, 'rgba(120,170,255,0)')
    g.addColorStop(0.5, `rgba(140,190,255,${0.32 - i * 0.09})`)
    g.addColorStop(1, 'rgba(120,170,255,0)')
    ctx.strokeStyle = g
    ctx.lineWidth = 1.4 - i * 0.3
    ctx.beginPath()
    ctx.arc(cx, cy + r * 2.2, r * 3, Math.PI * 1.28, Math.PI * 1.72)
    ctx.stroke()
  }
}

// ---- belt bands for zone interstitials ----

export function paintBelt(w, h, kind) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const c = document.createElement('canvas')
  c.width = w * dpr
  c.height = h * dpr
  c.style.width = `${w}px`
  c.style.height = `${h}px`
  const ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const rng = mulberry32(kind === 'kuiper' ? 55 : 44)
  const n = kind === 'kuiper' ? 260 : 420
  const icy = kind === 'kuiper'
  for (let i = 0; i < n; i++) {
    const x = rng() * w
    // a loose diagonal band across the middle
    const bandC = h * 0.5 + (x / w - 0.5) * h * 0.18
    const y = bandC + (rng() + rng() + rng() - 1.5) * h * 0.22
    const r = between(rng, 0.4, icy ? 1.6 : 2.4)
    const a = between(rng, 0.12, 0.55)
    ctx.fillStyle = icy
      ? `rgba(190,214,235,${a})`
      : `rgba(${160 + Math.floor(rng() * 40)},${150 + Math.floor(rng() * 30)},${135 + Math.floor(rng() * 25)},${a})`
    ctx.beginPath()
    if (icy || rng() > 0.4) {
      ctx.arc(x, y, r, 0, Math.PI * 2)
    } else {
      ctx.ellipse(x, y, r * 1.4, r * 0.8, rng() * Math.PI, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  return c
}
