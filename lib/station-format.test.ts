import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getChecked, getRecentClicks, getStationContext, getStationHomepage, getRate, getDigitalDust } from './station-format.ts'
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

const dustNow = Date.parse('2026-09-08T12:00:00Z')
test('digital dust can date a directory trace but never call it an audience', () => {
  const dust = getDigitalDust({ clickcount: 0, votes: 0, clicktimestamp: '2026-09-05 12:00:00' } as RadioStation, dustNow)
  assert.equal(dust.note, 'Last directory trace: 3 days ago.')
  assert.equal(dust.lastTrace, '5 Sept 2026 · 3d ago')
  assert.doesNotMatch(dust.note, /listen|alone|nobody/i)
})

test('missing history does not become a never-listened claim, including saved snapshots', () => {
  const station = { clickcount: 0, votes: 0 } as RadioStation
  assert.equal(getDigitalDust(station, dustNow).note, 'No directory footprints in the past 24 hours.')
  assert.equal(getDigitalDust(station, dustNow).lastTrace, 'Not available')
  const unknown = getDigitalDust({ ...station, activityKnown: false, lastchangetime: '2020-01-01 00:00:00' }, dustNow)
  assert.equal(unknown.badge, 'Uncharted signal')
  assert.equal(unknown.entryEdited, 'Not available')
  assert.equal(unknown.votes, 'Unknown')
})

test('contradictory recent clicks and invalid or future timestamps cannot create quiet periods', () => {
  for (const clicktimestamp of ['2020-01-01 00:00:00', 'invalid', '2099-01-01 00:00:00']) {
    const dust = getDigitalDust({ clickcount: 1, votes: 0, clicktimestamp } as RadioStation, dustNow)
    assert.equal(dust.lastTrace, 'Not available')
    assert.doesNotMatch(dust.note, /days ago/)
  }
})

test('old entries describe metadata age, not broadcast age, and popular entries are not labelled forgotten', () => {
  const station = { clickcount: 0, votes: 0, lastchangetime: '2021-01-01 00:00:00' } as RadioStation
  assert.equal(getDigitalDust(station, dustNow).note, 'Directory entry untouched since 1 Jan 2021.')
  assert.equal(getDigitalDust({ ...station, clickcount: 500 }, dustNow).badge, 'On the dial')
  assert.equal(getDigitalDust({ ...station, lastchangetime: '2099-01-01 00:00:00' }, dustNow).entryEdited, 'Not available')
})
