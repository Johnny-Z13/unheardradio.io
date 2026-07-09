// Offline generation script — copies simplified world land TopoJSON and
// derives an alpha2 -> centroid/region table. Run once; outputs are committed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
mkdirSync('lib/geo', { recursive: true })

const land = readFileSync(require.resolve('world-atlas/land-110m.json'), 'utf8')
writeFileSync('lib/geo/world-land-110m.json', land)

const countries = require('world-countries')
const centroids = {}
for (const c of countries) {
  if (!c.cca2 || !Array.isArray(c.latlng) || c.latlng.length !== 2) continue
  centroids[c.cca2.toUpperCase()] = { lat: c.latlng[0], lng: c.latlng[1], region: c.region || 'Unknown' }
}
writeFileSync('lib/geo/country-centroids.json', JSON.stringify(centroids))
console.log(`land topo: ${(land.length / 1024).toFixed(0)}kB, centroids: ${Object.keys(centroids).length} countries`)
