// Ambient sound layer — synthesized live with Web Audio, no files.
// Off by default; first toggle builds the graph (satisfies the
// user-gesture autoplay requirement). The drone's filter closes as you
// travel deeper: bright near the Sun, near-subsonic in the deep field.

let ctx = null
let master = null
let droneFilter = null
let on = false

function build() {
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  droneFilter = ctx.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 900
  droneFilter.Q.value = 0.4
  droneFilter.connect(master)

  // two slowly-beating low sines + a faint octave triangle
  for (const [freq, type, level] of [
    [55, 'sine', 0.16],
    [55.4, 'sine', 0.14], // 0.4 Hz beat against the first
    [110.6, 'triangle', 0.05],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = level
    osc.connect(g)
    g.connect(droneFilter)
    osc.start()
  }

  // filtered noise: solar wind up close, tape-hiss vacuum further out
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  noise.loop = true
  const nf = ctx.createBiquadFilter()
  nf.type = 'lowpass'
  nf.frequency.value = 240
  const ng = ctx.createGain()
  ng.gain.value = 0.035
  noise.connect(nf)
  nf.connect(ng)
  ng.connect(droneFilter)
  noise.start()
}

export function toggleSound() {
  if (!ctx) build()
  if (ctx.state === 'suspended') ctx.resume()
  on = !on
  const t = ctx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(on ? 0.5 : 0, t + (on ? 2.5 : 0.8))
  return on
}

export function soundOn() {
  return on
}

// journey progress 0..1 → the drone darkens with depth
export function setAudioProgress(p) {
  if (!ctx || !on) return
  const cutoff = 900 - 680 * Math.min(Math.max(p, 0), 1)
  droneFilter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.6)
}

// soft two-note ping when a world comes into view
export function chime(seed = 0) {
  if (!ctx || !on) return
  const t = ctx.currentTime
  const base = [523.25, 587.33, 659.25, 783.99][seed % 4] // C5 D5 E5 G5
  for (const [freq, delay, level] of [
    [base, 0, 0.05],
    [base * 1.5, 0.18, 0.03],
  ]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t + delay)
    g.gain.linearRampToValueAtTime(level, t + delay + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 1.6)
    osc.connect(g)
    g.connect(master)
    osc.start(t + delay)
    osc.stop(t + delay + 1.8)
  }
}
