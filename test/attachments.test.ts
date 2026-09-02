import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { listAttachments, attachmentPath, copyAttachments } from '../src/attachments.ts'

const withDir = (fn: (dir: string) => void | Promise<void>) => async () => {
  const dir = mkdtempSync(join(tmpdir(), 'df-dev-server-attachments-'))
  try {
    await fn(join(dir, 'attachments'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('lists nothing when the directory does not exist', withDir((dir) => {
  assert.deepEqual(listAttachments(dir), [])
}))

test('lists the files on disk, with their mimetype guessed from the extension', withDir((dir) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'logo.svg'), '<svg/>')
  writeFileSync(join(dir, 'photo.JPG'), 'jpeg')
  const attachments = listAttachments(dir)
  assert.deepEqual(attachments.map(a => a.name), ['logo.svg', 'photo.JPG'])
  assert.equal(attachments[0].mimetype, 'image/svg+xml')
  assert.equal(attachments[1].mimetype, 'image/jpeg')
  assert.equal(attachments[0].size, 6)
}))

test('takes the title from the metadata sidecar, and falls back to the name', withDir((dir) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'a.png'), 'a')
  writeFileSync(join(dir, 'b.png'), 'b')
  writeFileSync(join(dir, '.metadata.json'), JSON.stringify([{ name: 'a.png', title: 'Pictogramme A' }]))
  const attachments = listAttachments(dir)
  assert.deepEqual(attachments.map(a => a.title), ['Pictogramme A', 'b.png'])
}))

test('never lists the metadata sidecar itself, nor any other hidden file', withDir((dir) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '.metadata.json'), '[]')
  writeFileSync(join(dir, '.DS_Store'), 'x')
  assert.deepEqual(listAttachments(dir), [])
}))

test('survives a broken metadata sidecar, the files remain the source of truth', withDir((dir) => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'a.png'), 'a')
  writeFileSync(join(dir, '.metadata.json'), '{ truncated')
  assert.deepEqual(listAttachments(dir).map(a => a.title), ['a.png'])
}))

test('resolves an attachment path inside the directory', withDir((dir) => {
  assert.equal(attachmentPath(dir, 'logo.png'), join(dir, 'logo.png'))
  assert.equal(attachmentPath(dir, 'sub/logo.png'), join(dir, 'sub', 'logo.png'))
  assert.equal(attachmentPath(dir, 'ecogestes_Eau chaude sanitaire.png'), join(dir, 'ecogestes_Eau chaude sanitaire.png'))
}))

test('refuses a name escaping the attachments directory', withDir((dir) => {
  assert.equal(attachmentPath(dir, '../../etc/passwd'), undefined)
  assert.equal(attachmentPath(dir, `..${sep}`), undefined)
  assert.equal(attachmentPath(dir, '/etc/passwd'), undefined)
  assert.equal(attachmentPath(dir, ''), undefined)
}))

test('copies remote attachments and their titles', withDir(async (dir) => {
  const result = await copyAttachments(
    [{ name: 'download.png', title: 'Téléchargement' }, { name: 'edf.svg', title: 'edf.svg' }],
    async (name) => Buffer.from('content of ' + name),
    dir
  )
  assert.deepEqual(result, { copied: ['download.png', 'edf.svg'], failed: [] })
  assert.equal(readFileSync(join(dir, 'download.png'), 'utf8'), 'content of download.png')
  assert.deepEqual(listAttachments(dir).map(a => a.title), ['Téléchargement', 'edf.svg'])
}))

test('replaces the previous attachments instead of merging with them', withDir(async (dir) => {
  await copyAttachments([{ name: 'old.png' }], async () => Buffer.from('old'), dir)
  await copyAttachments([{ name: 'new.png' }], async () => Buffer.from('new'), dir)
  assert.deepEqual(listAttachments(dir).map(a => a.name), ['new.png'])
}))

test('reports the attachments it could not download, and copies the others', withDir(async (dir) => {
  const result = await copyAttachments(
    [{ name: 'public.png' }, { name: 'private.png' }],
    async (name) => {
      if (name === 'private.png') throw new Error('error 403 on remote data-fair')
      return Buffer.from('ok')
    },
    dir
  )
  assert.deepEqual(result, { copied: ['public.png'], failed: ['private.png'] })
  assert.deepEqual(listAttachments(dir).map(a => a.name), ['public.png'])
}))

test('empties the directory when every download fails, rather than keeping foreign images', withDir(async (dir) => {
  await copyAttachments([{ name: 'kept.png' }], async () => Buffer.from('kept'), dir)
  const result = await copyAttachments([{ name: 'a.png' }], async () => { throw new Error('network down') }, dir)
  assert.deepEqual(result, { copied: [], failed: ['a.png'] })
  // the attachments of the previously copied application would match no configuration at all
  assert.deepEqual(listAttachments(dir).map(a => a.name), [])
}))

test('refuses to write an attachment whose name escapes the directory', withDir(async (dir) => {
  const result = await copyAttachments(
    [{ name: '../escaped.png' }, { name: 'ok.png' }],
    async () => Buffer.from('x'),
    dir
  )
  assert.deepEqual(result, { copied: ['ok.png'], failed: ['../escaped.png'] })
  assert.equal(existsSync(join(dir, '..', 'escaped.png')), false)
}))

// the tests above resolve instantly, so they pass whatever the order downloads complete in
test('downloads in parallel, and keeps the order of the configuration in both lists', withDir(async (dir) => {
  // a.png and c.png fail, and the four entries answer in reverse: an implementation appending
  // results as they land would report every one of them out of order
  const plan: Record<string, { delay: number, fails: boolean }> = {
    'a.png': { delay: 30, fails: true },
    'b.png': { delay: 20, fails: false },
    'c.png': { delay: 10, fails: true },
    'd.png': { delay: 0, fails: false }
  }
  let running = 0
  let peak = 0
  const result = await copyAttachments(
    Object.keys(plan).map(name => ({ name })),
    async (name) => {
      running++
      peak = Math.max(peak, running)
      try {
        await new Promise(resolve => setTimeout(resolve, plan[name].delay))
        if (plan[name].fails) throw new Error('error 403 on remote data-fair')
        return Buffer.from('content of ' + name)
      } finally {
        running--
      }
    },
    dir
  )
  assert.ok(peak > 1, `the downloads ran one at a time, ${peak} was the highest seen at once`)
  assert.deepEqual(result, { copied: ['b.png', 'd.png'], failed: ['a.png', 'c.png'] })
  assert.deepEqual(listAttachments(dir).map(a => a.name), ['b.png', 'd.png'])
}))
