#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { parseArgs } from 'node:util'
import { MIN_BASE, MAX_BASE, renderEnv, findBase, readEnvVar } from './env-file.js'

const { values } = parseArgs({
  options: {
    force: { type: 'boolean', default: false },
    // No default value: an absent --app-path must stay distinguishable from an explicit one, so
    // that --force can redraw the ports without resetting a path the developer chose.
    'app-path': { type: 'string' }
  }
})

const existing = existsSync('.env') ? readFileSync('.env', 'utf8') : undefined
const storedAppPath = existing === undefined ? undefined : readEnvVar(existing, 'APP_PATH')

if (existing !== undefined && !values.force) {
  // An existing .env is left untouched — but say so when leaving it untouched is not what the
  // caller expected, rather than letting the application start on the wrong port or path.
  if (readEnvVar(existing, 'APP_PORT') === undefined) {
    console.warn('.env existe déjà mais ne porte pas APP_PORT : y ajouter les lignes de port à la main, ou df-dev-env --force')
  } else if (values['app-path'] !== undefined && values['app-path'] !== storedAppPath) {
    console.warn(`.env existe déjà avec APP_PATH=${storedAppPath} : --app-path=${values['app-path']} est ignoré, df-dev-env --force pour l'appliquer`)
  }
  process.exit(0)
}

const isFree = (port: number) => new Promise<boolean>(resolve => {
  const server = createServer()
  server.once('error', () => { resolve(false) })
  server.once('listening', () => { server.close(() => { resolve(true) }) })
  server.listen(port, '127.0.0.1')
})

const draw = () => MIN_BASE + Math.floor(Math.random() * (MAX_BASE - MIN_BASE + 1))

// --force is the documented remedy for a port collision: it must not silently move an
// application served at the root back under /app/ along the way.
const appPath = values['app-path'] ?? storedAppPath ?? '/app/'

const base = await findBase(isFree, draw)
writeFileSync('.env', renderEnv(base, appPath))
console.log(`.env généré — app ${base}, dev-server ${base + 1}, e2e ${base + 2}, chemin ${appPath || '/ (racine)'}`)
