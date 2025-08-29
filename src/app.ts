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
import { isElementNode, createTextNode, createElement } from '@parse5/tools'
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
app.use(express.json())

// very basic CRUD of config
app.get('/config', (req, res, next) => {
  const devConfig = existsSync('.dev-config.json') ? JSON.parse(readFileSync('.dev-config.json', 'utf8')) : {}
  debug('read dev config', devConfig)
  res.send(devConfig)
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

// re-expose the application performing similar modifications to the body as data-fair
const appUrl = new URL(config.app.url)
const appPrefix = appUrl.pathname.endsWith('/') ? appUrl.pathname.substring(0, appUrl.pathname.length - 1) : appUrl.pathname
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
      const configuration = existsSync('.dev-config.json') ? JSON.parse(readFileSync('.dev-config.json', 'utf8')) : {}
      // console.log('inject config', configuration)
      const dataBuffers: Buffer[] = []
      proxyRes.on('data', (data) => { dataBuffers.push(data) })
      proxyRes.on('end', async () => {
        try {
          let output = Buffer.concat(dataBuffers).toString()
          if (output.includes('%APPLICATION%')) {
            const filledBody = output.replace(/%APPLICATION%/g, JSON.stringify({
              id: 'dev-application',
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

            // add a script to simulate instrumentation by capture service
            // @ts-ignore
            const query: Record<string, string> = req.query
            if (query.thumbnail === 'true') {
              const script = createElement('script', { type: 'text/javascript' })
              script.childNodes.push(createTextNode(`
              console.log('[capture] Simulate a screenshot capture context')
              var triggerCalled = false
              window.triggerCapture = function (animationSupported) {
                triggerCalled = true
                console.log('[capture] triggerCapture called')
                if (animationSupported) {
                  console.log('[capture] this application supports animated screenshots')
                  var i = 0
                  const interval = setInterval(function () {
                    i++
                    if (i === 1800) {
                      console.error('[capture] stop after the maximum number of frames was attained')
                      clearInterval(interval)
                    }
                    var stopped = window.animateCaptureFrame()
                    if (stopped) {
                      console.log('[capture] animation was stopped after ' + i + ' frames')
                      clearInterval(interval)
                    }
                  }, 67)
                  return true
                } else {
                  console.log('[capture] this application does not support animated screenshots')
                }
              }
              setTimeout(function() {
                if (!triggerCalled) {
                  console.error('[capture] triggerCapture was not called after a 5s wait')
                }
              }, 5000)
                              `))
              headNode.childNodes.push(script)
            }

            const meta: Record<string, string> = {}
            for (const node of headNode.childNodes.filter(isElementNode)) {
              if (node.tagName === 'meta') {
                const name = node.attrs.find(a => a.name === 'name')?.value
                const content = node.attrs.find(a => a.name === 'content')?.value
                if (name !== undefined && content !== undefined) meta[name] = content
              }
            }
            if (meta['df:sync-state'] === 'true' || meta['df:overflow'] === 'true') {
              bodyNode.childNodes.push(createElement('script', {
                type: 'text/javascript',
                src: 'https://cdn.jsdelivr.net/npm/@data-fair/frame@0.12/dist/v-iframe-compat/d-frame-content.min.js'
              }))
            }

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
          const output = body.replace(new RegExp(escapeStringRegexp(config.dataFair.url), 'g'), 'http://localhost:5888/data-fair')
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
