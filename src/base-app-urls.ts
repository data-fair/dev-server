// Candidate urls of the base application under development.
//
// Discovering it by name is the authoritative path, but it only works for a base application
// the request is allowed to see: one restricted to an organization is invisible to an anonymous
// request, while the applications running on it are often public — which is precisely the case
// of an application developed for a single customer. The /applications listing filters on an
// exact url, so a wrong candidate returns nothing and a right one returns the applications: a
// guess can never produce a false match, and they all fit in a single request.
//
// The two conventions published base applications follow, as of today:
//   https://koumoul.com/apps/<slug>/<minor>/
//   https://cdn.jsdelivr.net/npm/@scope/<package>@<minor>/dist/
// The slug is the repository name, which is not always the application name — "Liste et fiches"
// is served under /apps/list-details/ — so both are tried, along with the package name stripped
// of the prefixes repositories use.

const slugs = (appName: string, packageName?: string) => {
  const candidates = [appName]
  if (packageName) {
    const unscoped = packageName.startsWith('@') ? packageName.slice(packageName.indexOf('/') + 1) : packageName
    candidates.push(unscoped, unscoped.replace(/^(app|data-fair)-/, ''))
  }
  return [...new Set(candidates.filter(Boolean))]
}

export const candidateBaseAppUrls = (dataFairUrl: string, appName: string, packageName: string | undefined, minorVersion: string) => {
  const urls: string[] = []
  // the same origin as the data-fair the dev-server talks to: a base application is served
  // beside it, never on some unrelated host
  const origin = new URL(dataFairUrl).origin
  for (const slug of slugs(appName, packageName)) {
    urls.push(`${origin}/apps/${slug}/${minorVersion}/`)
  }
  if (packageName) {
    const scoped = packageName.startsWith('@') ? packageName : '@data-fair/' + packageName
    urls.push(`https://cdn.jsdelivr.net/npm/${scoped}@${minorVersion}/dist/`)
  }
  return urls
}
