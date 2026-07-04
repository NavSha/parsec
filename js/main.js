import { buildScale, formatDistance } from './scale.js'
import { ENTRIES } from './journey.js'
import { Starfield } from './render/starfield.js'
import { visualFor, paintBelt } from './render/planets.js'

const journeyEl = document.getElementById('journey')
const counterEl = document.getElementById('counter')
const valueEl = counterEl.querySelector('.value')
const unitEl = counterEl.querySelector('.unit')

// ---- build sections ----

const BASE_VH = 140 // scroll length of a span-1 segment, in vh

// visual diameter (px, pre-padding) per stop — narrative weight, not to scale
const SIZES = {
  sun: 300, mercury: 170, venus: 210, earth: 220, mars: 190,
  jupiter: 290, saturn: 250, uranus: 200, neptune: 200, pluto: 160,
  heliopause: 200, 'voyager-1': 170,
  'proxima-b': 210, 'barnards-b': 180, 'trappist-1': 260,
  'wasp-76b': 230, 'kepler-452b': 210, sweeps: 150, finale: 320,
}

const parallaxTargets = []

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

// ---- fade-in on approach ----

const io = new IntersectionObserver(
  entries => {
    for (const en of entries) en.target.classList.toggle('visible', en.isIntersecting)
  },
  { threshold: 0.3 }
)
for (const sec of journeyEl.children) io.observe(sec)

// ---- starfield ----

const stars = new Starfield(document.getElementById('stars'))
stars.start()

// ---- scroll: counter + parallax ----

const scale = buildScale(ENTRIES, { align: 'center' })
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function update() {
  const titleH = document.getElementById('title').offsetHeight
  // fraction of the journey at the viewport's vertical center, so the
  // counter matches each stop when its card is centered on screen
  const p = (window.scrollY + window.innerHeight / 2 - titleH) / journeyEl.offsetHeight
  stars.setScroll(window.scrollY, Math.min(Math.max(p, 0), 1))

  if (window.scrollY < titleH * 0.6) {
    counterEl.classList.remove('on')
  } else {
    counterEl.classList.add('on')
    const { value, unit } = formatDistance(scale.distanceAt(p))
    valueEl.textContent = value
    unitEl.textContent = unit
  }

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
