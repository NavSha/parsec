# PARSEC

**Scroll to the edge of the known universe.**

A single-page scrollytelling journey: start at the Sun, pass every planet you know, cross the heliopause, and stream through all ~6,000 confirmed exoplanets — each one a real data point from the NASA Exoplanet Archive — out to the most distant known worlds near the galactic bulge.

Inspired by [Fathom](https://x.com/anshuc/status/2072922632605819076)'s ocean descent and the scroll-as-journey lineage of [The Deep Sea](https://neal.fun/deep-sea/).

## How it works

- **Scroll = distance from the Sun.** A logarithmic mapping spans 8 orders of magnitude, with dwell time weighted by narrative, not physics. The counter switches units mid-journey: km → AU → light-years.
- **Every world is drawn, not downloaded.** Planets, rings, belts, the TRAPPIST-1 system, and the Milky Way finale are procedural Canvas 2D. The starfield is three parallax layers with deterministic seeding.
- **The particle field is real data.** Every dot in interstellar space is a confirmed exoplanet — sized by radius, colored by equilibrium temperature, positioned by measured distance. Click one to identify it.

## Run locally

```bash
python3 -m http.server 8000   # any static server — ES modules need HTTP
open http://localhost:8000
```

## Development

```bash
npm test                       # log-scale engine + data mapping tests
node scripts/refresh-data.mjs  # re-pull the NASA Exoplanet Archive
```

No framework, no build step. Vanilla HTML/CSS/JS.

## Data

Exoplanet data from the [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) (`ps` table, `default_flag=1`), fetched at build time into `data/exoplanets.json`.
