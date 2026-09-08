import type { RadioStation } from '@/types/radio'

export function getBand(station: RadioStation): 'FM' | 'AM' | 'SW' | 'WEB' {
  const haystack = `${station.name} ${station.tags || ''}`.toLowerCase()
  if (/\bshortwave\b|\bsw\b/.test(haystack)) return 'SW'
  if (/\bam\b\s*\d{3,4}|\d{3,4}\s*\bam\b/.test(haystack)) return 'AM'
  if (/\bfm\b|f\.m\./.test(haystack)) return 'FM'
  return 'WEB'
}

export function getStationId(station: RadioStation): string {
  if (!station.stationuuid) return '----'
  return station.stationuuid.replace(/-/g, '').slice(0, 4).toUpperCase()
}

export function getCoords(station: RadioStation): string {
  const lat = station.geo_lat
  const lon = station.geo_long
  if (lat == null || lon == null || (lat === 0 && lon === 0)) return 'COORDS UNKNOWN'
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(1)}°${ns} ${Math.abs(lon).toFixed(1)}°${ew}`
}

const COUNTRY_SHORT: Record<string, string> = {
  'The United States of America': 'USA',
  'United States of America': 'USA',
  'United States': 'USA',
  'The United Kingdom of Great Britain and Northern Ireland': 'UK',
  'United Kingdom': 'UK',
  'United Kingdom of Great Britain and Northern Ireland': 'UK',
  'The Russian Federation': 'Russia',
  'Russian Federation': 'Russia',
}

const COUNTRY_CODE_SHORT: Record<string, string> = {
  GB: 'UK',
  RU: 'Russia',
  US: 'USA',
}

export function getOrigin(station: RadioStation): string {
  const cc = station.countrycode?.toUpperCase() || ''
  const name = COUNTRY_CODE_SHORT[cc] || COUNTRY_SHORT[station.country] || station.country || ''
  if (cc && name) return `${cc} / ${name.toUpperCase()}`
  if (name) return name.toUpperCase()
  return '— / UNKNOWN'
}

export function getRate(station: RadioStation): string {
  if (!station.bitrate) return '—'
  const codec = (station.codec || '?').toUpperCase()
  return `${station.bitrate}k ${codec}`
}

/** RadioBrowser's check timestamp is UTC; it is not continuous uptime. */
export function getChecked(station: RadioStation, now = Date.now()): string {
  const value = station.lastchecktime_iso8601 || station.lastchecktime
  if (!value) return 'Unknown'
  const timestamp = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value.replace(' ', 'T') + 'Z')
  if (!Number.isFinite(timestamp) || timestamp > now + 60000) return 'Unknown'
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

export function getRecentClicks(station: RadioStation): string {
  return station.activityKnown === false || !Number.isFinite(station.clickcount) || station.clickcount < 0
    ? 'Unknown' : station.clickcount.toLocaleString()
}

export function getStationContext(station: RadioStation): string {
  const tag = station.tags?.split(',').map((s) => s.trim()).find((s) =>
    s && !/kbps|kbit|https?:|^\d|^(mp3|aac|aac\+|ogg|hls)$/i.test(s))
  return [station.language && station.language !== 'unknown' ? station.language : null, tag].filter(Boolean).join(' · ') || 'Genre not listed. Tune in to explore.'
}

export function getStationHomepage(station: RadioStation): string | undefined {
  try {
    const url = new URL(station.homepage)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
  } catch { return undefined }
}

function directoryTime(value: string | null | undefined, now: number): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(value)) return null
  const time = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value.replace(' ', 'T') + 'Z')
  return Number.isFinite(time) && time <= now ? time : null
}

/** An evocative reading of a directory snapshot, never a claim about listeners. */
export function getDigitalDust(station: RadioStation, now = Date.now()) {
  const known = station.activityKnown !== false
  const clicks = known && Number.isFinite(station.clickcount) && station.clickcount >= 0 ? station.clickcount : null
  const edited = known ? directoryTime(station.lastchangetime_iso8601 || station.lastchangetime, now) : null
  const trace = known ? directoryTime(station.clicktimestamp_iso8601 || station.clicktimestamp, now) : null
  const day = 86400000
  // Some mirrors expose recent counts without the corresponding timestamp.
  // A contradictory old timestamp cannot support a multi-day quiet claim.
  const consistentTrace = trace !== null && !(clicks !== null && clicks > 0 && now - trace >= day) ? trace : null
  const days = consistentTrace === null ? null : Math.floor((now - consistentTrace) / day)
  const date = (time: number) => new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const quiet = clicks !== null && clicks <= 5 && Number.isFinite(station.votes) && station.votes >= 0 && station.votes <= 50
  const badge = quiet ? 'Faint footprint' : clicks === null ? 'Uncharted signal' : 'On the dial'
  let note = 'A frequency with a story still to discover.'
  if (clicks === 0 && days !== null && days >= 2) note = `Last directory trace: ${days.toLocaleString()} days ago.`
  else if (quiet && edited !== null && now - edited >= 180 * day) note = `Directory entry untouched since ${date(edited)}.`
  else if (clicks === 0) note = 'No directory footprints in the past 24 hours.'
  else if (quiet) note = 'Only a few footprints at this end of the dial.'
  return {
    badge,
    note,
    lastTrace: consistentTrace === null ? 'Not available' : days === 0 ? 'Within the past day' : `${date(consistentTrace)} · ${days}d ago`,
    entryEdited: edited === null ? 'Not available' : date(edited),
    votes: known && Number.isFinite(station.votes) && station.votes >= 0 ? station.votes.toLocaleString() : 'Unknown',
  }
}
