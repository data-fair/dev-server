// Express app for TaxMan own API and UI

import config from './config.js'
import uiConfig from './ui-config.js'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import debugModule from 'debug'
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware'
import * as parse5 from 'parse5'
import chalk from 'chalk'
import { isElementNode, createTextNode, createElement, appendChild } from '@parse5/tools'
import escapeStringRegexp from 'escape-string-regexp'
import eventPromise from '@data-fair/lib-utils/event-promise.js'
import { createSpaMiddleware } from '@data-fair/lib-express/serve-spa.js'
import { resolve } from 'node:path'

const debug = debugModule('df-dev-server')

const app = express()
const server = createServer(app)

// web socket server, used both by dev-server UI (opened on / path)
// and by application (opened on /data-fair), in this case we transmit all messages to and from data-fair
const wss = new WebSocketServer({ noServer: true })
let devServerWS: WebSocket[] = []
let dataFairWS: WebSocket[] = []
const dataFairWSChannels = new Map<WebSocket, string[]>()

const dfWsUrl = config.dataFair.url.replace('http://', 'ws://').replace('https://', 'wss://') + '/'
const dataFairOutputWS = new WebSocket(dfWsUrl)
dataFairOutputWS.on('open', () => {
  debug('connect to external websocket server ' + dfWsUrl)
})
dataFairOutputWS.on('message', (data) => {
  const dataStr = data.toString()
  const message = JSON.parse(dataStr)
  debug('incoming message from data-fair socket', message)
  for (const ws of dataFairWS) {
    if (dataFairWSChannels.get(ws)?.includes(message.channel)) {
      ws.send(dataStr)
    }
  }
})
dataFairOutputWS.on('error', (err) => console.error('failed to connect to external websocket server', dfWsUrl, err))
dataFairOutputWS.on('close', () => console.error('external websocket was closed', dfWsUrl))

server.on('upgrade', function upgrade (req, socket, head) {
  wss.handleUpgrade(req, socket, head, (ws) => {
    debug('Opening websocket ' + req.url)
    if (req.url === '/data-fair' || req.url === '/data-fair/') {
      dataFairWS.push(ws)
      ws.on('close', () => { dataFairWS = dataFairWS.filter(_ws => _ws !== ws) })
      ws.on('message', (data: string) => {
        if (dataFairOutputWS) {
          const message = JSON.parse(data)
          debug('outgoing message to data-fair socket', message)
          if (message.type === 'subscribe') {
            dataFairWSChannels.set(ws, (dataFairWSChannels.get(ws) ?? []).concat([message.channel]))
            if (config.dataFair.apiKey) message.apiKey = config.dataFair.apiKey
          }
          if (message.type === 'unsubscribe') {
            dataFairWSChannels.set(ws, (dataFairWSChannels.get(ws) ?? []).filter(c => c !== message.channel))
          }
          dataFairOutputWS.send(JSON.stringify(message))
        }
      })
    } else if (req.url === '/') {
      debug('connect main dev-server WS')
      devServerWS.push(ws)
      ws.on('close', () => { devServerWS = devServerWS.filter(_ws => _ws !== ws) })
    } else {
      console.warn('ignore WebSocket to path not managed by dev-server', req.url)
    }
    wss.emit('connection', ws, req)

    ws.on('error', () => ws.terminate())
  })
})

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// URL of the app under development, used by the proxy and by the remote configuration import
const appUrl = new URL(config.app.url)
const appPrefix = appUrl.pathname.endsWith('/') ? appUrl.pathname.substring(0, appUrl.pathname.length - 1) : appUrl.pathname

// very basic CRUD of config
app.get('/config', (req, res, next) => {
  const devConfig = readDevConfig()
  debug('read dev config', devConfig)
  res.send(devConfig)
})

// the config with datasets enriched from the remote data-fair, so the dev-server UI
// can display schemas/concepts and build concept & dataset filter params with the
// exact same data as the application receives in window.APPLICATION
app.get('/config/enriched', async (req, res) => {
  try {
    res.send(await refreshConfigDatasets(readDevConfig()))
  } catch (err: any) {
    res.status(500).send({ error: err.message })
  }
})

app.put('/config', (req, res, next) => {
  debug('save dev config', req.body)
  writeFileSync('.dev-config.json', JSON.stringify(req.body, null, 2))
  res.send(req.body)
})
app.post('/config/error', (req, res) => {
  console.log('Application sent an error', req.body)
  for (const ws of devServerWS) {
    ws.send(JSON.stringify({ type: 'app-error', data: req.body }))
  }
  res.send()
})

// Identification of the app under development: its name is read from the
// "application-name" meta tag of the local index.html and its version from the
// package.json of the current directory.
const localAppInfo = async () => {
  let name: string | undefined
  try {
    const res = await fetch(appUrl.origin + appPrefix + '/index.html')
    const html = await res.text()
    const document: any = parse5.parse(html)
    const htmlNode = document.childNodes?.find((c: any) => c.tagName === 'html')
    const headNode = htmlNode?.childNodes?.find((c: any) => c.tagName === 'head')
    const metaNode = (headNode?.childNodes ?? []).find((c: any) => c.tagName === 'meta' && c.attrs?.find((a: any) => a.name === 'name')?.value === 'application-name')
    name = metaNode?.attrs?.find((a: any) => a.name === 'content')?.value
  } catch (err) {
    debug('failed to fetch local app index.html', err)
  }
  let version: string | undefined
  try {
    version = JSON.parse(readFileSync('package.json', 'utf8')).version
  } catch (err) {
    debug('failed to read local package.json', err)
  }
  return { name, version }
}

// Fetch a resource from the remote data-fair api
const remoteFetch = async (path: string) => {
  const res = await fetch(config.dataFair.url + '/api/v1' + path, {
    headers: config.dataFair.apiKey ? { 'x-apiKey': config.dataFair.apiKey } : {}
  })
  if (!res.ok) throw new Error(`error ${res.status} on remote data-fair: ${await res.text()}`)
  return res.json()
}

// Short-lived cache for the dataset enrichment below, so that every preview reload does not
// hammer the remote data-fair API. Failures are cached too: a private dataset without an api
// key would otherwise be re-fetched, and re-warned about, on every single reload.
const datasetsCache = new Map<string, { data: any, fetchedAt: number }>()
const DATASETS_CACHE_TTL = 30_000

// The exact set of properties data-fair injects in a configuration dataset entry. Sticking to
// it matters: forwarding the whole remote dataset would let an application rely, in dev, on a
// property that production never sends.
const INJECTED_DATASET_PROPS = ['id', 'href', 'page', 'title', 'slug', 'finalizedAt', 'schema', 'userPermissions'] as const

// Rebuild a configuration dataset entry the same way data-fair does in production
// (refreshConfigDatasetsRefs in api/src/applications/utils.ts): the app stores only
// minimal references, data-fair injects the full schema (with concepts), finalizedAt,
// slug and userPermissions at request time. We reproduce that so applications
// following the skill contract read window.APPLICATION.configuration.datasets
// identically in dev and in prod.
const enrichDataset = async (dataset: any) => {
  if (!dataset?.id) return dataset
  const cached = datasetsCache.get(dataset.id)
  if (cached && Date.now() - cached.fetchedAt < DATASETS_CACHE_TTL) {
    return cached.data ? { ...dataset, ...cached.data } : dataset
  }
  try {
    const fresh = await remoteFetch('/datasets/' + encodeURIComponent(dataset.id))
    const localBase = `http://localhost:${config.port}/data-fair`
    const data: Record<string, any> = {}
    for (const prop of INJECTED_DATASET_PROPS) {
      if (fresh[prop] !== undefined) data[prop] = fresh[prop]
    }
    if (typeof data.href === 'string') data.href = data.href.replace(config.dataFair.url, localBase)
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

const refreshConfigDatasets = async (configuration: any) => {
  const datasets = configuration?.datasets?.filter((d: any) => !!d)
  if (!datasets?.length) return configuration
  const enriched = await Promise.all(datasets.map(enrichDataset))
  return { ...configuration, datasets: enriched }
}

// read the .dev-config.json file of the app under development
const readDevConfig = () => existsSync('.dev-config.json') ? JSON.parse(readFileSync('.dev-config.json', 'utf8')) : {}

// Reproduce the waiting strategy of the capture service (capture/api/utils/page.ts) so that a
// timing regression shows up in development instead of in production. Defaults of the service:
// screenshotTimeout = 20s, gif cadenced at 15 fps, maxAnimationFrames = 1800 and a total budget
// of 2 x screenshotTimeout for the whole animation (capture + decoding + encoding included).
const SCREENSHOT_TIMEOUT = 20_000
const MAX_ANIMATION_FRAMES = 1800
const captureSimulationScript = (opts: { type: 'png' | 'gif', thumbnail: boolean, captureDelay?: string, legacyTrigger: boolean, testError: boolean }) => {
  // df:capture-delay is expressed in seconds and capped at screenshotTimeout: a value in
  // milliseconds silently means "wait the full timeout", which is worth showing as such.
  const declaredDelay = opts.captureDelay === undefined ? null : Number(opts.captureDelay)
  const delayMs = declaredDelay === null || isNaN(declaredDelay) ? null : Math.min(declaredDelay * 1000, SCREENSHOT_TIMEOUT)
  return `
;(function () {
  var TYPE = ${JSON.stringify(opts.type)}
  var DELAY_MS = ${delayMs === null ? 'null' : delayMs}
  var DECLARED_DELAY = ${JSON.stringify(opts.captureDelay ?? null)}
  var LEGACY_TRIGGER = ${opts.legacyTrigger}
  var TIMEOUT = ${SCREENSHOT_TIMEOUT}
  var MAX_FRAMES = ${MAX_ANIMATION_FRAMES}
  var ANIMATION_BUDGET = TIMEOUT * 2
  var triggerCalled = false

  // ?capture is our own switch, production has no equivalent: drop it from the URL before any
  // script of the app runs, so that reactiveSearchParams never sees a param it would not see in
  // production. thumbnail and capture-test-error stay, data-fair really sends those.
  try {
    var currentUrl = new URL(window.location.href)
    if (currentUrl.searchParams.has('capture')) {
      currentUrl.searchParams.delete('capture')
      window.history.replaceState(window.history.state, '', currentUrl.pathname + currentUrl.search + currentUrl.hash)
    }
  } catch (err) {
    console.warn('[capture] failed to clean the capture param from the url', err)
  }

  console.log('[capture] contexte de capture simulé : type=' + TYPE + ', ' +
    ${opts.thumbnail ? "'vignette par défaut (?thumbnail=true)'" : "'capture manuelle (pas de ?thumbnail)'"} +
    (DELAY_MS === null ? ', aucune attente déclarée' : ', df:capture-delay=' + DECLARED_DELAY))
  if (DELAY_MS !== null && isNaN(Number(DECLARED_DELAY))) {
    console.error('[capture] df:capture-delay="' + DECLARED_DELAY + '" n\\'est pas un nombre')
  } else if (DELAY_MS === TIMEOUT && Number(DECLARED_DELAY) > 60) {
    console.error('[capture] df:capture-delay="' + DECLARED_DELAY + '" s\\'exprime en SECONDES et est plafonnée à ' +
      (TIMEOUT / 1000) + 's : cette valeur vaut "attendre le timeout complet". Valeurs saines : 1 à 5.')
  }
  ${opts.testError
    ? 'setTimeout(function () { console.error(\'[capture] capture-test-error=true : le service ferait échouer la capture après 1s (chemin de test de santé)\') }, 1000)'
    : ''}

  function startAnimation () {
    if (typeof window.animateCaptureFrame !== 'function') {
      console.error('[capture] animateCaptureFrame n\\'est pas définie quand le trigger se résout : en production le page.evaluate du service lève et TOUTE la capture échoue. La définir AVANT d\\'appeler triggerCapture(true).')
      return
    }
    var frames = 0
    var start = Date.now()
    var interval = setInterval(function () {
      var elapsed = Date.now() - start
      if (elapsed > ANIMATION_BUDGET) {
        console.error('[capture] budget d\\'horloge dépassé (' + Math.round(elapsed / 1000) + 's > ' + (ANIMATION_BUDGET / 1000) +
          's = 2 x screenshotTimeout) après ' + frames + ' images : la capture réelle échouerait. Borner le nombre d\\'images indépendamment de la durée configurée.')
        clearInterval(interval)
        return
      }
      if (frames >= MAX_FRAMES) {
        console.error('[capture] arrêt après le nombre maximum d\\'images (' + MAX_FRAMES + ')')
        clearInterval(interval)
        return
      }
      frames++
      var stopped
      try {
        stopped = window.animateCaptureFrame()
      } catch (err) {
        console.error('[capture] animateCaptureFrame a levé, la capture réelle échouerait', err)
        clearInterval(interval)
        return
      }
      if (stopped) {
        console.log('[capture] animation terminée après ' + frames + ' images (' + (frames / 15).toFixed(1) +
          's de gif, ' + Math.round(elapsed / 1000) + 's de rendu ici — le service ajoute encore le décodage et l\\'encodage gifsicle dans le même budget)')
        clearInterval(interval)
      }
    }, 1000 / 15)
  }

  // page.exposeFunction returns a promise: an app that forgets the await gets a truthy value
  // whatever the real answer, cf. app-minimal. Resolving a promise here surfaces that bug.
  window.triggerCapture = function (animationSupported) {
    if (triggerCalled) console.warn('[capture] triggerCapture appelé plusieurs fois, le service ne retient que le premier appel')
    triggerCalled = true
    var animate = !!animationSupported && TYPE === 'gif'
    console.log('[capture] triggerCapture(' + animationSupported + ') -> ' + animate +
      (animationSupported && TYPE !== 'gif' ? ' (l\\'app supporte l\\'animation mais le service ne demande un gif que sur ?type=gif)' : ''))
    if (animate) startAnimation()
    else console.log('[capture] capture png immédiate de l\\'état courant')
    return Promise.resolve(animate)
  }

  // approximation of the networkidle0 of the service: no request for 500ms after load
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (triggerCalled) return
      if (DELAY_MS !== null) waitWithoutTrigger(DELAY_MS, 'df:capture-delay=' + DECLARED_DELAY + 's')
      else if (LEGACY_TRIGGER) waitWithoutTrigger(TIMEOUT, 'x-capture="trigger" (déprécié)')
      else {
        setTimeout(function () {
          if (triggerCalled) return
          console.warn('[capture] network idle et aucune attente déclarée : le service capture 1s plus tard, sans jamais avoir eu triggerCapture. Déclarer df:capture-delay et appeler triggerCapture.')
        }, 1000)
      }
    }, 500)
  })

  function waitWithoutTrigger (ms, why) {
    console.log('[capture] network idle sans triggerCapture, le service attend ' + Math.round(ms / 1000) + 's (' + why + ')')
    setTimeout(function () {
      if (triggerCalled) return
      console.error('[capture] triggerCapture n\\'a pas été appelé après ' + Math.round(ms / 1000) +
        's : chaque capture en production paiera cette attente. L\\'appeler sur TOUS les chemins terminaux — données prêtes, résultat vide, erreur de données, configuration invalide.')
    }, ms)
  }
})()
`
}

// extract the major.minor part of a version, versions on remote base apps look like "1.3"
const minorVersion = (version: string) => version.split('.').slice(0, 2).join('.')

// list configurations of the app under development that exist on the remote data-fair
// with the same minor version, useful to test quickly for regressions
app.get('/configurations', async (req, res) => {
  const { name, version } = await localAppInfo()
  const response: any = { appName: name, localVersion: version, remoteUrl: config.dataFair.url }
  if (!name) {
    res.status(400).send({ ...response, error: 'The "application-name" meta tag was not found in the local app index.html' })
    return
  }
  if (!version) {
    res.status(400).send({ ...response, error: 'The version could not be read from the local package.json' })
    return
  }
  response.minorVersion = minorVersion(version)
  try {
    const baseApps = await remoteFetch('/base-applications?applicationName=' + encodeURIComponent(name) + '&size=1000&count=false')
    const matchingBaseApps = (baseApps.results ?? []).filter((b: any) => typeof b.version === 'string' && minorVersion(b.version) === response.minorVersion)
    response.results = []
    for (const baseApp of matchingBaseApps) {
      const applications = await remoteFetch('/applications?base-application=' + encodeURIComponent(baseApp.url) + '&size=1000&count=false&select=id,title,owner')
      for (const application of applications.results ?? []) {
        response.results.push({ id: application.id, title: application.title, owner: application.owner, baseAppVersion: baseApp.version })
      }
    }
    response.results.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''))
    res.send(response)
  } catch (err: any) {
    res.status(500).send({ ...response, error: err.message })
  }
})

// copy a configuration from the remote data-fair, replacing all references to the
// remote origin by the local one so that data goes through the local proxies
app.get('/configurations/:id', async (req, res) => {
  try {
    const configuration = await remoteFetch('/applications/' + encodeURIComponent(req.params.id) + '/configuration')
    const remoteOrigin = new URL(config.dataFair.url).origin
    const localOrigin = `http://localhost:${config.port}`
    res.send(JSON.parse(JSON.stringify(configuration).replaceAll(remoteOrigin, localOrigin)))
  } catch (err: any) {
    res.status(500).send({ error: err.message })
  }
})

// the vite dev server of the app under development rewrites the root-relative URLs of
// index.html under the app base, so the /simple-directory/... links (_theme.css, _public.js)
// come back as <base>/simple-directory/... and would 404 on the app proxy below ;
// send them back to the /simple-directory proxy instead
if (appPrefix) {
  app.use(appPrefix + '/simple-directory', (req, res) => {
    res.redirect(307, '/simple-directory' + req.url)
  })
}

// re-expose the application performing similar modifications to the body as data-fair
app.use('/app', createProxyMiddleware({
  target: appUrl.origin,
  secure: false,
  changeOrigin: true,
  selfHandleResponse: true, // so that the onProxyRes takes care of sending the response
  on: {
    proxyReq (proxyReq, req, res) {
      proxyReq.path = appPrefix + proxyReq.path
      proxyReq.setHeader('Accept-Encoding', 'identity') // disable compression
    },
    proxyRes (proxyRes, req, res) {
      let configuration = readDevConfig()
      // console.log('inject config', configuration)
      const dataBuffers: Buffer[] = []
      proxyRes.on('data', (data) => { dataBuffers.push(data) })
      proxyRes.on('end', async () => {
        try {
          const rawBody = Buffer.concat(dataBuffers)

          // Only the HTML document is rewritten. Everything else — fonts, images, wasm, but also
          // any js/css we have no reason to touch — is forwarded byte for byte: decoding it as
          // utf8 replaces every invalid sequence with U+FFFD and destroys binary assets.
          const contentType = proxyRes.headers['content-type']
          if (!contentType?.includes('text/html')) {
            res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
            res.end(rawBody)
            return
          }

          let output = rawBody.toString()
          if (output.includes('%APPLICATION%')) {
            try {
              configuration = await refreshConfigDatasets(configuration)
            } catch (err) {
              console.warn('[dev-server] failed to enrich configuration datasets', err)
            }
            const filledBody = output.replace(/%APPLICATION%/g, JSON.stringify({
              id: 'dev-application',
              slug: 'dev-application',
              title: 'Dev application',
              configuration,
              exposedUrl: `http://localhost:${config.port}/app`,
              href: `http://localhost:${config.port}/config`,
              apiUrl: `http://localhost:${config.port}/data-fair/api/v1`,
              wsUrl: `ws://localhost:${config.port}/data-fair`,
              owner: config.dataFair && config.dataFair.owner
            }))
            const document = parse5.parse(filledBody)
            const html = document.childNodes.filter(isElementNode).find(c => c.tagName === 'html')
            if (!html) throw new Error('HTML structure is broken, expect html, head and body elements')
            const headNode = html.childNodes.filter(isElementNode).find(c => c.tagName === 'head')
            const bodyNode = html.childNodes.filter(isElementNode).find(c => c.tagName === 'body')
            if (!headNode || !bodyNode) throw new Error('HTML structure is broken, expect html, head and body elements')

            const meta: Record<string, string> = {}
            for (const node of headNode.childNodes.filter(isElementNode)) {
              if (node.tagName === 'meta') {
                const name = node.attrs.find(a => a.name === 'name')?.value
                const content = node.attrs.find(a => a.name === 'content')?.value
                if (name !== undefined && content !== undefined) meta[name] = content
              }
            }

            // simulate the instrumentation of the capture service.
            // ?thumbnail=true is the default thumbnail context (data-fair only adds it when the
            // request carries no other param, cf. isDefaultThumbnail) ; ?capture=png|gif is a
            // dev-server only switch so that a manual capture — which has triggerCapture but no
            // thumbnail param in production — can be simulated too.
            // @ts-ignore
            const query: Record<string, string> = req.query
            const captureType = query.capture === 'gif' ? 'gif' : 'png'
            if (query.thumbnail === 'true' || query.capture) {
              const script = createElement('script', { type: 'text/javascript' })
              // appendChild, not childNodes.push: the parse5 serializer decides to escape a text
              // node from its parent, and would turn every && of the script into &amp;&amp;
              appendChild(script, createTextNode(captureSimulationScript({
                type: captureType,
                thumbnail: query.thumbnail === 'true',
                captureDelay: meta['df:capture-delay'],
                legacyTrigger: meta['x-capture'] === 'trigger',
                testError: query['capture-test-error'] === 'true'
              })))
              // the real service installs triggerCapture through page.exposeFunction, before
              // page.goto : it exists before any script of the document, including the inline
              // %APPLICATION% one. Inject first so that testing !!window.triggerCapture is as
              // reliable here as in production.
              headNode.childNodes.unshift(script)
            }

            // companion script that lets the embedded app report its height / sync params
            // to the parent <d-frame> ; injected for every mode so the UI mode toggle works
            // without requiring a df:overflow meta (same variant & version as data-fair prod)
            bodyNode.childNodes.push(createElement('script', {
              type: 'text/javascript',
              src: 'https://cdn.jsdelivr.net/npm/@data-fair/frame@0.18/dist/v-iframe-compat/d-frame-content.min.js'
            }))

            output = parse5.serialize(document)

            // proxyRes.headers['content-length'] = output.length
            delete proxyRes.headers['content-length']
            delete proxyRes.headers['last-modified']
            delete proxyRes.headers['max-age']
            delete proxyRes.headers.etag
            proxyRes.headers['cache-control'] = 'no-cache'
          }
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
          res.end(output)
        } catch (err: any) {
          console.error(err)
          res.writeHead(500)
          res.end(err.message)
        }
      })
    }
  }
}))

for (const proxyPath of config.app.proxyPaths) {
  app.use(proxyPath, createProxyMiddleware({
    target: appUrl.origin,
    secure: false,
    changeOrigin: true,
    ws: true
  }))
}

// re-expose a data-fair instance to access datasets, etc.
const dfUrl = new URL(config.dataFair.url)
app.use('/data-fair', createProxyMiddleware({
  target: dfUrl.origin,
  secure: false,
  changeOrigin: true,
  selfHandleResponse: true, // so that the onProxyRes takes care of sending the response
  on: {
    proxyReq (proxyReq, req, res) {
      proxyReq.path = '/data-fair' + proxyReq.path

      // no gzip so that we can process the content
      proxyReq.setHeader('accept-encoding', 'identity')

      // authentication through api key only
      proxyReq.setHeader('cookie', '')
      if (config.dataFair.apiKey) proxyReq.setHeader('x-apiKey', config.dataFair.apiKey)

      // body was already parsed by body-parser and no longer available as a stream
      fixRequestBody(proxyReq, req)
    },
    proxyRes (proxyRes, req, res) {
      // console.log('DF RES', proxyRes)
      if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].startsWith('application/json')) {
        let body = ''
        proxyRes.on('data', (data) => { body += data.toString() })
        proxyRes.on('end', () => {
          const output = body.replace(new RegExp(escapeStringRegexp(config.dataFair.url), 'g'), `http://localhost:${config.port}/data-fair`)
          // proxyRes.headers['content-length'] = output.length
          delete proxyRes.headers['content-length']
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
          // make all references to data-fair url point to local proxy
          res.end(output)
        })
      } else {
        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
        proxyRes.pipe(res)
      }
    }
  }
}))

// re-expose a tileserver to serve base map styles, tiles, sprites and fonts.
// derived from the data-fair origin (each site exposes its tileserver on <origin>/tileserver).
const tileserverUrl = new URL(config.dataFair.url).origin + '/tileserver'
app.use('/tileserver', createProxyMiddleware({
  target: new URL(config.dataFair.url).origin,
  secure: false,
  changeOrigin: true,
  selfHandleResponse: true, // so that the proxyRes handler takes care of sending the response
  on: {
    proxyReq (proxyReq, req, res) {
      proxyReq.path = '/tileserver' + proxyReq.path

      // no gzip so that we can process the content
      proxyReq.setHeader('accept-encoding', 'identity')
    },
    proxyRes (proxyRes, req, res) {
      if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].startsWith('application/json')) {
        let body = ''
        proxyRes.on('data', (data) => { body += data.toString() })
        proxyRes.on('end', () => {
          // make all references to the tileserver url point to the local proxy
          const output = body.replace(new RegExp(escapeStringRegexp(tileserverUrl), 'g'), `http://localhost:${config.port}/tileserver`)
          delete proxyRes.headers['content-length']
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
          res.end(output)
        })
      } else {
        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
        proxyRes.pipe(res)
      }
    }
  }
}))

// also re-expose the simple-directory instance matching data-fair
app.use('/simple-directory', createProxyMiddleware({
  target: dfUrl.origin,
  secure: false,
  changeOrigin: true,
  on: {
    proxyReq (proxyReq, req, res) {
      proxyReq.path = '/simple-directory' + proxyReq.path
    }
  }
}))

if (config.serveUi) {
  app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../ui/dist'), uiConfig, { ignoreSitePath: true }))
} else {
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:6220',
    secure: false
  }))
}

// Run app and return it in a promise
export const run = async () => {
  server.listen(config.port)
  await eventPromise(server, 'listening')
  console.log(chalk.bold.blue('\nDataFair dev server available on ') + chalk.underline.bold.blue(`http://localhost:${config.port}`))
  return server
}

export const stop = async () => {
  for (const ws of dataFairWS) ws.terminate()
  for (const ws of devServerWS) ws.terminate()
  server.close()
  await eventPromise(server, 'close')
}
