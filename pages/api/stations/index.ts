import type { NextApiRequest, NextApiResponse } from 'next'
import { radioBrowserFetch } from '@/lib/radio-browser'
import { diversify } from '@/lib/discovery'
import type { RadioStation, SearchFilters } from '@/types/radio'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RadioStation[] | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const filters: SearchFilters = {
      search: req.query.search as string,
      country: req.query.country as string,
      genre: req.query.genre as string,
      listenerFilter: req.query.listenerFilter as SearchFilters['listenerFilter'],
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
      randomSeed: req.query.randomSeed as string,
    }
    const shouldRandomise = Boolean(filters.randomSeed)

    const params = new URLSearchParams()
    if (filters.search) params.append('name', filters.search)
    if (filters.country) params.append('country', filters.country)
    if (filters.genre) params.append('tag', filters.genre)

    // Zero-listener mode pulls a wider net so post-filter still has variety
    const requestLimit = shouldRandomise || filters.listenerFilter === 'zero'
      ? '1000'
      : (filters.limit?.toString() || '20')
    params.append('limit', requestLimit)
    params.append('offset', shouldRandomise ? '0' : (filters.offset?.toString() || '0'))
    params.append('hidebroken', 'true')
    // The site is served over HTTPS, so http:// streams are blocked as mixed
    // content by the browser — only surface stations with https streams.
    params.append('is_https', 'true')

    if (filters.listenerFilter === 'zero' || filters.listenerFilter === 'low-to-high') {
      params.append('order', 'clickcount')
      params.append('reverse', 'false')
    }

    const response = await radioBrowserFetch(`/json/stations/search?${params.toString()}`)
    let stations: RadioStation[] = await response.json()

    switch (filters.listenerFilter) {
      case 'zero':
        stations = stations.filter(s => (s.clickcount || 0) <= 5)
        stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
        break
      case 'hide-zero':
        stations = stations.filter(s => s.clickcount > 0)
        stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
        break
      case 'high-to-low':
        stations.sort((a, b) => (b.clickcount || 0) - (a.clickcount || 0))
        break
      case 'low-to-high':
      default:
        stations.sort((a, b) => (a.clickcount || 0) - (b.clickcount || 0))
        break
    }

    if (shouldRandomise && filters.randomSeed) {
      stations = seededShuffle(stations, filters.randomSeed)
      const homeCountry = (req.headers['x-vercel-ip-country'] as string | undefined)?.toUpperCase()
      stations = diversify(stations, {
        pageSize: filters.limit || 20,
        maxPerCountry: 2,
        homeCountry,
        homeCap: 1,
      })
      const start = filters.offset || 0
      const end = start + (filters.limit || 20)
      stations = stations.slice(start, end)
    }

    res.setHeader('Vary', 'x-vercel-ip-country')
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.status(200).json(stations)
  } catch (error) {
    console.error('Error fetching stations:', error)
    res.status(502).json({ error: 'Failed to fetch stations' })
  }
}

function seededShuffle(stations: RadioStation[], seed: string): RadioStation[] {
  const shuffled = [...stations]
  let state = hashSeed(seed)

  for (let i = shuffled.length - 1; i > 0; i--) {
    state = nextRandomState(state)
    const j = state % (i + 1)
    const current = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = current
  }

  return shuffled
}

function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function nextRandomState(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0
}
