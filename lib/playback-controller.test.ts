import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPlaybackController, type PlaybackStatus } from './playback-controller.ts'
import type { RadioStation } from '../types/radio'

class FakeAudio extends EventTarget {
  src = ''
  sources: string[] = []
  paused = true
  action: () => Promise<void> = () => new Promise(() => {})
  play() { this.sources.push(this.src); this.paused = false; return this.action() }
  pause() { this.paused = true }
  load() {}
  removeAttribute() { this.src = '' }
}
const station = (id: string, fallback = false) => ({ stationuuid: id, url_resolved: `https://radio.test/${id}`, url: `https://radio.test/${fallback ? id + '-fallback' : id}` }) as RadioStation
function setup(timeoutMs = 20) {
  const audio = new FakeAudio()
  const states: PlaybackStatus[] = []
  const started: string[] = []
  const controller = createPlaybackController({ getAudio: () => audio, onState: (s) => states.push(s.status), onStarted: (s) => started.push(s.stationuuid), timeoutMs })
  return { audio, states, started, controller }
}

test('does not announce or track a play until actual playing', async () => {
  const { audio, controller, states, started } = setup()
  const result = controller.play(station('one'))
  audio.dispatchEvent(new Event('play'))
  assert.deepEqual(states, ['loading'])
  assert.deepEqual(started, [])
  audio.dispatchEvent(new Event('playing'))
  assert.equal(await result, 'playing')
  assert.deepEqual(started, ['one'])
  controller.pause()
})

test('rapid next cancels old fallback and old completions', async () => {
  const { audio, controller, started } = setup()
  let rejectOld: (e: Error) => void = () => {}
  audio.action = () => new Promise((_, reject) => { rejectOld = reject })
  const old = controller.play(station('old', true))
  audio.action = () => new Promise(() => {})
  const next = controller.play(station('new'))
  rejectOld(new Error('old failure'))
  audio.dispatchEvent(new Event('playing'))
  assert.equal(await old, 'cancelled')
  assert.equal(await next, 'playing')
  assert.deepEqual(audio.sources, ['https://radio.test/old', 'https://radio.test/new'])
  assert.deepEqual(started, ['new'])
  controller.pause()
})

test('stop while buffering cancels the request and releases the stream', async () => {
  const { audio, controller, states } = setup()
  const pending = controller.play(station('one', true))
  controller.pause()
  audio.dispatchEvent(new Event('playing'))
  assert.equal(await pending, 'cancelled')
  assert.equal(audio.src, '')
  assert.equal(audio.paused, true)
  assert.deepEqual(states, ['loading', 'paused'])
})

test('blocked autoplay becomes ready without fallback or click tracking', async () => {
  const { audio, controller, states, started } = setup()
  audio.action = () => Promise.reject(new DOMException('Gesture required', 'NotAllowedError'))
  assert.equal(await controller.play(station('one', true)), 'blocked')
  assert.deepEqual(states, ['loading', 'ready'])
  assert.equal(audio.sources.length, 1)
  assert.deepEqual(started, [])
  controller.pause()
})

test('both attempts are bounded and late playing cannot revive a timed-out stream', async () => {
  const { audio, controller, states } = setup(5)
  assert.equal(await controller.play(station('one', true)), 'failed')
  assert.equal(audio.sources.length, 2)
  audio.dispatchEvent(new Event('playing'))
  assert.equal(states.at(-1), 'failed')
  assert.equal(audio.src, '')
})

test('fallback only tracks the station once after receiving audio', async () => {
  const { audio, controller, started } = setup()
  audio.action = async () => {
    if (!audio.src.endsWith('fallback')) throw new Error('first source failed')
    audio.dispatchEvent(new Event('playing'))
  }
  assert.equal(await controller.play(station('one', true)), 'playing')
  assert.deepEqual(started, ['one'])
  controller.pause()
})

test('insecure URLs never reach the player', async () => {
  const { audio, controller } = setup()
  assert.equal(await controller.play({ ...station('one'), url: 'http://insecure.test', url_resolved: 'javascript:bad' }), 'failed')
  assert.equal(audio.sources.length, 0)
})

test('a live stream that stalls reaches a recoverable failure', async () => {
  const { audio, controller, states } = setup(5)
  audio.action = async () => { audio.dispatchEvent(new Event('playing')) }
  await controller.play(station('one'))
  audio.dispatchEvent(new Event('waiting'))
  await new Promise((resolve) => setTimeout(resolve, 15))
  assert.equal(states.at(-1), 'failed')
  assert.equal(audio.paused, true)
})
