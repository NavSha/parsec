import { buildScale, formatDistance } from './scale.js'
import { ENTRIES } from './journey.js'

const journeyEl = document.getElementById('journey')
const counterEl = document.getElementById('counter')
const valueEl = counterEl.querySelector('.value')
const unitEl = counterEl.querySelector('.unit')

// ---- build sections ----

const BASE_VH = 140 // scroll length of a span-1 segment, in vh

for (const e of ENTRIES) {
  const sec = document.createElement('section')
  sec.className = e.kind
  sec.id = e.id
  sec.style.minHeight = `${(e.span ?? 1) * BASE_VH}vh`

  if (e.kind === 'zone') {
    const h2 = document.createElement('h2')
    h2.textContent = e.name
    sec.appendChild(h2)
  } else {
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
    sec.appendChild(card)
  }
  journeyEl.appendChild(sec)
}

// ---- fade-in on approach ----

const io = new IntersectionObserver(
  entries => {
    for (const en of entries) en.target.classList.toggle('visible', en.isIntersecting)
  },
  { threshold: 0.35 }
)
for (const sec of journeyEl.children) io.observe(sec)

// ---- distance counter ----

const scale = buildScale(ENTRIES)

function update() {
  const titleH = document.getElementById('title').offsetHeight
  const travel = journeyEl.offsetHeight - window.innerHeight
  const p = (window.scrollY - titleH) / Math.max(travel, 1)

  if (p < -0.2) {
    counterEl.classList.remove('on')
    return
  }
  counterEl.classList.add('on')
  const { value, unit } = formatDistance(scale.distanceAt(p))
  valueEl.textContent = value
  unitEl.textContent = unit
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
