// Access to the remote data-fair api. Only JSON and buffer reads: every mutation goes
// through data-fair itself, the dev-server never writes on behalf of the developer.

import config from './config.js'

// Fetch a resource from the remote data-fair api
export const remoteFetchRaw = async (path: string) => {
  const res = await fetch(config.dataFair.url + '/api/v1' + path, {
    headers: config.dataFair.apiKey ? { 'x-apiKey': config.dataFair.apiKey } : {}
  })
  if (!res.ok) throw new Error(`error ${res.status} on remote data-fair: ${await res.text()}`)
  return res
}

export const remoteFetch = async (path: string) => {
  const res = await remoteFetchRaw(path)
  return res.json()
}

// Same, for an attachment: a file, never json, and never decoded as text — see the app proxy
// below, where decoding a binary body as utf8 destroys it.
export const remoteFetchBuffer = async (path: string) => {
  const res = await remoteFetchRaw(path)
  return Buffer.from(await res.arrayBuffer())
}
