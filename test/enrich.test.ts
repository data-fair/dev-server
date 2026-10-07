import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enrichDataset, datasetsFiltersFromSchema, prepareConfig, type DatasetFilter } from '../src/enrich.ts'
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

const SELECT_ALL: DatasetFilter = { select: ['title', 'schema', 'isRest', 'userPermissions', 'bbox'] }

// the dataset ids below are all distinct: the enrichment cache (module-level, 30s ttl)
// would otherwise make a test depend on a previous one
test('injects finalizedAt, slug and the selected properties, nothing else', async () => {
  const dataset = await enrichDataset({ id: 'enrich-ok', href: REMOTE_ORIGIN + '/api/v1/datasets/enrich-ok' }, async () => remoteDataset('enrich-ok'), SELECT_ALL)
  assert.equal(dataset.isRest, true)
  assert.deepEqual(dataset.userPermissions, ['readLines', 'createLine', 'updateLine', 'patchLine', 'deleteLine'])
  assert.equal(dataset.title, 'Rest carto')
  assert.equal(dataset.slug, 'rest-carto')
  assert.equal(dataset.finalizedAt, '2026-01-01T00:00:00.000Z')
  assert.ok(Array.isArray(dataset.schema))
  // selected but absent from the remote dataset: not invented
  assert.equal('bbox' in dataset, false)
  // fields outside the select are never forwarded to the application
  assert.equal(dataset.owner, undefined)
  assert.equal(dataset.status, undefined)
  assert.equal(dataset.rest, undefined)
})

test('without a select, only refreshes the stored keys plus finalizedAt and slug', async () => {
  const dataset = await enrichDataset({ id: 'enrich-noselect', title: 'Old title' }, async () => remoteDataset('enrich-noselect'))
  assert.deepEqual(dataset, { id: 'enrich-noselect', title: 'Rest carto', slug: 'rest-carto', finalizedAt: '2026-01-01T00:00:00.000Z' })
})

test('refreshes a stored userPermissions, defaulting to an empty array', async () => {
  const dataset = await enrichDataset({ id: 'enrich-noperm', userPermissions: ['readLines'] }, async () => ({ id: 'enrich-noperm', title: 'Private' }))
  assert.deepEqual(dataset.userPermissions, [])
})

test('applies the default and const of the selector properties', async () => {
  const dataset = await enrichDataset({ id: 'enrich-props', mode: 'user' }, async () => ({ id: 'enrich-props' }), {
    properties: { kind: { default: 'points' }, mode: { const: 'forced' }, title: { type: 'string' } }
  })
  assert.equal(dataset.kind, 'points')
  assert.equal(dataset.mode, 'forced')
  assert.equal('title' in dataset, false)
})

test('keeps the raw configuration entry when the remote dataset cannot be fetched', async () => {
  const originalWarn = console.warn
  console.warn = () => {}
  try {
    const input = { id: 'enrich-fail', href: REMOTE_ORIGIN + '/api/v1/datasets/enrich-fail' }
    const dataset = await enrichDataset(input, async () => { throw new Error('401 unauthorized') }, SELECT_ALL)
    assert.deepEqual(dataset, input)
  } finally {
    console.warn = originalWarn
  }
})

test('ignores a dataset entry without id', async () => {
  const input = { href: REMOTE_ORIGIN + '/api/v1/datasets/no-id' }
  assert.equal(await enrichDataset(input, async () => remoteDataset('no-id')), input)
})

/* eslint-disable no-template-curly-in-string -- the urls below are vjsf expressions, not js templates */
test('deduces the selects from the config schema like data-fair', () => {
  // a single selector, through a $ref and allOf, with a getItems url as a string
  assert.deepEqual(datasetsFiltersFromSchema({
    allOf: [{ properties: { datasets: { $ref: '#/definitions/datasets' } } }],
    definitions: {
      datasets: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } }, layout: { getItems: { url: '${context.dataFairUrl}/api/v1/datasets?status=finalized&select=id,title,schema' } } } }
    }
  }), [{ select: ['id', 'title', 'schema'], properties: { id: { type: 'string' } } }])
  // a tuple of selectors: one filter per position, expr urls and x-fromUrl alike
  assert.deepEqual(datasetsFiltersFromSchema({
    properties: {
      datasets: {
        type: 'array',
        items: [
          { layout: { getItems: { url: { expr: 'api/v1/datasets?select=id,bbox&owner=${context.owner.type}' } } } },
          { 'x-fromUrl': 'api/v1/datasets?q={q}&select=id,isRest' }
        ]
      }
    }
  }), [{ select: ['id', 'bbox'] }, { select: ['id', 'isRest'] }])
  // no selector, or no schema at all: nothing selected
  assert.deepEqual(datasetsFiltersFromSchema({ properties: { title: { type: 'string' } } }), [])
  assert.deepEqual(datasetsFiltersFromSchema(null), [])
})

/* eslint-enable no-template-curly-in-string */

const schemaSelecting = (select: string) => async () => ({
  properties: { datasets: { type: 'array', items: { layout: { getItems: { url: 'api/v1/datasets?select=' + select } } } } }
})

test('prepareConfig enriches the datasets with the schema selects and rewrites the remote origin', async () => {
  const result = await prepareConfig({
    datasets: [{ id: 'prepare-ok', href: REMOTE_ORIGIN + '/data-fair/api/v1/datasets/prepare-ok' }]
  }, {
    fetchJson: async () => remoteDataset('prepare-ok'),
    fetchConfigSchema: schemaSelecting('id,isRest,userPermissions'),
    localize: localizeConfig,
    remoteOrigin: REMOTE_ORIGIN,
    localOrigin: LOCAL_ORIGIN
  })
  assert.equal(result.datasets[0].isRest, true)
  assert.deepEqual(result.datasets[0].userPermissions, ['readLines', 'createLine', 'updateLine', 'patchLine', 'deleteLine'])
  // the schema is not selected: production does not send it, neither do we
  assert.equal(result.datasets[0].schema, undefined)
  assert.equal(result.datasets[0].href, LOCAL_ORIGIN + '/data-fair/api/v1/datasets/prepare-ok')
})

test('prepareConfig adds the extra select of a dev-server tool, and survives a missing schema', async () => {
  const result = await prepareConfig({ datasets: [{ id: 'prepare-extra' }] }, {
    fetchJson: async () => remoteDataset('prepare-extra'),
    fetchConfigSchema: async () => { throw new Error('404') },
    extraSelect: ['schema'],
    localize: localizeConfig,
    remoteOrigin: REMOTE_ORIGIN,
    localOrigin: LOCAL_ORIGIN
  })
  assert.ok(Array.isArray(result.datasets[0].schema))
  assert.equal(result.datasets[0].isRest, undefined)
})

test('prepareConfig leaves a configuration without datasets untouched', async () => {
  const configuration = { map: { zoom: 5 } }
  const result = await prepareConfig(configuration, {
    fetchJson: async () => { throw new Error('should not fetch') },
    fetchConfigSchema: async () => { throw new Error('should not fetch') },
    localize: localizeConfig,
    remoteOrigin: REMOTE_ORIGIN,
    localOrigin: LOCAL_ORIGIN
  })
  assert.deepEqual(result, configuration)
})
