import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getChecked, getRecentClicks, getStationContext, getStationHomepage, getRate } from './station-format.ts'
import type { RadioStation } from '../types/radio'

test('checked age uses the UTC health check, never metadata edit time', () => {
  const station = { lastchecktime: '2026-09-08 12:00:00', lastchangetime: '2020-01-01 00:00:00' } as RadioStation
  assert.equal(getChecked(station, Date.parse('2026-09-08T14:00:00Z')), '2h ago')
})

test('missing, invalid or future health timestamps stay unknown', () => {
  for (const lastchecktime of ['', 'invalid', '2099-01-01 00:00:00']) {
    assert.equal(getChecked({ lastchecktime } as RadioStation, Date.parse('2026-09-08T14:00:00Z')), 'Unknown')
  }
})

test('saved and missing activity never becomes an invented zero', () => {
  assert.equal(getRecentClicks({ clickcount: 0, activityKnown: false } as RadioStation), 'Unknown')
  assert.equal(getRecentClicks({} as RadioStation), 'Unknown')
  assert.equal(getRecentClicks({ clickcount: 0 } as RadioStation), '0')
})

test('station context selects sound metadata rather than codec tags', () => {
  assert.equal(getStationContext({ language: 'spanish', tags: '128kbps,mp3,jazz' } as RadioStation), 'spanish · jazz')
  assert.match(getStationContext({} as RadioStation), /Tune in to explore/)
})

test('community homepage metadata cannot create executable links', () => {
  assert.equal(getStationHomepage({ homepage: 'javascript:alert(1)' } as RadioStation), undefined)
  assert.equal(getStationHomepage({ homepage: 'https://radio.test/about' } as RadioStation), 'https://radio.test/about')
})

test('missing saved codec is not labelled MP3', () => {
  assert.equal(getRate({ bitrate: 96, codec: '' } as RadioStation), '96k ?')
})
