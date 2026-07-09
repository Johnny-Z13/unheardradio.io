import type { RadioStation } from '../types/radio'

export interface DiversifyOptions {
  pageSize: number
  maxPerCountry: number
  homeCountry?: string
  homeCap: number
}

/**
 * Re-orders an already-shuffled pool so every page reads like a world tour:
 * at most maxPerCountry stations per country per page, and the listener's
 * own country capped at homeCap and pushed to the bottom of each page.
 * Deterministic and lossless — output is a permutation of the input.
 */
export function diversify(stations: RadioStation[], opts: DiversifyOptions): RadioStation[] {
  const { pageSize, maxPerCountry, homeCountry, homeCap } = opts
  const pool = [...stations]
  const out: RadioStation[] = []

  while (pool.length > 0) {
    const page: RadioStation[] = []
    const homeTail: RadioStation[] = []
    const counts = new Map<string, number>()
    let i = 0

    while (page.length + homeTail.length < pageSize && i < pool.length) {
      const station = pool[i]
      const cc = station.countrycode || '??'
      const isHome = Boolean(homeCountry) && cc === homeCountry
      const cap = isHome ? Math.min(homeCap, maxPerCountry) : maxPerCountry

      if ((counts.get(cc) || 0) >= cap) {
        i++
        continue
      }

      pool.splice(i, 1)
      counts.set(cc, (counts.get(cc) || 0) + 1)
      if (isHome) homeTail.push(station)
      else page.push(station)
    }

    // The API slices fixed pageSize windows, so every emitted page must be
    // exactly full while the pool lasts. When the pool lacks variety for the
    // caps, diversity yields: pad from the pool head, best-effort.
    while (page.length + homeTail.length < pageSize && pool.length > 0) {
      page.push(pool.shift()!)
    }
    out.push(...page, ...homeTail)
  }

  return out
}
