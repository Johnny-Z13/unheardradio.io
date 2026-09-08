import type { RadioStation } from '../types/radio'

export interface DiversifyOptions {
  pageSize: number
  maxPerCountry: number
  homeCountry?: string
  homeCap: number
}

/**
 * Builds the Atlas pool with one least-discovered signal from every represented
 * country first, followed by the remaining stations in obscurity order.
 * The seed only breaks equal-score ties, so a resweep varies the texture without
 * allowing popular stations to displace genuinely obscure ones.
 */
export function prioritizeAtlasStations(stations: RadioStation[], seed: string): RadioStation[] {
  const ranked = [...stations].sort((a, b) => {
    const byClicks = (a.clickcount || 0) - (b.clickcount || 0)
    if (byClicks !== 0) return byClicks
    const byVotes = (a.votes || 0) - (b.votes || 0)
    if (byVotes !== 0) return byVotes
    const byTrend = (a.clicktrend || 0) - (b.clicktrend || 0)
    if (byTrend !== 0) return byTrend
    return seededStationKey(a.stationuuid, seed) - seededStationKey(b.stationuuid, seed)
  })

  const representedCountries = new Set<string>()
  const countrySignals: RadioStation[] = []
  const remainingSignals: RadioStation[] = []

  for (const station of ranked) {
    const country = station.countrycode?.trim().toUpperCase()
    if (country && !representedCountries.has(country)) {
      representedCountries.add(country)
      countrySignals.push(station)
    } else {
      remainingSignals.push(station)
    }
  }

  return [...countrySignals, ...remainingSignals]
}

function seededStationKey(uuid: string, seed: string): number {
  let hash = 2166136261
  const value = `${seed}:${uuid}`
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
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

/** Directory activity thresholds, not claims about a broadcaster's audience. */
export const OBSCURE_LIMITS = { clicks: 5, votes: 50 } as const

export function streamIdentity(station: RadioStation): string | null {
  try {
    const url = new URL(station.url_resolved || station.url)
    if (url.protocol !== 'https:') return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

export function obscurePool(stations: RadioStation[], seed: string): RadioStation[] {
  const ranked = stations.filter((station) =>
    station.lastcheckok === 1 && station.ssl_error !== 1 &&
    Number.isFinite(station.clickcount) && station.clickcount >= 0 && station.clickcount <= OBSCURE_LIMITS.clicks &&
    Number.isFinite(station.votes) && station.votes >= 0 && station.votes <= OBSCURE_LIMITS.votes &&
    Boolean(station.stationuuid) && streamIdentity(station) !== null
  ).sort((a, b) => a.clickcount - b.clickcount || a.votes - b.votes ||
    seededStationKey(a.stationuuid, seed) - seededStationKey(b.stationuuid, seed))
  const ids = new Set<string>()
  const streams = new Set<string>()
  return ranked.filter((station) => {
    const stream = streamIdentity(station)!
    if (ids.has(station.stationuuid) || streams.has(stream)) return false
    ids.add(station.stationuuid)
    streams.add(stream)
    return true
  })
}

/** Prefer a fresh country, but never repeat an attempted stream in this session. */
export function nextSignal(pool: RadioStation[], attempted: RadioStation[], current?: RadioStation | null): RadioStation | null {
  const ids = new Set(attempted.map((s) => s.stationuuid))
  const streams = new Set(attempted.map(streamIdentity))
  const fresh = pool.filter((s) => !ids.has(s.stationuuid) && !streams.has(streamIdentity(s)))
  return fresh.find((s) => s.countrycode && s.countrycode !== current?.countrycode) ?? fresh[0] ?? null
}
