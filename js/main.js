import { buildScale, formatDistance } from './scale.js'
import { ENTRIES } from './journey.js'
import { Starfield } from './render/starfield.js'
import { visualFor, paintBelt, loadTextures } from './render/planets.js'
import { Field } from './render/particles.js'
import { mountClips, scrubClips } from './video.js'
import { toggleSound, setAudioProgress, chime, soundOn } from './audio.js'

const journeyEl = document.getElementById('journey')
const counterEl = document.getElementById('counter')
const valueEl = counterEl.querySelector('.value')
const unitEl = counterEl.querySelector('.unit')
const passedEl = counterEl.querySelector('.passed')
const unitNoteEl = counterEl.querySelector('.unit-note')
const tooltipEl = document.getElementById('tooltip')

// ---- build sections ----

const BASE_VH = 140 // scroll length of a span-1 segment, in vh

// visual diameter (px, pre-padding) per stop — narrative weight, not to scale
const SIZES = {
  sun: 300, mercury: 170, venus: 210, earth: 220, mars: 190,
  jupiter: 290, saturn: 250, uranus: 200, neptune: 200, pluto: 160,
  heliopause: 200, 'voyager-1': 170,
  'proxima-b': 210, 'barnards-b': 180, 'trappist-1': 260, 'pso-j318': 220,
  'wasp-76b': 230, 'kepler-452b': 210, sweeps: 150, finale: 320,
}

const parallaxTargets = []
const artRefs = {} // id → {el, size} for texture repaint

for (const e of ENTRIES) {
  const sec = document.createElement('section')
  sec.className = e.kind
  sec.id = e.id
  sec.style.minHeight = `${(e.span ?? 1) * BASE_VH}vh`

  if (e.kind === 'zone') {
    if (e.id === 'asteroid-belt' || e.id === 'kuiper-belt') {
      const belt = paintBelt(window.innerWidth, window.innerHeight, e.id === 'kuiper-belt' ? 'kuiper' : 'asteroid')
      belt.className = 'belt'
      sec.appendChild(belt)
      parallaxTargets.push({ el: belt, sec, k: 0.22 })
    }
    const h2 = document.createElement('h2')
    h2.textContent = e.name
    sec.appendChild(h2)
  } else {
    const wrap = document.createElement('div')
    wrap.className = 'stop-inner'
    const size = Math.min(SIZES[e.id] ?? 200, window.innerWidth * 0.62)
    const art = visualFor(e.id, size)
    if (art) {
      art.className = 'world'
      wrap.appendChild(art)
      parallaxTargets.push({ el: art, sec, k: 0.14 })
      artRefs[e.id] = { size }
    }
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `
      <h3></h3>
      <div class="sub"></div>
      <div class="stats"></div>
      <div class="line"></div>`
    card.querySelector('h3').textContent = e.name
    card.querySelector('.sub').textContent = e.sub
    card.querySelector('.stats').textContent = e.stats
    card.querySelector('.line').textContent = e.line
    wrap.appendChild(card)
    sec.appendChild(wrap)
  }
  journeyEl.appendChild(sec)
}

mountClips()

// texture maps load async; repaint solar-system worlds when ready.
// on failure the procedural paintings simply remain.
loadTextures().then(ok => {
  if (!ok) return
  for (const [id, ref] of Object.entries(artRefs)) {
    const fresh = visualFor(id, ref.size)
    if (!fresh) continue
    const t = parallaxTargets.find(t => t.sec.id === id)
    const old = t?.el
    if (!old || !old.parentNode) continue
    fresh.className = old.className
    fresh.style.transform = old.style.transform
    old.replaceWith(fresh)
    t.el = fresh
  }
})

// ---- fade-in on approach ----

let chimeIndex = 0
const io = new IntersectionObserver(
  entries => {
    for (const en of entries) {
      en.target.classList.toggle('visible', en.isIntersecting)
      // one soft ping per stop per visit, if sound is on
      if (en.isIntersecting && en.target.classList.contains('stop') && soundOn() && !en.target.dataset.chimed) {
        en.target.dataset.chimed = '1'
        chime(chimeIndex++)
      }
    }
  },
  { threshold: 0.3 }
)
for (const sec of journeyEl.children) io.observe(sec)

// ---- ambient sound toggle ----

const soundBtn = document.getElementById('sound')
soundBtn.addEventListener('click', () => {
  soundBtn.setAttribute('aria-pressed', String(toggleSound()))
})

// ---- starfield ----

const stars = new Starfield(document.getElementById('stars'))
stars.start()

// ---- exoplanet particle field (lazy: data loads after first paint) ----

let field = null

async function initField() {
  try {
    const res = await fetch('data/exoplanets.json')
    if (!res.ok) return
    const data = await res.json()
    const titleH = document.getElementById('title').offsetHeight
    field = new Field(document.getElementById('field'), data.planets, scale, {
      journeyHeight: journeyEl.offsetHeight,
      titleH,
    })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      field.setScroll(window.scrollY)
      field.draw(0)
    } else {
      const loop = t => {
        field.setScroll(window.scrollY)
        field.draw(t)
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    }
  } catch {
    // no data, no field — the journey still works
  }
}
initField()

// tap/click a particle to identify the world
window.addEventListener('click', ev => {
  if (!field) return
  const hit = field.hitTest(ev.clientX, ev.clientY)
  if (!hit) {
    tooltipEl.hidden = true
    return
  }
  const parts = []
  if (hit.rade != null) parts.push(`${hit.rade}× Earth radius`)
  if (hit.teq != null) parts.push(`~${hit.teq} K`)
  parts.push(`${hit.ly.toLocaleString('en-US')} light-years`)
  tooltipEl.innerHTML = `<div class="t-name"></div><div class="t-info"></div>`
  tooltipEl.querySelector('.t-name').textContent = hit.name
  tooltipEl.querySelector('.t-info').textContent = parts.join(' · ')
  tooltipEl.hidden = false
  const pad = 14
  tooltipEl.style.left = `${Math.min(ev.clientX + pad, window.innerWidth - 280)}px`
  tooltipEl.style.top = `${Math.min(ev.clientY + pad, window.innerHeight - 90)}px`
  clearTimeout(tooltipEl._t)
  tooltipEl._t = setTimeout(() => { tooltipEl.hidden = true }, 4500)
})

// ---- scroll: counter + parallax ----

const scale = buildScale(ENTRIES, { align: 'center' })
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function update() {
  const titleH = document.getElementById('title').offsetHeight
  // fraction of the journey at the viewport's vertical center, so the
  // counter matches each stop when its card is centered on screen
  const p = (window.scrollY + window.innerHeight / 2 - titleH) / journeyEl.offsetHeight
  stars.setScroll(window.scrollY, Math.min(Math.max(p, 0), 1))
  setAudioProgress(p)

  if (window.scrollY < titleH * 0.6) {
    counterEl.classList.remove('on')
  } else {
    counterEl.classList.add('on')
    const { value, unit } = formatDistance(scale.distanceAt(p))
    valueEl.textContent = value
    unitEl.textContent = unit
    noteUnitChange(unit)
    if (field) {
      const n = field.passedCount()
      passedEl.textContent = n > 0 ? `${n.toLocaleString('en-US')} worlds behind you` : ''
    }
  }

  scrubClips(window.scrollY, window.innerHeight)

  if (!reduced) {
    const mid = window.scrollY + window.innerHeight / 2
    for (const t of parallaxTargets) {
      const secMid = t.sec.offsetTop + titleH + t.sec.offsetHeight / 2
      const delta = secMid - mid
      if (Math.abs(delta) < window.innerHeight * 1.5) {
        t.el.style.transform = `translateY(${delta * t.k}px)`
      }
    }
  }
}

// first time a new unit appears, explain it briefly — the unit switch
// is the story beat ("you've just left human scale")
const UNIT_NOTES = {
  AU: '1 AU = the Earth–Sun distance, 150 million km',
  'light-years': '1 light-year = the distance light travels in a year — 63,000 AU',
}
const seenUnits = new Set(['km'])
let noteTimer = null

function noteUnitChange(unit) {
  if (seenUnits.has(unit)) return
  seenUnits.add(unit)
  unitNoteEl.textContent = UNIT_NOTES[unit] ?? ''
  unitNoteEl.classList.add('show')
  clearTimeout(noteTimer)
  noteTimer = setTimeout(() => unitNoteEl.classList.remove('show'), 6000)
}

let ticking = false
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }
  },
  { passive: true }
)
window.addEventListener('resize', update)
update()
