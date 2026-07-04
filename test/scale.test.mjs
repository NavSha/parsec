import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AU, LY, buildScale, formatDistance } from '../js/scale.js'
import { ENTRIES } from '../js/journey.js'

// --- formatDistance: unit selection thresholds ---

test('close distances format as km', () => {
  const f = formatDistance(6.957e8) // solar surface
  assert.equal(f.unit, 'km')
  assert.equal(f.value, '695,700')
})

test('km→AU switch happens at 0.05 AU', () => {
  assert.equal(formatDistance(0.049 * AU).unit, 'km')
  assert.equal(formatDistance(0.051 * AU).unit, 'AU')
})

test('planetary distances format as AU with 2 decimals under 10', () => {
  const f = formatDistance(0.39 * AU)
  assert.equal(f.unit, 'AU')
  assert.equal(f.value, '0.39')
})

test('outer solar system formats as AU with 1 decimal', () => {
  const f = formatDistance(39.5 * AU)
  assert.equal(f.unit, 'AU')
  assert.equal(f.value, '39.5')
})

test('AU→light-year switch happens at 1000 AU', () => {
  assert.equal(formatDistance(999 * AU).unit, 'AU')
  assert.equal(formatDistance(1001 * AU).unit, 'light-years')
})

test('nearby stars format as light-years with 2 decimals', () => {
  const f = formatDistance(4.246 * LY)
  assert.equal(f.unit, 'light-years')
  assert.equal(f.value, '4.25')
})

test('deep-field distances format as whole light-years with separators', () => {
  const f = formatDistance(27700 * LY)
  assert.equal(f.unit, 'light-years')
  assert.equal(f.value, '27,700')
})

// --- buildScale: log-distance scroll mapping ---

const SIMPLE = [
  { d: 1e9, span: 1 },
  { d: 1e11, span: 2 },
  { d: 1e15, span: 1 },
]

test('distanceAt(0) is the first stop distance', () => {
  const s = buildScale(SIMPLE)
  assert.ok(Math.abs(s.distanceAt(0) - 1e9) / 1e9 < 1e-9)
})

test('distanceAt(1) is the last stop distance', () => {
  const s = buildScale(SIMPLE)
  assert.ok(Math.abs(s.distanceAt(1) - 1e15) / 1e15 < 1e-9)
})

test('stop boundaries land on stop distances (span-weighted)', () => {
  const s = buildScale(SIMPLE)
  // first segment has span 1 of total 3
  assert.ok(Math.abs(s.distanceAt(1 / 3) - 1e11) / 1e11 < 1e-9)
})

test('interpolation is logarithmic within a segment', () => {
  const s = buildScale(SIMPLE)
  // halfway through segment 1e9→1e11 should be 1e10, not 5.05e10
  const mid = s.distanceAt(1 / 6)
  assert.ok(Math.abs(mid - 1e10) / 1e10 < 1e-9)
})

test('mapping is strictly monotonic', () => {
  const s = buildScale(SIMPLE)
  let prev = -Infinity
  for (let i = 0; i <= 200; i++) {
    const d = s.distanceAt(i / 200)
    assert.ok(d > prev, `not monotonic at p=${i / 200}`)
    prev = d
  }
})

test('out-of-range p clamps to endpoints', () => {
  const s = buildScale(SIMPLE)
  assert.equal(s.distanceAt(-0.5), s.distanceAt(0))
  assert.equal(s.distanceAt(1.5), s.distanceAt(1))
})

// --- the real journey data ---

test('journey entries are sorted by distance', () => {
  for (let i = 1; i < ENTRIES.length; i++) {
    assert.ok(
      ENTRIES[i].d > ENTRIES[i - 1].d,
      `${ENTRIES[i].id} (${ENTRIES[i].d}) not beyond ${ENTRIES[i - 1].id} (${ENTRIES[i - 1].d})`
    )
  }
})

test('journey scale is monotonic end to end', () => {
  const s = buildScale(ENTRIES)
  let prev = -Infinity
  for (let i = 0; i <= 500; i++) {
    const d = s.distanceAt(i / 500)
    assert.ok(d > prev)
    prev = d
  }
})

test('journey spans the Sun to the deep field', () => {
  const s = buildScale(ENTRIES)
  assert.ok(s.distanceAt(0) < 1e9) // starts near the solar surface
  assert.ok(s.distanceAt(1) > 20000 * LY) // ends beyond 20k light-years
})
