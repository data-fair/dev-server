#!/usr/bin/env node

const path = require('path')
require('dotenv').config()
process.env.NODE_CONFIG_DIR = path.join(__dirname, '../config')
const app = require('./app')

app.run().then(app => {
  // nothing to do
}, error => {
  console.error('Failure in customers process', error)
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
