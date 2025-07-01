#!/usr/bin/env node

import 'dotenv/config'
import path from 'node:path'

process.env.NODE_CONFIG_DIR = path.join(import.meta.dirname, '../config')
const app = await import('./app.js')

app.run().then(app => {
  // nothing to do
}, error => {
  console.error('Failure in dev server process', error)
  process.exit(-1)
})

process.on('SIGTERM', function onSigterm () {
  console.info('Received SIGTERM signal, shutdown gracefully...')
  app.stop().then(() => {
    console.log('shutting down now')
    process.exit()
  }, err => {
    console.error('Failure while stopping service', err)
    process.exit(-1)
  })
})
