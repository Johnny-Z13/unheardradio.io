import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diversify, prioritizeAtlasStations, obscurePool, nextSignal } from './discovery.ts'
import type { RadioStation } from '../types/radio'

type S = { stationuuid: string; countrycode: string }
const mk = (cc: string, i: number): S => ({ stationuuid: `${cc}-${i}`, countrycode: cc })
const codes = (s: S[]) => s.map(x => x.countrycode)
const signal = (id: string, overrides: Partial<RadioStation> = {}): RadioStation => ({
  stationuuid: id, url_resolved: `https://radio.test/${id}`, countrycode: 'US',
  clickcount: 0, votes: 0, lastcheckok: 1, ssl_error: 0, ...overrides,
} as RadioStation)

test('strict eligibility rejects popular, unhealthy, insecure and missing-activity stations', () => {
  const pool = [signal('good'), signal('clicks', { clickcount: 6 }), signal('votes', { votes: 51 }),
    signal('unknown', { clickcount: undefined }), signal('negative', { votes: -1 }),
    signal('insecure', { url_resolved: 'http://radio.test/no' }), signal('broken', { lastcheckok: 0 }),
    signal('ssl', { ssl_error: 1 }), signal('nan', { clickcount: NaN })]
  assert.deepEqual(obscurePool(pool, 'one').map((s) => s.stationuuid), ['good'])
})

test('deduplicates stream aliases and UUIDs without merging distinct query-based stations', () => {
  const pool = [signal('a'), signal('alias', { url_resolved: 'https://radio.test/a#fragment' }),
    signal('a', { url_resolved: 'https://radio.test/other' }),
    signal('b', { url_resolved: 'https://radio.test/a?channel=b' })]
  const out = obscurePool(pool, 'one')
  assert.equal(new Set(out.map((s) => s.stationuuid)).size, out.length)
  assert.ok(out.some((s) => s.stationuuid === 'b'))
  assert.equal(out.filter((s) => s.url_resolved.split('#')[0] === 'https://radio.test/a').length, 1)
})

test('votes break equal-click ties before country variety; popularity never leaks into strict pool', () => {
  const pool = [signal('voted', { votes: 40 }), signal('rare'), signal('popular-country', { countrycode: 'NP', clickcount: 80 })]
  assert.deepEqual(prioritizeAtlasStations(obscurePool(pool, 'one'), 'one').map((s) => s.stationuuid), ['rare', 'voted'])
})

test('next signal avoids attempted aliases, prefers a new country and explicitly exhausts', () => {
  const a = signal('a'), b = signal('b'), c = signal('c', { countrycode: 'FR' })
  const alias = signal('alias', { url_resolved: a.url_resolved })
  assert.equal(nextSignal([alias, b, c], [a], a)?.stationuuid, 'c')
  assert.equal(nextSignal([alias, b], [a], a)?.stationuuid, 'b')
  assert.equal(nextSignal([a, alias, b], [a, b], b), null)
})

test('caps each country at maxPerCountry per 20-station window (diverse pool)', () => {
  // 40 countries x 5 stations — plenty of variety, caps must hold exactly.
  const ccs = [...Array(40)].map((_, i) => `C${String(i).padStart(2, '0')}`)
  const pool = [...Array(5)].flatMap((_, i) => ccs.map(cc => mk(cc, i)))
  const out = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }) as unknown as S[]
  for (let start = 0; start + 20 <= out.length; start += 20) {
    const page = codes(out.slice(start, start + 20))
    for (const cc of Array.from(new Set(page))) {
      assert.ok(page.filter(c => c === cc).length <= 2, `${cc} appears ${page.filter(c => c === cc).length}× in window at ${start}`)
    }
  }
})

test('pages always fill to pageSize even when caps cannot hold (best effort)', () => {
  // 4 countries x 10 — cap 2/page cannot fill 20; diversity yields, page still fills.
  const pool = [...Array(10)].flatMap((_, i) => [mk('US', i), mk('DE', i), mk('FR', i), mk('NP', i)])
  const out = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }) as unknown as S[]
  assert.equal(out.length, pool.length)
  const firstPage = codes(out.slice(0, 20))
  // The capped picks lead the page: first 8 must be 2 per country.
  const lead = firstPage.slice(0, 8)
  for (const cc of ['US', 'DE', 'FR', 'NP']) {
    assert.equal(lead.filter(c => c === cc).length, 2, `${cc} in lead: ${lead}`)
  }
})

test('home country capped at homeCap and placed last among capped picks', () => {
  const pool = [mk('US', 0), mk('US', 1), mk('DE', 0), mk('FR', 0), mk('NP', 0), mk('KE', 0)]
  const out = diversify(pool as never, { pageSize: 5, maxPerCountry: 2, homeCountry: 'US', homeCap: 1 }) as unknown as S[]
  const page = codes(out.slice(0, 5))
  assert.equal(page.filter(c => c === 'US').length, 1)
  assert.equal(page[page.length - 1], 'US')
})

test('deterministic and lossless', () => {
  const pool = [...Array(30)].map((_, i) => mk(['US', 'DE', 'FR'][i % 3], i))
  const a = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }) as unknown as S[]
  const b = diversify(pool as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }) as unknown as S[]
  assert.deepEqual(a, b)
  assert.equal(a.length, pool.length)
  assert.deepEqual(
    a.map(s => s.stationuuid).sort(),
    pool.map(s => s.stationuuid).sort()
  )
})

test('empty and missing countrycode handled', () => {
  assert.deepEqual(diversify([] as never, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }), [])
  const pool = [{ stationuuid: 'x' }, { stationuuid: 'y' }] as never
  assert.equal(diversify(pool, { pageSize: 20, maxPerCountry: 2, homeCap: 1 }).length, 2)
})

test('Atlas prioritises the least-clicked signal from every represented country', () => {
  const pool = [
    { ...mk('US', 0), clickcount: 0, votes: 1, clicktrend: 0 },
    { ...mk('US', 1), clickcount: 1, votes: 0, clicktrend: 0 },
    { ...mk('NP', 0), clickcount: 12, votes: 1, clicktrend: 0 },
    { ...mk('NP', 1), clickcount: 40, votes: 0, clicktrend: 0 },
    { ...mk('AQ', 0), clickcount: 80, votes: 0, clicktrend: 0 },
  ]
  const out = prioritizeAtlasStations(pool as never, 'sweep-a') as unknown as Array<S & { clickcount: number }>

  assert.deepEqual(out.slice(0, 3).map(s => s.countrycode), ['US', 'NP', 'AQ'])
  assert.deepEqual(out.slice(0, 3).map(s => s.clickcount), [0, 12, 80])
})

test('Atlas keeps obscurity ranking ahead of seeded variation', () => {
  const pool = [
    { ...mk('US', 0), clickcount: 0, votes: 0, clicktrend: 0 },
    { ...mk('DE', 0), clickcount: 5, votes: 0, clicktrend: 0 },
    { ...mk('FR', 0), clickcount: 50, votes: 0, clicktrend: 0 },
  ]

  for (const seed of ['one', 'two', 'three']) {
    const out = prioritizeAtlasStations(pool as never, seed) as unknown as Array<S & { clickcount: number }>
    assert.deepEqual(out.map(s => s.clickcount), [0, 5, 50])
  }
})
