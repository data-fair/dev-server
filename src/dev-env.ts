#!/usr/bin/env node

import { existsSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { parseArgs } from 'node:util'
import { MIN_BASE, MAX_BASE, renderEnv, findBase } from './env-file.js'

const { values } = parseArgs({
  options: {
    force: { type: 'boolean', default: false },
    'app-path': { type: 'string', default: '/app/' }
  }
})

if (existsSync('.env') && !values.force) process.exit(0)

const isFree = (port: number) => new Promise<boolean>(resolve => {
  const server = createServer()
  server.once('error', () => { resolve(false) })
  server.once('listening', () => { server.close(() => { resolve(true) }) })
  server.listen(port, '127.0.0.1')
})

const draw = () => MIN_BASE + Math.floor(Math.random() * (MAX_BASE - MIN_BASE + 1))

const base = await findBase(isFree, draw)
writeFileSync('.env', renderEnv(base, values['app-path'] ?? '/app/'))
console.log(`.env généré — app ${base}, dev-server ${base + 1}, e2e ${base + 2}`)
