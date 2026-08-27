import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderEnv, findBase, readEnvVar, MIN_BASE, MAX_BASE } from '../src/env-file.ts'

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

test('reads a variable back from a generated .env', () => {
  const content = renderEnv(24730, '/app/')
  assert.equal(readEnvVar(content, 'APP_PORT'), '24730')
  assert.equal(readEnvVar(content, 'E2E_PORT'), '24732')
  assert.equal(readEnvVar(content, 'APP_PATH'), '/app/')
})

test('reads an empty APP_PATH as an empty string, not as absent', () => {
  assert.equal(readEnvVar(renderEnv(24730, ''), 'APP_PATH'), '')
})

test('reports an absent variable, so a foreign .env can be told apart', () => {
  assert.equal(readEnvVar('PUBLIC_URL=https://example.org\n', 'APP_PORT'), undefined)
})

test('does not confuse a variable with one whose name it prefixes', () => {
  const content = 'APP_PATH_EXTRA=x\nAPP_PATH=/app/\n'
  assert.equal(readEnvVar(content, 'APP_PATH'), '/app/')
})
