// Attachments of the application under development.
//
// data-fair lets an application carry attached files: they are listed in the application
// object (window.APPLICATION.attachments), offered by the configuration form through the
// `context.attachments` of vjsf, and served under <application.href>/attachments/<name>.
// An application configuration therefore stores an attachment by name only — see the
// attachmentImage pattern used by app-eco-watt and friends — and rebuilds its url at
// render time. We mirror that whole contract locally, with the files sitting in a
// git-ignored directory, so an image referenced by a copied production configuration
// displays in dev exactly as it does in production.

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'

export const ATTACHMENTS_DIR = '.dev-attachments'

// Titles are metadata of the remote application, nothing on disk holds them. They are kept
// beside the files, in a dotfile: hidden entries are excluded from the listing below, so the
// sidecar can never be mistaken for an attachment.
const METADATA_FILE = '.metadata.json'

// Enough to cover what an application attaches (images, and the occasional document). An
// unknown extension falls back to the mimetype the remote data-fair reported, then to the
// generic binary type — never to a guess that a browser would act upon.
const MIME_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.csv': 'text/csv',
  '.gif': 'image/gif',
  '.ico': 'image/vnd.microsoft.icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp'
}

export type Attachment = {
  name: string,
  title: string,
  size: number,
  mimetype: string,
  updatedAt: string
}

const readMetadata = (dir: string): Record<string, Partial<Attachment>> => {
  const path = join(dir, METADATA_FILE)
  if (!existsSync(path)) return {}
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    if (!Array.isArray(parsed)) return {}
    return Object.fromEntries(parsed.filter(a => a?.name).map(a => [a.name, a]))
  } catch (err) {
    // a hand-edited or truncated sidecar must not take the whole listing down with it:
    // the files themselves are the source of truth, the metadata only decorates them
    return {}
  }
}

// The directory is the source of truth, not the sidecar: an image a developer drops in by
// hand is listed just like one copied from a remote application, and a file deleted by hand
// disappears. Size and date come from the file, since the local file is what is served.
export const listAttachments = (dir: string = ATTACHMENTS_DIR): Attachment[] => {
  if (!existsSync(dir)) return []
  const metadata = readMetadata(dir)
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
    .map(entry => {
      const stats = statSync(join(dir, entry.name))
      const known = metadata[entry.name]
      return {
        name: entry.name,
        title: known?.title ?? entry.name,
        size: stats.size,
        mimetype: MIME_TYPES[extname(entry.name).toLowerCase()] ?? known?.mimetype ?? 'application/octet-stream',
        updatedAt: stats.mtime.toISOString()
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// The requested name reaches us from an application configuration copied from a remote
// data-fair, so it is never to be trusted: resolve it and refuse anything that lands outside
// the attachments directory. undefined means "no such attachment", never "here is /etc/passwd".
export const attachmentPath = (dir: string, name: string): string | undefined => {
  if (!name) return undefined
  const dirPath = resolve(dir)
  const filePath = resolve(dirPath, name)
  if (!filePath.startsWith(dirPath + sep)) return undefined
  return filePath
}

export type CopyAttachmentsResult = { copied: string[], failed: string[] }

// Attachments used to be downloaded one after the other, each waiting for a full round trip
// to the remote data-fair before the next one started, so an application carrying a dozen
// images cost a dozen round trips to copy. They go in parallel now, bounded so that a
// configuration with many attachments does not open as many connections at once.
const DOWNLOAD_CONCURRENCY = 5

type Downloaded = { attachment: { name: string, title?: string, mimetype?: string }, body: Buffer }

// Replace the whole local attachments directory with the attachments of a remote application.
// Replace, and not merge: copying a configuration replaces the current one entirely, so leaving
// behind the images of the previously copied application would only produce a directory whose
// content matches no configuration at all.
//
// Everything is downloaded before anything is written, then the directory is swapped in one
// rename: an interrupted or partly failing copy — a private file with no api key, a network
// hiccup — never leaves a half-written directory behind, and what did download is kept. A copy
// where nothing downloads does empty the directory, which is the point: the configuration it
// came with is being applied all the same, and its images are genuinely missing.
export const copyAttachments = async (
  attachments: { name?: string, title?: string, mimetype?: string }[],
  fetchAttachment: (name: string) => Promise<Buffer>,
  dir: string = ATTACHMENTS_DIR
): Promise<CopyAttachmentsResult> => {
  const entries = attachments ?? []
  // indexed rather than appended: downloads no longer finish in the order they started, and
  // both lists below are read by a developer against the configuration they came from
  const downloaded: (Downloaded | undefined)[] = new Array(entries.length)
  const failures: (string | undefined)[] = new Array(entries.length)

  let next = 0
  const worker = async () => {
    while (next < entries.length) {
      const index = next++
      const attachment = entries[index]
      // a name with a path separator would write outside the directory, and data-fair has no
      // reason to send one: skip it rather than sanitize a name the configuration still refers to
      if (!attachment?.name || attachmentPath(dir, attachment.name) === undefined) {
        if (attachment?.name) failures[index] = attachment.name
        continue
      }
      try {
        downloaded[index] = { attachment: { ...attachment, name: attachment.name }, body: await fetchAttachment(attachment.name) }
      } catch (err) {
        failures[index] = attachment.name
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, entries.length) }, worker))

  const kept = downloaded.filter(entry => entry !== undefined)
  const result: CopyAttachmentsResult = { copied: [], failed: failures.filter(name => name !== undefined) }

  // written aside then swapped in, so an interrupted copy leaves the previous directory intact
  const tmpDir = dir + '.tmp'
  rmSync(tmpDir, { recursive: true, force: true })
  mkdirSync(tmpDir, { recursive: true })
  for (const { attachment, body } of kept) {
    writeFileSync(join(tmpDir, attachment.name), body)
    result.copied.push(attachment.name)
  }
  writeFileSync(join(tmpDir, METADATA_FILE), JSON.stringify(kept.map(d => d.attachment), null, 2))
  rmSync(dir, { recursive: true, force: true })
  renameSync(tmpDir, dir)
  return result
}
