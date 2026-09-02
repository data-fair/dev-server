// Rebuild the configuration dataset entries the same way data-fair does in production
// (refreshConfigDatasetsRefs in api/src/applications/utils.ts): an application stores only
// minimal dataset references, data-fair injects the full schema (with concepts), finalizedAt,
// slug, isRest and the per-request userPermissions at serving time. We reproduce that so
// applications following the skill contract read window.APPLICATION.configuration.datasets
// identically in dev and in prod.
//
// Pure module, no imports: it takes its remote accessor and origin rewrite as dependencies,
// wired in app.ts — so it can be unit tested without a build (test/enrich.test.ts).

// Short-lived cache for the dataset enrichment below, so that every preview reload does not
// hammer the remote data-fair API. Failures are cached too: a private dataset without an api
// key would otherwise be re-fetched, and re-warned about, on every single reload.
const datasetsCache = new Map<string, { data: any, fetchedAt: number }>()
const DATASETS_CACHE_TTL = 30_000

// The set of properties data-fair injects in a configuration dataset entry. Sticking to it
// matters in both directions: forwarding the whole remote dataset would let an application rely,
// in dev, on a property production never sends — and omitting one production does send makes an
// application work in production and not here, which is worse still.
//
// data-fair derives the set per request (refreshConfigDatasetsRefs, api/src/applications/utils.ts):
// the keys already stored in the entry, plus `finalizedAt` and `slug`, plus the `select` of the
// dataset selector declared in the application's own config schema. We cannot derive it without
// parsing that schema, so this list mirrors it and has to track it: it is the union of the
// selects used by the published applications. `isRest` gates whether rest line editing
// (POST/PATCH/DELETE /lines) is offered at all; `bbox` and `timePeriod` drive the initial map
// bounds and period pickers; `attachmentsAsImage` switches list apps to thumbnail mode.
export const INJECTED_DATASET_PROPS = ['id', 'href', 'page', 'title', 'slug', 'finalizedAt', 'schema', 'isRest', 'userPermissions', 'bbox', 'timePeriod', 'attachmentsAsImage', 'count'] as const

export const enrichDataset = async (dataset: any, fetchJson: (path: string) => Promise<any>) => {
  if (!dataset?.id) return dataset
  const cached = datasetsCache.get(dataset.id)
  if (cached && Date.now() - cached.fetchedAt < DATASETS_CACHE_TTL) {
    return cached.data ? { ...dataset, ...cached.data } : dataset
  }
  try {
    const fresh = await fetchJson('/datasets/' + encodeURIComponent(dataset.id))
    const data: Record<string, any> = {}
    for (const prop of INJECTED_DATASET_PROPS) {
      if (fresh[prop] !== undefined) data[prop] = fresh[prop]
    }
    data.userPermissions = fresh.userPermissions ?? []
    datasetsCache.set(dataset.id, { data, fetchedAt: Date.now() })
    return { ...dataset, ...data }
  } catch (err) {
    // a private dataset without an api key, or a network failure: keep the raw
    // configuration entry so the app still loads, and warn in the dev-server UI
    console.warn('[dev-server] failed to enrich dataset ' + dataset.id + ', keeping raw configuration entry', err)
    datasetsCache.set(dataset.id, { data: null, fetchedAt: Date.now() })
    return dataset
  }
}

export interface PrepareConfigDeps {
  fetchJson: (path: string) => Promise<any>
  localize: (configuration: any, remoteOrigin: string, localOrigin: string) => any
  remoteOrigin: string
  localOrigin: string
}

// Enrich the datasets from the remote data-fair, then rewrite every remote origin to ours.
// The rewrite is applied even when there is no dataset to enrich: a configuration can carry
// remote urls anywhere (logos, links, tileserver styles), not only in datasets[].href.
export const prepareConfig = async (configuration: any, deps: PrepareConfigDeps) => {
  const datasets = configuration?.datasets?.filter((d: any) => !!d)
  const enriched = datasets?.length
    ? { ...configuration, datasets: await Promise.all((datasets as any[]).map(d => enrichDataset(d, deps.fetchJson))) }
    : configuration
  return deps.localize(enriched, deps.remoteOrigin, deps.localOrigin)
}
