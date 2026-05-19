import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { spawn, spawnSync } from 'bun'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

type StitchMcpEntry = {
  url?: string
  command?: string
  env?: Record<string, string>
  headers?: Record<string, string>
}

// Reads `.cursor/mcp.json`: Google hosted MCP uses `url` + headers; local proxy uses `command` + `env`.
function loadStitchMcp(): {
  proxyEnv: Record<string, string>
  skipLocalProxy: boolean
} {
  const mcpPath = join(repoRoot, '.cursor', 'mcp.json')
  if (!existsSync(mcpPath)) {
    return { proxyEnv: {}, skipLocalProxy: false }
  }
  try {
    const parsed = JSON.parse(readFileSync(mcpPath, 'utf-8')) as {
      mcpServers?: { stitch?: StitchMcpEntry }
    }
    const s = parsed.mcpServers?.stitch
    if (!s || typeof s !== 'object') {
      return { proxyEnv: {}, skipLocalProxy: false }
    }
    const hostedOnly = !!(s.url && !s.command)
    const proxyEnv: Record<string, string> = {}
    if (s.env && typeof s.env === 'object') {
      for (const [k, v] of Object.entries(s.env)) {
        if (typeof v === 'string' && v.length > 0 && v !== 'REPLACE_ME') {
          proxyEnv[k] = v
        }
      }
    }
    const googKey = s.headers?.['X-Goog-Api-Key']
    if (
      typeof googKey === 'string' &&
      googKey.length > 0 &&
      googKey !== 'REPLACE_ME' &&
      !proxyEnv.STITCH_API_KEY
    ) {
      proxyEnv.STITCH_API_KEY = googKey
    }
    return { proxyEnv, skipLocalProxy: hostedOnly }
  } catch {
    return { proxyEnv: {}, skipLocalProxy: false }
  }
}

// Check if Convex is configured
const convexCheck = spawnSync(['bun', 'x', 'convex', 'dev', '--once'], {
  stdout: 'pipe',
  stderr: 'pipe',
})

if (convexCheck.exitCode !== 0) {
  const stderr = convexCheck.stderr.toString()
  if (stderr.includes('No CONVEX_DEPLOYMENT') || stderr.includes('configure')) {
    console.log('⚠️  Convex is not configured yet.')
    console.log(
      '   Run `bunx convex dev` in a separate terminal to configure your project.'
    )
    console.log('   Then restart this dev server.\n')
  } else {
    console.error('❌ Convex sync failed:', stderr)
  }
}

console.log('🔥 Starting Vite Dev Server...')

// Start Convex dev server (will just fail gracefully if not configured)
const convex = spawn(['bun', 'x', 'convex', 'dev'], {
  stdout: 'inherit',
  stderr: 'inherit',
})

const { proxyEnv: stitchMcpEnv, skipLocalProxy: stitchHostedOnly } =
  loadStitchMcp()

let stitch: ReturnType<typeof spawn> | undefined
if (!stitchHostedOnly) {
  if (
    !process.env.STITCH_API_KEY &&
    !process.env.STITCH_ACCESS_TOKEN &&
    !stitchMcpEnv.STITCH_API_KEY &&
    !stitchMcpEnv.STITCH_ACCESS_TOKEN
  ) {
    console.log(
      '⚠️  Stitch proxy: no STITCH_API_KEY / STITCH_ACCESS_TOKEN in environment or `.cursor/mcp.json` (env or X-Goog-Api-Key header).'
    )
  }
  console.log('🧵 Starting Stitch MCP proxy...')
  stitch = spawn(['bun', 'x', '@_davideast/stitch-mcp', 'proxy'], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, ...stitchMcpEnv },
  })
} else {
  console.log(
    '🧵 Stitch: hosted MCP in `.cursor/mcp.json` (url + X-Goog-Api-Key); local proxy not started.'
  )
}

// Start Vite
const vite = spawn(['bun', 'x', 'vite', 'dev', '--port', '3000', '--host'], {
  stdout: 'inherit',
  stderr: 'inherit',
  env: { ...process.env },
})

const cleanup = () => {
  console.log('\n🛑 Shutting down dev servers...')
  convex.kill()
  stitch?.kill()
  vite.kill()
  process.exit()
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// Only exit when vite exits (convex failing shouldn't kill everything)
void vite.exited.then(cleanup)
