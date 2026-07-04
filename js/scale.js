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
// scroll weight of the segment from it to the next stop (last stop's span is
// the tail of the page and doesn't affect the mapping).
export function buildScale(stops) {
  const segs = []
  let total = 0
  for (let i = 0; i < stops.length - 1; i++) {
    const span = stops[i].span ?? 1
    segs.push({
      from: Math.log(Math.max(stops[i].d, 1)),
      to: Math.log(Math.max(stops[i + 1].d, 1)),
      start: total,
      span,
    })
    total += span
  }

  function distanceAt(p) {
    const x = Math.min(Math.max(p, 0), 1) * total
    let seg = segs[segs.length - 1]
    for (const s of segs) {
      if (x <= s.start + s.span) { seg = s; break }
    }
    const t = seg.span === 0 ? 1 : (x - seg.start) / seg.span
    return Math.exp(seg.from + (seg.to - seg.from) * t)
  }

  // scroll fraction at which stop `index` is reached
  function fractionOf(index) {
    if (index <= 0) return 0
    if (index >= segs.length) return 1
    return segs[index].start / total
  }

  return { distanceAt, fractionOf, totalSpan: total }
}
