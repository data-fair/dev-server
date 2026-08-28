import { test } from 'node:test'
import assert from 'node:assert/strict'
import { candidateBaseAppUrls } from '../src/base-app-urls.ts'

const DF = 'https://koumoul.com/data-fair'

test('builds the url a base application is served under, beside the data-fair', () => {
  const urls = candidateBaseAppUrls(DF, 'eco-watt', 'app-eco-watt', '1.0')
  assert.ok(urls.includes('https://koumoul.com/apps/eco-watt/1.0/'))
})

test('tries the repository name too, which is not always the application name', () => {
  // "Liste et fiches" is served under /apps/list-details/
  const urls = candidateBaseAppUrls(DF, 'Liste et fiches', 'data-fair-list-details', '1.6')
  assert.ok(urls.includes('https://koumoul.com/apps/data-fair-list-details/1.6/'))
  assert.ok(urls.includes('https://koumoul.com/apps/list-details/1.6/'))
})

test('tries the jsdelivr convention, scoping an unscoped package name', () => {
  assert.ok(candidateBaseAppUrls(DF, 'Application Calendrier', 'app-calendar', '1.2')
    .includes('https://cdn.jsdelivr.net/npm/@data-fair/app-calendar@1.2/dist/'))
  assert.ok(candidateBaseAppUrls(DF, 'Charts', '@data-fair/app-charts', '1.3')
    .includes('https://cdn.jsdelivr.net/npm/@data-fair/app-charts@1.3/dist/'))
})

test('follows the data-fair it talks to, never a hardcoded host', () => {
  const urls = candidateBaseAppUrls('https://staging-koumoul.com/data-fair', 'eco-watt', 'app-eco-watt', '1.0')
  assert.ok(urls.includes('https://staging-koumoul.com/apps/eco-watt/1.0/'))
  assert.ok(!urls.some(u => u.startsWith('https://koumoul.com/')))
})

test('never repeats a candidate, one request carries them all', () => {
  const urls = candidateBaseAppUrls(DF, 'eco-watt', 'eco-watt', '1.0')
  assert.deepEqual([...new Set(urls)], urls)
})

test('still proposes the application name when there is no package name', () => {
  assert.deepEqual(candidateBaseAppUrls(DF, 'eco-watt', undefined, '1.0'), ['https://koumoul.com/apps/eco-watt/1.0/'])
})
