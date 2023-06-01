// Express app for TaxMan own API and UI
const util = require('util')
const path = require('path')
const { spawn } = require('child_process')
const express = require('express')
const bodyParser = require('body-parser')
const config = require('config')
const eventToPromise = require('event-to-promise')
const http = require('http')
const fs = require('fs-extra')
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware')
const cors = require('cors')
const kill = require('tree-kill')
const escapeStringRegexp = require('escape-string-regexp')
const parse5 = require('parse5')
const { WebSocket, WebSocketServer } = require('ws')
const debug = require('debug')('df-dev-server')
const chalk = require('chalk')
const Extractor = require('html-extractor')
const htmlExtractor = new Extractor()
htmlExtractor.extract = util.promisify(htmlExtractor.extract)
const vIframeVersion = require('@koumoul/v-iframe/package.json').version
const iframeResizerVersion = require('iframe-resizer/package.json').version

const app = express()
const server = http.createServer(app)

// web socket server, used both by dev-server UI (opened on / path)
// and by application (opened on /data-fair), in this case we transmit all messages to and from data-fair
const wss = new WebSocketServer({ noServer: true })
let devServerWS, dataFairWS
server.on('upgrade', function upgrade (req, socket, head) {
  wss.handleUpgrade(req, socket, head, (ws) => {
    if (req.url === '/data-fair') {
      if (dataFairWS) dataFairWS.terminate()
      dataFairWS = ws
      ws.on('message', (data) => {
        if (dataFairOutputWS) {
          const message = JSON.parse(data)
          if (message.type === 'subscribe') message.apiKey = config.dataFair.apiKey
          dataFairOutputWS.send(JSON.stringify(message))
        }
      })
    } else {
      if (devServerWS) devServerWS.terminate()
      devServerWS = ws
    }
    wss.emit('connection', ws, req)
  })
})

const dfWsUrl = config.dataFair.url.replace('http://', 'ws://').replace('https://', 'wss://') + '/'
const dataFairOutputWS = new WebSocket(dfWsUrl)
dataFairOutputWS.on('open', () => dataFairOutputWS.send('connect to external websocket server', dfWsUrl))
dataFairOutputWS.on('message', (data) => { if (dataFairWS) dataFairWS.send(data.toString()) })
dataFairOutputWS.on('error', (err) => console.error('failed to connect to external websocket server', dfWsUrl, err))

app.use(cors())
app.use(bodyParser.json())

// very basic CRUD of config
app.get('/config', (req, res, next) => {
  const devConfig = fs.existsSync('.dev-config.json') ? fs.readJsonSync('.dev-config.json') : {}
  debug('read dev config', devConfig)
  res.send(devConfig)
})
app.put('/config', (req, res, next) => {
  debug('save dev config', req.body)
  fs.writeJsonSync('.dev-config.json', req.body, { spaces: 2 })
  res.send(req.body)
})
app.post('/config/error', (req, res) => {
  console.log('Application sent an error', req.body)
  if (devServerWS) devServerWS.send(JSON.stringify({ type: 'app-error', data: req.body }))
  else console.error('no dev-server websocket open to send error to')
  res.send()
})

// re-expose the application performing similar modifications to the body as data-fair
const appUrl = new URL(config.app.url)
app.use('/app', createProxyMiddleware({
  target: appUrl.origin,
  pathRewrite: { '^/app': appUrl.pathname === '/' ? '' : appUrl.pathname },
  secure: false,
  changeOrigin: true,
  selfHandleResponse: true, // so that the onProxyRes takes care of sending the response
  onProxyReq (proxyReq, req, res) {
    proxyReq.setHeader('Accept-Encoding', 'identity') // disable compression
  },
  onProxyRes (proxyRes, req, res) {
    const configuration = fs.existsSync('.dev-config.json') ? fs.readJsonSync('.dev-config.json') : {}
    // console.log('inject config', configuration)
    const dataBuffers = []
    proxyRes.on('data', (data) => { dataBuffers.push(data) })
    proxyRes.on('end', async () => {
      try {
        let output = Buffer.concat(dataBuffers)
        const body = output.toString()
        if (body.includes('%APPLICATION%')) {
          const filledBody = body.replace(/%APPLICATION%/g, JSON.stringify({
            id: 'dev-application',
            title: 'Dev application',
            configuration,
            exposedUrl: 'http://localhost:5888/app',
            href: 'http://localhost:5888/config',
            apiUrl: 'http://localhost:5888/data-fair/api/v1',
            wsUrl: 'ws://localhost:5888/data-fair',
            owner: config.dataFair && config.dataFair.owner
          }))
          const document = parse5.parse(filledBody)
          const html = document.childNodes.find(c => c.tagName === 'html')
          if (!html) throw new Error('HTML structure is broken, expect html, head and body elements')
          const headNode = html.childNodes.find(c => c.tagName === 'head')
          const bodyNode = html.childNodes.find(c => c.tagName === 'body')
          if (!headNode || !bodyNode) throw new Error('HTML structure is broken, expect html, head and body elements')

          // add a script to simulate instrumentation by capture service
          if (req.query.thumbnail === 'true') {
            headNode.childNodes.push({
              nodeName: 'script',
              tagName: 'script',
              attrs: [{ name: 'type', value: 'text/javascript' }],
              childNodes: [{
                nodeName: '#text',
                value: `
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
                `
              }]
            })
          }

          const { meta } = await htmlExtractor.extract(filledBody)
          // add @koumoul/v-iframe/content-window.min.js to support state sync with portals, etc.
          if (meta['df:sync-state'] === 'true') {
            bodyNode.childNodes.push({
              nodeName: 'script',
              tagName: 'script',
              attrs: [
                { name: 'type', value: 'text/javascript' },
                { name: 'src', value: `https://cdn.jsdelivr.net/npm/@koumoul/v-iframe@${vIframeVersion}/content-window.js` }
              ]
            })
          }
          // add iframe-resizer/js/iframeResizer.contentWindow.min.js to support dynamic resizing of the iframe in portals, etc
          if (meta['df:overflow'] === 'true') {
            bodyNode.childNodes.push({
              nodeName: 'script',
              tagName: 'script',
              attrs: [
                { name: 'type', value: 'text/javascript' },
                { name: 'src', value: `https://cdn.jsdelivr.net/npm/iframe-resizer@${iframeResizerVersion}/js/iframeResizer.contentWindow.min.js` }
              ]
            })
          }

          output = parse5.serialize(document)

          // proxyRes.headers['content-length'] = output.length
          delete proxyRes.headers['content-length']
          delete proxyRes.headers['last-modified']
          delete proxyRes.headers['max-age']
          delete proxyRes.headers.etag
          proxyRes.headers['cache-control'] = 'no-cache'
        }
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        res.end(output)
      } catch (err) {
        console.error(err)
        res.writeHead(500)
        res.end(err.message)
      }
    })
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
  pathRewrite: { '^/data-fair': dfUrl.pathname },
  secure: false,
  changeOrigin: true,
  selfHandleResponse: true, // so that the onProxyRes takes care of sending the response
  onProxyReq (proxyReq, req, res) {
    // no gzip so that we can process the content
    proxyReq.setHeader('accept-encoding', 'identity')

    // authentication through api key only
    proxyReq.setHeader('cookie', '')
    if (config.dataFair.apiKey) proxyReq.setHeader('x-apiKey', config.dataFair.apiKey)

    // body was already parsed by body-parser and no longer available as a stream
    fixRequestBody(proxyReq, req, res)
  },
  onProxyRes (proxyRes, req, res) {
    if (proxyRes.headers['content-type'] && proxyRes.headers['content-type'].startsWith('application/json')) {
      let body = ''
      proxyRes.on('data', (data) => { body += data.toString() })
      proxyRes.on('end', () => {
        const output = body.replace(new RegExp(escapeStringRegexp(config.dataFair.url), 'g'), 'http://localhost:5888/data-fair')
        // proxyRes.headers['content-length'] = output.length
        delete proxyRes.headers['content-length']
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        // make all references to data-fair url point to local proxy
        res.end(output)
      })
    } else {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    }
  }
}))

// also re-expose the simple-directory instance matching data-fair
if (dfUrl.pathname === '/data-fair') {
  app.use('/simple-directory', createProxyMiddleware({
    target: dfUrl.origin,
    secure: false,
    changeOrigin: true
  }))
}

// run the dev-src command from current project
let spawnedDevSrc

// Run app and return it in a promise
exports.run = async () => {
  if (process.env.NODE_ENV === 'development') {
    const { Nuxt, Builder } = require('nuxt')
    const nuxtConfig = require('../nuxt.config.js')
    nuxtConfig.dev = true
    const nuxt = new Nuxt(nuxtConfig)
    app.use(nuxt.render)
    await new Builder(nuxt).build()
  } else {
    const nuxtConfigInject = require('@koumoul/nuxt-config-inject')
    const distOrigin = path.join(__dirname, '..', 'dist')
    const distConfig = path.join(__dirname, '..', 'dist-config')
    await fs.remove(distConfig)
    await fs.copy(distOrigin, distConfig)
    nuxtConfigInject.replace(config, [distConfig + '/**/*'])
    app.use(express.static(distConfig))
  }
  server.listen(config.port)
  await eventToPromise(server, 'listening')
  console.log(chalk.bold.blue('\nDataFair dev server available on ') + chalk.underline.bold.blue(`http://localhost:${config.port}`))

  if (fs.existsSync('package.json')) {
    const pJson = fs.readJsonSync('package.json')
    if (pJson.scripts && pJson.scripts['dev-src']) {
      console.log(chalk.blue('running application with "npm run dev-src"'))
      spawnedDevSrc = spawn('npm', ['run', 'dev-src'], { stdio: 'inherit' }).on('error', () => {})
    } else {
      console.error(chalk.red('No script "dev-src" in package.json'))
    }
  }
  // if (process.env.NODE_ENV !== 'development') open('http://localhost:5888')
  return server
}

exports.stop = async () => {
  if (spawnedDevSrc) kill(spawnedDevSrc.pid)
  if (devServerWS) devServerWS.terminate()
  if (dataFairWS) dataFairWS.terminate()
  server.close()
  await eventToPromise(server, 'close')
  await app.get('client').close()
}
