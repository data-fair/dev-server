// Rebuild the configuration dataset entries the same way data-fair does in production
// (refreshConfigDatasetsRefs in api/src/applications/utils.ts): an application stores only
// minimal dataset references, data-fair refreshes them at serving time with the keys already
// stored in the entry, plus `finalizedAt` and `slug`, plus the `select` of the dataset selector
// declared in the application's config schema (baseApp.datasetsFilters, deduced by initBaseApp in
// api/src/base-applications/service.ts). Nothing more: an application that reads a property its
// selector does not ask for works here only if it works in production too.
//
// Pure module, no imports: it takes its remote accessor and origin rewrite as dependencies,
// wired in app.ts — so it can be unit tested without a build (test/enrich.test.ts).

export interface DatasetFilter {
  select?: string[]
  properties?: Record<string, any>
}

// Short-lived cache for the dataset enrichment below, so that every preview reload does not
// hammer the remote data-fair API. Failures are cached too: a private dataset without an api
// key would otherwise be re-fetched, and re-warned about, on every single reload.
const datasetsCache = new Map<string, { data: any, fetchedAt: number }>()
const DATASETS_CACHE_TTL = 30_000

// data-fair's resolveLocalRefs (api/src/misc/utils/json-refs.ts): "#/..." pointers replaced by
// their target, circular and unresolvable ones left as they are.
const resolveLocalRefs = (root: any) => {
  const atPointer = (pointer: string) => pointer.split('/').slice(1)
    .map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((o, k) => (o !== null && typeof o === 'object') ? o[k] : undefined, root)
  const walk = (node: any, stack: string[]): any => {
    if (Array.isArray(node)) return node.map(n => walk(n, stack))
    if (node === null || typeof node !== 'object') return node
    if (typeof node.$ref === 'string' && node.$ref.startsWith('#')) {
      if (stack.includes(node.$ref)) return node
      const target = atPointer(node.$ref)
      if (target === undefined) return node
      return walk(target, [...stack, node.$ref])
    }
    const res: any = {}
    for (const [k, v] of Object.entries(node)) res[k] = walk(v, stack)
    return res
  }
  return walk(root, [])
}

// data-fair's getFragmentFetchUrl (api/src/base-applications/operations.ts)
const fragmentFetchUrl = (fragment: any): string | null => {
  if (!fragment) return null
  if (fragment['x-fromUrl']) return fragment['x-fromUrl']
  const url = fragment.layout?.getItems?.url
  if (url) return typeof url === 'string' ? url : url.expr
  return null
}

// The datasetsFilters data-fair stores on the base application, one per dataset selector of the
// config schema, matched by position with configuration.datasets. Like data-fair, a schema that
// cannot be read gives no filter at all.
export const datasetsFiltersFromSchema = (configSchema: any): DatasetFilter[] => {
  try {
    const schema = resolveLocalRefs(configSchema)
    const definition = schema?.properties?.datasets ?? schema?.allOf?.[0]?.properties?.datasets
    if (!definition) return []
    let fetches: { fromUrl: string, properties?: Record<string, any> }[] = []
    if (definition.items && fragmentFetchUrl(definition)) fetches = [{ fromUrl: fragmentFetchUrl(definition)!, properties: definition.items.properties }]
    if (fragmentFetchUrl(definition.items)) fetches = [{ fromUrl: fragmentFetchUrl(definition.items)!, properties: definition.items.properties }]
    if (Array.isArray(definition.items)) fetches = definition.items.filter((item: any) => fragmentFetchUrl(item)).map((item: any) => ({ fromUrl: fragmentFetchUrl(item)!, properties: item.properties }))
    return fetches.map(({ fromUrl, properties }) => {
      const select = new URL(fromUrl, 'http://localhost').searchParams.get('select')
      return { ...(select ? { select: select.split(',') } : {}), ...(properties ? { properties } : {}) }
    })
  } catch {
    return []
  }
}

const fetchFreshDataset = async (id: string, fetchJson: (path: string) => Promise<any>) => {
  const cached = datasetsCache.get(id)
  if (cached && Date.now() - cached.fetchedAt < DATASETS_CACHE_TTL) return cached.data
  try {
    const fresh = await fetchJson('/datasets/' + encodeURIComponent(id))
    datasetsCache.set(id, { data: fresh, fetchedAt: Date.now() })
    return fresh
  } catch (err) {
    // a private dataset without an api key, or a network failure: keep the raw
    // configuration entry so the app still loads, and warn in the dev-server UI
    console.warn('[dev-server] failed to enrich dataset ' + id + ', keeping raw configuration entry', err)
    datasetsCache.set(id, { data: null, fetchedAt: Date.now() })
    return null
  }
}

export const enrichDataset = async (dataset: any, fetchJson: (path: string) => Promise<any>, filter: DatasetFilter = {}) => {
  if (!dataset?.id) return dataset
  const fresh = await fetchFreshDataset(dataset.id, fetchJson)
  const result = { ...dataset }
  if (fresh) {
    for (const key of [...Object.keys(dataset), 'finalizedAt', 'slug', ...(filter.select ?? [])]) {
      if (key === 'userPermissions') result.userPermissions = fresh.userPermissions ?? []
      else if (key in fresh) result[key] = fresh[key]
      else if (key === 'partOf') delete result.partOf
    }
  }
  for (const [key, prop] of Object.entries(filter.properties ?? {})) {
    if (prop?.default && !(key in result)) result[key] = prop.default
    if (prop?.const) result[key] = prop.const
  }
  return result
}

export interface PrepareConfigDeps {
  fetchJson: (path: string) => Promise<any>
  // the config schema of the application under development, the source of the dataset selects
  fetchConfigSchema: () => Promise<any>
  // properties to inject on top of the selects, for a dev-server tool that needs them whatever
  // the application asks for (the filter tester lists the schema fields)
  extraSelect?: string[]
  localize: (configuration: any, remoteOrigin: string, localOrigin: string) => any
  remoteOrigin: string
  localOrigin: string
}

// Enrich the datasets from the remote data-fair, then rewrite every remote origin to ours.
// The rewrite is applied even when there is no dataset to enrich: a configuration can carry
// remote urls anywhere (logos, links, tileserver styles), not only in datasets[].href.
export const prepareConfig = async (configuration: any, deps: PrepareConfigDeps) => {
  const datasets = configuration?.datasets?.filter((d: any) => !!d)
  let enriched = configuration
  if (datasets?.length) {
    const filters = datasetsFiltersFromSchema(await deps.fetchConfigSchema().catch(() => null))
    enriched = {
      ...configuration,
      datasets: await Promise.all((datasets as any[]).map((d, i) => {
        const filter = filters[i] ?? {}
        return enrichDataset(d, deps.fetchJson, deps.extraSelect ? { ...filter, select: [...(filter.select ?? []), ...deps.extraSelect] } : filter)
      }))
    }
  }
  return deps.localize(enriched, deps.remoteOrigin, deps.localOrigin)
}
