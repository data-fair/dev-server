import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localizeConfig } from '../src/localize.ts'

const REMOTE = 'https://koumoul.com'
const LOCAL = 'http://localhost:24731'

test('rewrites the remote origin everywhere, not only in dataset hrefs', () => {
  const result = localizeConfig({
    datasets: [{ id: 'abc', href: 'https://koumoul.com/data-fair/api/v1/datasets/abc' }],
    logo: 'https://koumoul.com/assets/logo.png',
    nested: { deep: ['https://koumoul.com/portail/x'] }
  }, REMOTE, LOCAL)
  assert.equal(result.datasets[0].href, 'http://localhost:24731/data-fair/api/v1/datasets/abc')
  assert.equal(result.logo, 'http://localhost:24731/assets/logo.png')
  assert.equal(result.nested.deep[0], 'http://localhost:24731/portail/x')
})

test('rewrites a legacy localhost origin standing on a proxied path', () => {
  const result = localizeConfig({
    datasets: [{ id: 'abc', href: 'http://localhost:5888/data-fair/api/v1/datasets/abc' }],
    theme: 'http://localhost:5888/simple-directory/api/sites/_theme.css',
    tiles: 'http://localhost:5888/tileserver/style.json'
  }, REMOTE, LOCAL)
  assert.equal(result.datasets[0].href, 'http://localhost:24731/data-fair/api/v1/datasets/abc')
  assert.equal(result.theme, 'http://localhost:24731/simple-directory/api/sites/_theme.css')
  assert.equal(result.tiles, 'http://localhost:24731/tileserver/style.json')
})

test('leaves a localhost url on a non-proxied path untouched', () => {
  const result = localizeConfig({
    myService: 'http://localhost:8080/whatever',
    dataFairish: 'http://localhost:8080/data-fair-lookalike/x'
  }, REMOTE, LOCAL)
  assert.equal(result.myService, 'http://localhost:8080/whatever')
  assert.equal(result.dataFairish, 'http://localhost:8080/data-fair-lookalike/x')
})

test('leaves unrelated origins untouched', () => {
  const result = localizeConfig({ other: 'https://example.org/data-fair/x' }, REMOTE, LOCAL)
  assert.equal(result.other, 'https://example.org/data-fair/x')
})

test('handles configurations without any url', () => {
  assert.deepEqual(localizeConfig({}, REMOTE, LOCAL), {})
  assert.deepEqual(localizeConfig({ a: 1, b: null }, REMOTE, LOCAL), { a: 1, b: null })
})

test('does not mutate its input', () => {
  const input = { href: 'https://koumoul.com/data-fair/x' }
  const result = localizeConfig(input, REMOTE, LOCAL)
  assert.equal(input.href, 'https://koumoul.com/data-fair/x')
  assert.notEqual(result, input)
})
