import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderEnv, findBase, MIN_BASE, MAX_BASE } from '../src/env-file.ts'

test('renders the three ports and the app path', () => {
  assert.equal(renderEnv(24730, '/app/'), `# généré par df-dev-env — ne pas commiter
APP_PORT=24730
DEV_SERVER_PORT=24731
E2E_PORT=24732
APP_PATH=/app/
`)
})

test('declares the documented port range', () => {
  assert.equal(MIN_BASE, 20000)
  assert.equal(MAX_BASE, 29997)
})

test('returns the first drawn base when its three ports are free', async () => {
  const base = await findBase(async () => true, () => 24730)
  assert.equal(base, 24730)
})

test('retries when any of the three ports is taken', async () => {
  const draws = [21000, 22000]
  const taken = new Set([21002])
  const base = await findBase(async (port) => !taken.has(port), () => draws.shift()!)
  assert.equal(base, 22000)
})

test('throws after exhausting its attempts', async () => {
  await assert.rejects(
    findBase(async () => false, () => 21000, 3),
    /no free port range found/
  )
})
