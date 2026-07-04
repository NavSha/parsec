# PARSEC — Scroll to the Edge of the Known Universe

*Working title. Alternatives: LIGHTYEAR, VOYAGE, ADRIFT. (Fathom's naming pattern: a single evocative unit-of-depth word — "parsec" is the space equivalent.)*

## 1. Concept

A single-page scroll experience, inspired by Fathom (the ocean-dive app). **Scrolling down = traveling away from the Sun.** A distance counter ticks up in the corner (km → AU → light-years, switching units as the journey demands). You pass the 8 planets, the asteroid belt, the Kuiper Belt, Voyager 1, the heliopause — then leap into interstellar space where all ~6,000 confirmed exoplanets stream past as a real-data particle field, with ~15–20 famous exoplanets getting full featured stops. The journey ends with a pull-back reveal of the Milky Way.

**Visuals are hybrid:** procedural Canvas/WebGL for everything (starfield, planets, particle field, transitions), with 6–8 AI-generated Seedance hero clips layered in at the most cinematic moments.

**Format:** a standalone full-screen scrollytelling site (its own repo/Pages deployment), not an article or embedded widget. It shares the interactive-explainers ethos (vanilla JS, no build step, free hosting, learning through interaction) but the genre precedent is neal.fun's "The Deep Sea" / "The Size of Space" — dark, chrome-less, desktop-and-mobile web. Link to it from interactive-explainers as a showcase, don't embed it.

## 2. Experience design

### The scroll journey (in order)

| Stop | Distance | Treatment |
|---|---|---|
| Title screen: "PARSEC" over Earth's horizon at dawn | — | Hero clip #1 (launch) |
| Sun ("to measure the journey, we start the clock here") — counter begins at the solar surface | 0 | Procedural |
| Mercury, Venus | 0.39, 0.72 AU | Procedural |
| Earth + Moon look-back ("you are here") | 1 AU | Procedural |
| Mars | 1.5 AU | Procedural |
| **Asteroid belt** (zone title, like "The Sunlit Zone") | 2–3.3 AU | Procedural particle band |
| Jupiter | 5.2 AU | Hero clip #2 (flyby) |
| Saturn | 9.5 AU | Hero clip #3 (ring crossing) |
| Uranus, Neptune | 19, 30 AU | Procedural |
| Pluto + **Kuiper Belt** zone | 39+ AU | Procedural |
| **Heliopause — leaving the solar system** | ~120 AU | Hero clip #4 (interstellar threshold) |
| Voyager 1 card ("the farthest human-made object") | ~167 AU | Procedural |
| Unit switch: AU → light-years. Long dark. | | Procedural |
| **The Interstellar Zone**: 6,000-exoplanet particle field begins | 4+ ly | Procedural (data-driven) |
| Proxima Centauri b (nearest exoplanet) | 4.2 ly | Featured card, procedural |
| Barnard's Star b, Ross 128 b, ... (~6 more nearby) | 6–20 ly | Featured cards, procedural |
| TRAPPIST-1 system (7 planets, 3 in habitable zone) | 40 ly | Hero clip #5 (system arrival) |
| A hot Jupiter (WASP-76b — it rains iron) | 640 ly | Featured card, procedural |
| A rogue planet, starless in the dark | — | Hero clip #6 |
| Kepler-452b ("Earth's cousin") | 1,800 ly | Featured card |
| Kepler deep field — particle density peaks | 1,000–3,000 ly | Procedural |
| Most distant confirmed exoplanets | ~27,000 ly | Procedural |
| **Finale**: camera pulls back, the whole particle field collapses into a spiral arm of the Milky Way | — | Hero clip #7 (+ optional #8 credits loop) |

### Core mechanics

- **Distance counter** (top-right, like Fathom's meters): km near Earth, AU through the solar system, light-years beyond the heliopause. Unit transitions are themselves moments ("you will now stop counting in kilometers").
- **Zone titles** fade in/out mid-journey (THE INNER WORLDS / THE ASTEROID BELT / THE OUTER GIANTS / THE KUIPER BELT / INTERSTELLAR SPACE / THE DEEP FIELD).
- **Planet cards** (bottom sheet, Fathom-style): name, designation, distance, radius/mass vs Earth, one poetic line. E.g. Humboldt-squid-style lines: *WASP-76b — "Here, the evening forecast is molten iron."*
- **Logarithmic scroll mapping.** Linear scroll cannot represent 0.39 AU → 27,000 ly. Scroll position maps to log(distance); dwell time is allocated by narrative weight, not physical distance.
- **Scroll-scrubbed video.** Hero clips don't autoplay; scroll position scrubs `video.currentTime` (Fathom's trick). Entering/leaving a clip cross-fades with the procedural canvas, with matched star density and drift direction at the seams.

## 3. Data layer

- **Source:** NASA Exoplanet Archive TAP service (free, no key): `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,hostname,sy_dist,pl_rade,pl_bmasse,pl_orbper,pl_eqt,disc_year,discoverymethod+from+ps+where+default_flag=1&format=json`
- Fetched **at build time** by a small Node script → committed as `data/exoplanets.json` (~6,000 rows, few hundred KB gzipped). No runtime API dependency; a `refresh-data` npm script re-pulls.
- **Particle field mapping:** distance (`sy_dist`, parsecs → ly) sets when a particle appears during the scroll; radius (`pl_rade`) sets dot size; equilibrium temp (`pl_eqt`) sets color (blue→white→orange→red); discovery method sets a subtle shape variant. Tapping/hovering a particle shows name + one-line stats — every dot is a real world.
- Solar-system planets + featured exoplanets: hand-curated JSON with card copy.

## 4. Rendering

- **Canvas 2D first, WebGL only if needed.** A 6,000-particle field with parallax is comfortably 60fps in Canvas 2D on modern phones. Keep a WebGL escape hatch (regl or raw) if profiling says otherwise. No three.js unless we hit a wall — keeps the no-build-step ethos.
- Procedural planets: pre-rendered offscreen canvases (radial-gradient limb darkening, noise-based banding for gas giants, ring ellipse for Saturn) composited with parallax drift.
- Starfield: 3 parallax layers + occasional shooting star. Darkens and reddens subtly with depth into the journey.
- **Reduced-motion + fallback:** `prefers-reduced-motion` gets cross-fading stills; devices that fail video codec checks get pure procedural everywhere.

## 5. Video layer (Seedance)

### Models & pipeline

1. **Draft** every hero shot on **Seedance 1.5 Pro, 8s, 9:16** (9.6 credits/take) — iterate prompt, motion direction, brightness until it cuts cleanly. Budget 2–3 takes/shot.
2. **Final** render on **Seedance 2.0, 720p, 5s, 16:9, `generate_audio false`** (22.5 credits/clip). Clips are generated **16:9 with center-weighted composition**: shown full-frame on desktop, center-cropped to portrait on mobile via `object-fit: cover`. One set of clips serves both layouts at no extra cost. Use the `medias` array to condition each clip's start frame on the outgoing frame of the procedural canvas (exported PNG) — this is what makes canvas→video seams invisible.
3. Post: trim/loop in ffmpeg (video-editor skill), encode H.265 + H.264 fallback, poster frames extracted for reduced-motion mode.

### Hero clip list

| # | Shot | Prompt sketch |
|---|---|---|
| 1 | Launch: Earth's blue horizon falls away into black | slow pull-back from low orbit, sunrise limb, no text |
| 2 | Jupiter flyby | camera drifts past swirling bands, Great Red Spot rotating into view |
| 3 | Saturn ring crossing | camera skims through ring plane, ice particles catching sunlight |
| 4 | Heliopause | faint blue solar wind boundary shimmer, then pure star-dense black |
| 5 | TRAPPIST-1 arrival | dim red dwarf, seven small worlds strung in a line |
| 6 | Rogue planet | a dark sphere occluding the starfield, rim-lit by the galaxy |
| 7 | Finale | accelerating pull-back, thousands of stars collapse into a Milky Way spiral arm |
| 8 | *(optional)* credits loop | slow galaxy rotation |

### Budget

| Item | Credits |
|---|---|
| Drafts: 7–8 shots × ~2.5 takes × 9.6 | ~170–190 |
| Finals: 7–8 × 22.5 | ~160–180 |
| Contingency (one 1080p upgrade or reshoot) | ~50 |
| **Total** | **~380–420** (of 1,788 available) |

Clips are generated **last**, after the procedural experience is complete and scroll-locked — so seam frames are final before any credits are spent.

## 6. Stack & structure

- **Vanilla HTML/CSS/JS, no framework, no build step** (same ethos as interactive-explainers). One small Node script for data refresh only.
- **Deploy:** GitHub Pages, public repo `NavSha/parsec`.
- Mobile-first (9:16 like Fathom), responsive up to desktop (procedural layers extend to fill; videos letterbox in a centered column).

```
parsec/
├── index.html
├── css/main.css
├── js/
│   ├── main.js            # scroll engine, log-distance mapping
│   ├── journey.js         # stop definitions, zone titles, card copy
│   ├── render/
│   │   ├── starfield.js
│   │   ├── planets.js     # procedural planet painter
│   │   └── particles.js   # exoplanet field
│   ├── video.js           # scrub-sync, canvas↔video crossfade
│   └── data.js            # loads exoplanets.json
├── data/exoplanets.json
├── media/                 # final clips + posters (git-lfs if needed)
├── scripts/
│   ├── refresh-data.mjs   # NASA TAP → exoplanets.json
│   └── clips/             # prompts + generation commands per hero shot
└── SPEC.md
```

## 7. Build plan

1. **M1 — Scroll skeleton:** log-distance engine, counter with unit switching, zone titles, solar-system stops as flat cards. *Proves the feel.*
2. **M2 — Procedural rendering:** starfield, planet painter, asteroid/Kuiper bands.
3. **M3 — Data layer:** archive fetch script, 6,000-particle field, tap-to-inspect, featured exoplanet cards.
4. **M4 — Polish pass:** typography, card copy (the poetic lines), pacing tune, reduced-motion, perf on real phone.
5. **M5 — Video layer:** draft → finalize → integrate 6–8 hero clips with scroll-scrubbing and seam conditioning.
6. **M6 — Ship:** repo, GitHub Pages, smoke test via /verify-app.

TDD where it pays: unit tests for the log-scroll mapping, unit-switch thresholds, and data transform (the pure logic); visual/interaction layers verified via browse-skill screenshots instead.

Milestones 1–4 cost nothing; the experience must already be good **before** M5 spends a credit.

## 8. Open questions (defaults if unanswered)

- Name: **PARSEC** (default) — or LIGHTYEAR / VOYAGE / other?
- Sound: ambient drone + card chimes, off by default? (Seedance audio stays off; audio would be a separate free layer, e.g. Web Audio.) Default: **skip for v1.**
- Repo visibility: **public** (default), since GitHub Pages.
