// Configurations are stored with their remote (koumoul.com) origins so that .dev-config.json
// stays portable across developers, machines and regenerated ports. Origins are rewritten here,
// on the read path, on the way to the application — never on the write path.

// Paths the dev-server re-exposes under its own origin.
const PROXIED_PATHS = ['/data-fair', '/simple-directory', '/tileserver']

// Transition rewrite: .dev-config.json files written before this change carry a hardcoded
// http://localhost:5888 origin. Only rewrite one when it stands on a path we actually proxy,
// and only when that path is complete — a deliberate http://localhost:8080/data-fair-lookalike
// typed by a developer must survive untouched.
const legacyLocalOrigin = new RegExp(
  `http://localhost:\\d+(?=(?:${PROXIED_PATHS.join('|')})(?:/|"))`,
  'g'
)

export const localizeConfig = <T>(configuration: T, remoteOrigin: string, localOrigin: string): T => {
  const json = JSON.stringify(configuration)
  if (json === undefined) return configuration
  return JSON.parse(json.replaceAll(remoteOrigin, localOrigin).replace(legacyLocalOrigin, localOrigin))
}
