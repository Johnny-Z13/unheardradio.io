import type { RadioStation } from '@/types/radio'
import centroids from './geo/country-centroids.json'

const REGION_CODE: Record<string, string> = {
  Africa: 'AFRC', Americas: 'AMER', Asia: 'ASIA', Europe: 'EURO', Oceania: 'OCEA', Antarctic: 'ANTC',
}

export function getLocator(station: RadioStation): string {
  const cc = station.countrycode?.toUpperCase()
  const entry = cc ? (centroids as Record<string, { region: string }>)[cc] : undefined
  return entry ? REGION_CODE[entry.region] ?? '----' : '----'
}
