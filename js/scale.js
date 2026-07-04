// Distance units and the logarithmic scroll↔distance mapping.
// Pure module — no DOM — so it runs under node --test.

export const AU = 1.495978707e11 // meters
export const LY = 9.4607304725808e15 // meters

export const KM_TO_AU_THRESHOLD = 0.05 * AU
export const AU_TO_LY_THRESHOLD = 1000 * AU

const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatDistance(meters) {
  if (meters < KM_TO_AU_THRESHOLD) {
    return { value: int.format(Math.round(meters / 1000)), unit: 'km' }
  }
  if (meters < AU_TO_LY_THRESHOLD) {
    const au = meters / AU
    return { value: au < 10 ? au.toFixed(2) : au.toFixed(1), unit: 'AU' }
  }
  const ly = meters / LY
  let value
  if (ly < 10) value = ly.toFixed(2)
  else if (ly < 100) value = ly.toFixed(1)
  else value = int.format(Math.round(ly))
  return { value, unit: 'light-years' }
}

// stops: ordered [{d: meters, span?: number}, ...]. Each stop's `span` is the
// scroll weight of the segment from it to the next stop.
// align 'start': stop i's distance is reached at its segment boundary.
// align 'center': stop i's distance is reached at the middle of its own
// section (matches a layout where each stop's card is centered in a
// span-tall section), clamping to the first/last distance at the ends.
export function buildScale(stops, { align = 'start' } = {}) {
  const spans = stops.map(s => s.span ?? 1)
  const total = align === 'start'
    ? spans.slice(0, -1).reduce((a, b) => a + b, 0)
    : spans.reduce((a, b) => a + b, 0)

  // anchor position (in span units) where each stop's distance holds
  const anchors = []
  let cum = 0
  for (let i = 0; i < stops.length; i++) {
    anchors.push(align === 'start' ? cum : cum + spans[i] / 2)
    cum += spans[i]
  }

  const segs = []
  for (let i = 0; i < stops.length - 1; i++) {
    segs.push({
      from: Math.log(Math.max(stops[i].d, 1)),
      to: Math.log(Math.max(stops[i + 1].d, 1)),
      start: anchors[i],
      span: anchors[i + 1] - anchors[i],
    })
  }

  function distanceAt(p) {
    const x = Math.min(Math.max(p, 0), 1) * total
    if (x <= anchors[0]) return Math.exp(segs[0].from)
    const last = segs[segs.length - 1]
    if (x >= last.start + last.span) return Math.exp(last.to)
    let seg = last
    for (const s of segs) {
      if (x <= s.start + s.span) { seg = s; break }
    }
    const t = seg.span === 0 ? 1 : (x - seg.start) / seg.span
    return Math.exp(seg.from + (seg.to - seg.from) * t)
  }

  // scroll fraction at which stop `index`'s distance is reached
  function fractionOf(index) {
    const i = Math.min(Math.max(index, 0), anchors.length - 1)
    return anchors[i] / total
  }

  return { distanceAt, fractionOf, totalSpan: total }
}
