import { test } from 'node:test'
import assert from 'node:assert/strict'
import { focusAtlasView, interpolateAtlasView } from './atlas-camera.ts'

test('focus keeps a station clear of the desktop card and centres it without a card', () => {
  const view = { w: 1280, h: 400, k: 1, x: 0, y: 0 }
  const point: [number, number] = [1100, 70]
  for (const card of [true, false]) {
    const next = focusAtlasView(view, point, false, card)
    assert.equal(next.k, 4)
    assert.equal(640 + (point[0] - 640) * next.k + next.x, card ? 468 : 640)
    assert.equal(200 + (point[1] - 200) * next.k + next.y, 200)
  }
})

test('approximate locations get a wider view and narrow cards leave the point visible above', () => {
  const view = { w: 320, h: 230, k: 1, x: 0, y: 0 }
  const next = focusAtlasView(view, [90, 70], true, true)
  assert.equal(next.k, 2.5)
  assert.equal(115 + (70 - 115) * next.k + next.y, 48)
  assert.equal(focusAtlasView({ ...view, k: 8 }, [90, 70], true, true).k, 8)
})

test('camera interpolation clamps endpoints and is interrupted by taking the current view', () => {
  const from = { w: 320, h: 230, k: 1, x: 0, y: 0 }
  const to = focusAtlasView(from, [90, 70], false, false)
  assert.deepEqual(interpolateAtlasView(from, to, -1), from)
  assert.deepEqual(interpolateAtlasView(from, to, 2), to)
  const midway = interpolateAtlasView(from, to, 0.5)
  const retarget = focusAtlasView(midway, [220, 130], false, false)
  assert.deepEqual(interpolateAtlasView(midway, retarget, 0), midway)
})
