import { test } from 'node:test'
import assert from 'node:assert/strict'
import { radioBrowserFetch } from './radio-browser.ts'

test('mirror failures fall through and successful bodies remain readable', async (t) => {
  const hosts: string[] = []
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    hosts.push(new URL(url).hostname)
    assert.equal((init.headers as Record<string, string>)['User-Agent'], 'UnheardRadio/1.0')
    return hosts.length === 1 ? new Response('Unavailable', { status: 503 }) : Response.json([{ name: 'Test station' }])
  })
  const response = await radioBrowserFetch('/json/stations/search')
  assert.deepEqual(await response.json(), [{ name: 'Test station' }])
  assert.equal(hosts.length, 2)
  assert.notEqual(hosts[0], hosts[1])
})

test('caller cancellation does not fan out to another mirror', async (t) => {
  const abort = new AbortController()
  abort.abort()
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json([]) })
  await assert.rejects(radioBrowserFetch('/json/stations/search', { signal: abort.signal }), /cancelled/)
  assert.equal(calls, 0)
})

test('a mirror that stalls after headers is bounded and retried', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    if (++calls > 1) return Response.json([])
    return new Response(new ReadableStream({
      start(controller) {
        init.signal?.addEventListener('abort', () => controller.error(new Error('Timed out')), { once: true })
      },
    }))
  })
  const response = await radioBrowserFetch('/json/stations/search')
  assert.deepEqual(await response.json(), [])
  assert.equal(calls, 2)
})
