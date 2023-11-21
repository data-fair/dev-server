// this composable reads from window.APPLICATION (set in index.html)
// it performs some pre-checks on the configuration
// it applies types from @data-fair/lib or built using the config schema

export default function useAppInfo () {
  // @ts-ignore
  const application = /** @type {import('@data-fair/lib/shared/application.js').Application} */(window.APPLICATION)
  const config = /** @type {import('../config/.type/types.js').Config | undefined} */(application.configuration)
  if (!config) throw new Error('Il n\'y a pas de configuration définie')
  const dataset = config.datasets?.[0]
  if (!dataset) throw new Error('Veuillez sélectionner une source de données')

  return {
    application,
    config,
    dataset,
    datasetUrl: dataset.href
  }
}
