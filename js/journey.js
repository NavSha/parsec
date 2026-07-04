// The journey: every stop and zone title, in order, with distances from the
// Sun in meters. Pure data — no DOM — so it runs under node --test.
//
// kind: 'stop' (card), 'zone' (title interstitial), 'finale'
// span: scroll weight of the segment from this entry to the next (default 1)

import { AU, LY } from './scale.js'

export const ENTRIES = [
  {
    id: 'sun', kind: 'stop', d: 6.957e8, span: 0.8,
    name: 'The Sun', sub: 'Sol · G2V',
    stats: '1,392,700 km across · 99.86% of the system’s mass',
    line: 'Everything you are about to pass orbits this. The clock starts here.',
  },
  { id: 'inner-worlds', kind: 'zone', d: 0.15 * AU, span: 0.6, name: 'The Inner Worlds' },
  {
    id: 'mercury', kind: 'stop', d: 0.387 * AU, span: 1,
    name: 'Mercury', sub: 'Rocky · 0.39 AU',
    stats: '4,880 km across · year: 88 days',
    line: 'Sun-scorched by day, frozen by night. It never learned moderation.',
  },
  {
    id: 'venus', kind: 'stop', d: 0.723 * AU, span: 1,
    name: 'Venus', sub: 'Rocky · 0.72 AU',
    stats: '12,104 km across · 465°C under permanent cloud',
    line: 'Earth’s twin, if your twin ran a furnace under acid skies.',
  },
  {
    id: 'earth', kind: 'stop', d: 1.0 * AU, span: 1.2,
    name: 'Earth & Moon', sub: 'You are here · 1 AU',
    stats: '12,742 km across · 1 moon · everyone you’ve ever known',
    line: 'Look back. This is the last stop with a return ticket.',
  },
  {
    id: 'mars', kind: 'stop', d: 1.524 * AU, span: 1,
    name: 'Mars', sub: 'Rocky · 1.52 AU',
    stats: '6,779 km across · home of the tallest volcano known',
    line: 'The next set of footprints will land here.',
  },
  { id: 'asteroid-belt', kind: 'zone', d: 2.5 * AU, span: 0.8, name: 'The Asteroid Belt' },
  { id: 'outer-giants', kind: 'zone', d: 4.0 * AU, span: 0.6, name: 'The Outer Giants' },
  {
    id: 'jupiter', kind: 'stop', d: 5.203 * AU, span: 1.4,
    name: 'Jupiter', sub: 'Gas giant · 5.20 AU',
    stats: '139,820 km across · 95 moons · a storm older than telescopes',
    line: 'It could swallow every other planet and still have room for dessert.',
  },
  {
    id: 'saturn', kind: 'stop', d: 9.537 * AU, span: 1.4,
    name: 'Saturn', sub: 'Gas giant · 9.54 AU',
    stats: '116,460 km across · rings of ice, 10 meters thin',
    line: 'The rings would stretch from here to the Moon — and barely clear a house.',
  },
  {
    id: 'uranus', kind: 'stop', d: 19.19 * AU, span: 1,
    name: 'Uranus', sub: 'Ice giant · 19.2 AU',
    stats: '50,724 km across · rolls on its side',
    line: 'Something hit it so hard it never stood up again.',
  },
  {
    id: 'neptune', kind: 'stop', d: 30.07 * AU, span: 1,
    name: 'Neptune', sub: 'Ice giant · 30.1 AU',
    stats: '49,244 km across · winds at 2,100 km/h',
    line: 'Found with mathematics before anyone found it with a telescope.',
  },
  { id: 'kuiper-belt', kind: 'zone', d: 35 * AU, span: 0.6, name: 'The Kuiper Belt' },
  {
    id: 'pluto', kind: 'stop', d: 39.48 * AU, span: 1,
    name: 'Pluto', sub: 'Dwarf planet · 39.5 AU',
    stats: '2,377 km across · a heart-shaped glacier the size of Texas',
    line: 'Demoted on paper. Never in ours.',
  },
  {
    id: 'heliopause', kind: 'stop', d: 120 * AU, span: 1.2,
    name: 'The Heliopause', sub: 'Edge of the solar wind · ~120 AU',
    stats: 'Where the Sun’s breath finally fails against the interstellar medium',
    line: 'Past this line, the Sun is just another star.',
  },
  {
    id: 'voyager-1', kind: 'stop', d: 167 * AU, span: 1.2,
    name: 'Voyager 1', sub: 'Launched 1977 · ~167 AU',
    stats: 'The farthest human-made object · still calling home',
    line: 'Forty-nine years out, carrying a golden record no one may ever play.',
  },
  { id: 'interstellar', kind: 'zone', d: 0.1 * LY, span: 1, name: 'Interstellar Space' },
  {
    id: 'proxima-b', kind: 'stop', d: 4.246 * LY, span: 1.2,
    name: 'Proxima Centauri b', sub: 'Exoplanet · 4.25 light-years',
    stats: '≥1.07 Earth masses · in the habitable zone of a red dwarf',
    line: 'The nearest world beyond the Sun. At Voyager’s speed: 73,000 years away.',
  },
  {
    id: 'barnards-b', kind: 'stop', d: 5.96 * LY, span: 1,
    name: 'Barnard’s Star b', sub: 'Exoplanet · 5.96 light-years',
    stats: 'Orbits the fastest-moving star in our sky',
    line: 'Its sun crosses our heavens like a slow, deliberate thought.',
  },
  {
    id: 'trappist-1', kind: 'stop', d: 40.7 * LY, span: 1.4,
    name: 'TRAPPIST-1', sub: 'Seven worlds · 40.7 light-years',
    stats: '7 rocky planets · 3 in the habitable zone · star the size of Jupiter',
    line: 'Seven earths around one dim ember. Their skies are full of each other.',
  },
  {
    id: 'wasp-76b', kind: 'stop', d: 640 * LY, span: 1.2,
    name: 'WASP-76b', sub: 'Hot Jupiter · ~640 light-years',
    stats: 'Dayside: 2,400°C · tidally locked',
    line: 'Here, the evening forecast is molten iron.',
  },
  { id: 'deep-field', kind: 'zone', d: 1000 * LY, span: 0.8, name: 'The Deep Field' },
  {
    id: 'kepler-452b', kind: 'stop', d: 1810 * LY, span: 1.2,
    name: 'Kepler-452b', sub: 'Super-Earth · ~1,810 light-years',
    stats: '385-day year · around a sun-like star 1.5 billion years older than ours',
    line: 'Earth’s older cousin. Whatever happens to us may have already happened there.',
  },
  {
    id: 'sweeps', kind: 'stop', d: 27700 * LY, span: 1.2,
    name: 'SWEEPS-11b', sub: 'The far shore · ~27,700 light-years',
    stats: 'Among the most distant planets ever confirmed, near the galactic bulge',
    line: 'The light you’d see from here left before humans planted the first seed.',
  },
  {
    id: 'finale', kind: 'finale', d: 30000 * LY, span: 1,
    name: 'The Milky Way', sub: '~6,000 known worlds · one galaxy · barely explored',
    stats: 'Every planet you passed is in one thin slice of one spiral arm',
    line: 'All of it — every world on this journey — fits inside a single pixel of the universe.',
  },
]
