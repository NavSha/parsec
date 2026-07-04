// Pull all confirmed exoplanets from the NASA Exoplanet Archive TAP service
// and write a compact data/exoplanets.json for the particle field.
// Run: node scripts/refresh-data.mjs

import { writeFile } from 'node:fs/promises'

const QUERY = `
select pl_name,sy_dist,pl_rade,pl_eqt,disc_year,discoverymethod
from ps where default_flag=1
`.trim().replace(/\s+/g, '+')

const URL = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${QUERY}&format=json`

const PC_TO_LY = 3.26156

const res = await fetch(URL)
if (!res.ok) throw new Error(`TAP query failed: ${res.status} ${await res.text()}`)
const rows = await res.json()

// compact tuples: [name, dist_ly, radius_earths, eq_temp_K, disc_year, method]
// nulls preserved — the renderer supplies defaults
const planets = rows
  .filter(r => r.pl_name)
  .map(r => [
    r.pl_name,
    r.sy_dist == null ? null : +(r.sy_dist * PC_TO_LY).toFixed(1),
    r.pl_rade == null ? null : +r.pl_rade.toFixed(2),
    r.pl_eqt == null ? null : Math.round(r.pl_eqt),
    r.disc_year ?? null,
    r.discoverymethod ?? null,
  ])
  .sort((a, b) => (a[1] ?? Infinity) - (b[1] ?? Infinity))

const out = {
  fetched: new Date().toISOString().slice(0, 10),
  source: 'NASA Exoplanet Archive (ps, default_flag=1)',
  fields: ['name', 'dist_ly', 'radius_earths', 'eq_temp_K', 'disc_year', 'method'],
  count: planets.length,
  planets,
}

await writeFile(new URL('../data/exoplanets.json', import.meta.url), JSON.stringify(out))
console.log(`wrote data/exoplanets.json — ${planets.length} planets`)
