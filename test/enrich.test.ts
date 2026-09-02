import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enrichDataset, INJECTED_DATASET_PROPS, prepareConfig } from '../src/enrich.ts'
import { localizeConfig } from '../src/localize.ts'

const REMOTE_ORIGIN = 'https://koumoul.com'
const LOCAL_ORIGIN = 'http://localhost:24731'

// a remote dataset as data-fair would serve it: everything an app needs in
// window.APPLICATION plus fields production never forwards (owner, status, rest)
const remoteDataset = (id: string) => ({
  id,
  title: 'Rest carto',
  slug: 'rest-carto',
  status: 'finalized',
  isRest: true,
  finalizedAt: '2026-01-01T00:00:00.000Z',
  schema: [{ key: 'geom', type: 'object', 'x-refersTo': 'https://purl.org/geojson/vocab#geometry' }],
  userPermissions: ['readLines', 'createLine', 'updateLine', 'patchLine', 'deleteLine'],
  owner: { type: 'user', id: 'someone' },
  rest: { history: false }
})

// the dataset ids below are all distinct: the enrichment cache (module-level, 30s ttl)
// would otherwise make a test depend on a previous one
test('injects the data-fair contract properties, including isRest and userPermissions', async () => {
  const dataset = await enrichDataset({ id: 'enrich-ok', href: REMOTE_ORIGIN + '/api/v1/datasets/enrich-ok' }, async () => remoteDataset('enrich-ok'))
  assert.equal(dataset.isRest, true)
  assert.deepEqual(dataset.userPermissions, ['readLines', 'createLine', 'updateLine', 'patchLine', 'deleteLine'])
  assert.equal(dataset.title, 'Rest carto')
  assert.equal(dataset.slug, 'rest-carto')
  assert.equal(dataset.finalizedAt, '2026-01-01T00:00:00.000Z')
  assert.ok(Array.isArray(dataset.schema))
  // fields outside the contract are never forwarded to the application
  assert.equal(dataset.owner, undefined)
  assert.equal(dataset.status, undefined)
  assert.equal(dataset.rest, undefined)
})

test('does not forward properties outside the contract, even for a minimal remote dataset', async () => {
  const dataset = await enrichDataset({ id: 'enrich-minimal' }, async () => ({ id: 'enrich-minimal', title: 'Mini' }))
  assert.deepEqual(dataset, { id: 'enrich-minimal', title: 'Mini', userPermissions: [] })
})

test('defaults userPermissions to an empty array on a read-protected dataset', async () => {
  const dataset = await enrichDataset({ id: 'enrich-noperm' }, async () => ({ id: 'enrich-noperm', isRest: true, title: 'Private' }))
  assert.deepEqual(dataset.userPermissions, [])
  assert.equal(dataset.isRest, true)
})

test('keeps the raw configuration entry when the remote dataset cannot be fetched', async () => {
  const originalWarn = console.warn
  console.warn = () => {}
  try {
    const input = { id: 'enrich-fail', href: REMOTE_ORIGIN + '/api/v1/datasets/enrich-fail' }
    const dataset = await enrichDataset(input, async () => { throw new Error('401 unauthorized') })
    assert.deepEqual(dataset, input)
  } finally {
    console.warn = originalWarn
  }
})

test('ignores a dataset entry without id', async () => {
  const input = { href: REMOTE_ORIGIN + '/api/v1/datasets/no-id' }
  assert.equal(await enrichDataset(input, async () => remoteDataset('no-id')), input)
})

test('covers the properties production injects, so the list cannot silently drift', () => {
  // the union of the dataset selects declared by the published applications: production forwards
  // each of them, so omitting one makes an application work there and not here
  for (const prop of ['isRest', 'userPermissions', 'schema', 'finalizedAt', 'slug', 'bbox', 'timePeriod', 'attachmentsAsImage', 'count']) {
    assert.ok(INJECTED_DATASET_PROPS.includes(prop as any), 'missing property ' + prop)
  }
})

test('injects the properties carried by map, calendar and list selects', async () => {
  const dataset = await enrichDataset({ id: 'enrich-selects' }, async () => ({
    id: 'enrich-selects',
    title: 'Carto',
    bbox: [-5, 47, -1, 48],
    timePeriod: { startDate: '2026-01-01', endDate: '2026-12-31' },
    attachmentsAsImage: true,
    count: 1200,
    owner: { type: 'user', id: 'someone' }
  }))
  assert.deepEqual(dataset.bbox, [-5, 47, -1, 48])
  assert.deepEqual(dataset.timePeriod, { startDate: '2026-01-01', endDate: '2026-12-31' })
  assert.equal(dataset.attachmentsAsImage, true)
  assert.equal(dataset.count, 1200)
  assert.equal(dataset.owner, undefined)
})

test('prepareConfig enriches the datasets and rewrites the remote origin', async () => {
  const result = await prepareConfig({
    datasets: [{ id: 'prepare-ok', href: REMOTE_ORIGIN + '/data-fair/api/v1/datasets/prepare-ok' }]
  }, {
    fetchJson: async () => remoteDataset('prepare-ok'),
    localize: localizeConfig,
    remoteOrigin: REMOTE_ORIGIN,
    localOrigin: LOCAL_ORIGIN
  })
  assert.equal(result.datasets[0].isRest, true)
  assert.deepEqual(result.datasets[0].userPermissions, ['readLines', 'createLine', 'updateLine', 'patchLine', 'deleteLine'])
  assert.equal(result.datasets[0].href, LOCAL_ORIGIN + '/data-fair/api/v1/datasets/prepare-ok')
})

test('prepareConfig leaves a configuration without datasets untouched', async () => {
  const configuration = { map: { zoom: 5 } }
  const result = await prepareConfig(configuration, {
    fetchJson: async () => { throw new Error('should not fetch') },
    localize: localizeConfig,
    remoteOrigin: REMOTE_ORIGIN,
    localOrigin: LOCAL_ORIGIN
  })
  assert.deepEqual(result, configuration)
})
