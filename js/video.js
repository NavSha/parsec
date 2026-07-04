// Hero clip layer: videos are scrubbed by scroll, not played.
// Each clip lives in a sticky full-viewport wrapper inside its stop's
// section; opacity crossfades with the procedural canvas at the seams.

const CLIPS = {
  title: 'launch',
  jupiter: 'jupiter',
  saturn: 'saturn',
  heliopause: 'heliopause',
  'trappist-1': 'trappist',
  'pso-j318': 'rogue',
  finale: 'finale',
}

const players = []

export function mountClips() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  for (const [stopId, clip] of Object.entries(CLIPS)) {
    const sec = document.getElementById(stopId)
    if (!sec) continue

    const wrap = document.createElement('div')
    wrap.className = 'clip'
    if (reduced) {
      const img = document.createElement('img')
      img.src = `media/${clip}.jpg`
      img.alt = ''
      img.addEventListener('error', () => wrap.remove(), { once: true })
      wrap.appendChild(img)
      sec.prepend(wrap)
      wrap.style.opacity = 0.55
      continue
    }

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.poster = `media/${clip}.jpg`
    video.src = `media/${clip}.mp4`
    // if the file is missing (clips are optional), drop the wrapper quietly
    video.addEventListener('error', () => wrap.remove(), { once: true })
    wrap.appendChild(video)
    sec.prepend(wrap)

    // the title clip plays as an ambient loop; journey clips are scrubbed
    const mode = stopId === 'title' ? 'play' : 'scrub'
    if (mode === 'play') {
      video.autoplay = true
      video.loop = true
      video.preload = 'auto'
    }
    players.push({ sec, video, wrap, mode, duration: 0, lastSeek: -1 })
    video.addEventListener('loadedmetadata', () => {
      const p = players.find(p => p.video === video)
      if (p) p.duration = video.duration
    })
  }
}

// called from the main scroll loop
export function scrubClips(scrollY, vh) {
  for (const p of players) {
    if (p.mode === 'play') {
      // ambient title loop: fade out as the journey begins
      p.wrap.style.opacity = Math.max(0, 0.9 * (1 - scrollY / (vh * 0.8))).toFixed(3)
      continue
    }
    // section position in document space
    const rect = p.sec.getBoundingClientRect()
    const secTop = rect.top + scrollY
    const secH = p.sec.offsetHeight
    const travel = Math.max(secH - vh, 1)
    const q = (scrollY - secTop) / travel

    if (q < -0.35 || q > 1.35) {
      p.wrap.style.opacity = 0
      continue
    }

    // crossfade at the seams: fade in over the first 12%, out over the last 12%
    const fade = Math.min(
      1,
      Math.max(0, (q + 0.35) / 0.35),
      Math.max(0, (1.35 - q) / 0.35)
    )
    p.wrap.style.opacity = (0.9 * fade).toFixed(3)

    if (p.duration > 0) {
      const t = Math.min(Math.max(q, 0), 1) * (p.duration - 0.05)
      // only seek when it moves enough to matter — keeps scrubbing smooth
      if (Math.abs(t - p.lastSeek) > 0.033) {
        p.video.currentTime = t
        p.lastSeek = t
      }
    }
  }
}
