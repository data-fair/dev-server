// Development ports live below the kernel ephemeral range (32768-60999 on Linux), where a port
// can already be held by an outgoing connection, and above the 191xx block used by the
// data-fair docker compose.
export const MIN_BASE = 20000
// The base takes three consecutive ports, so it may not go past 29999.
export const MAX_BASE = 29997

export const renderEnv = (base: number, appPath: string) => `# généré par df-dev-env — ne pas commiter
APP_PORT=${base}
DEV_SERVER_PORT=${base + 1}
E2E_PORT=${base + 2}
APP_PATH=${appPath}
`

// Reads one variable out of an already written .env. Used to tell a .env that carries our ports
// from one written for another purpose, and to keep the APP_PATH a developer chose when --force
// redraws the ports. Deliberately naive: the file we read is the one we wrote.
export const readEnvVar = (content: string, name: string): string | undefined => {
  const line = content.split('\n').find(l => l.startsWith(name + '='))
  return line === undefined ? undefined : line.slice(name.length + 1).trim()
}

export const findBase = async (
  isFree: (port: number) => Promise<boolean>,
  draw: () => number,
  attempts = 10
): Promise<number> => {
  for (let i = 0; i < attempts; i++) {
    const base = draw()
    const free = await Promise.all([base, base + 1, base + 2].map(isFree))
    if (free.every(Boolean)) return base
  }
  throw new Error(`no free port range found after ${attempts} attempts`)
}
