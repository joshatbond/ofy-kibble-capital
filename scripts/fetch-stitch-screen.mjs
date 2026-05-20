/**
 * Fetch a Stitch UI screen (screenshot + HTML) via MCP get_screen.
 *
 * Usage:
 *   node scripts/fetch-stitch-screen.mjs <screenId> [projectId] [outputSlug]
 *
 * Example:
 *   node scripts/fetch-stitch-screen.mjs fadc3071b27848818511f5d12c35f953
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const screenId = process.argv[2]
const projectId = process.argv[3] ?? '310125272977918197'
const outputSlug = process.argv[4] ?? screenId.slice(0, 8)

if (!screenId) {
  console.error(
    'Usage: node scripts/fetch-stitch-screen.mjs <screenId> [projectId] [outputSlug]'
  )
  process.exit(1)
}

const repoRoot = join(import.meta.dirname, '..')
const mcpPath = join(repoRoot, '.cursor', 'mcp.json')
const outDir = join(
  repoRoot,
  'design',
  'stitch',
  'student-payroll-tracker',
  'screens',
  outputSlug
)

async function stitchCall(toolName, args) {
  const mcp = JSON.parse(await readFile(mcpPath, 'utf8'))
  const apiKey = mcp.mcpServers?.stitch?.headers?.['X-Goog-Api-Key']
  if (!apiKey || apiKey === 'REPLACE_ME') {
    throw new Error('Set X-Goog-Api-Key in .cursor/mcp.json')
  }

  const res = await fetch('https://stitch.googleapis.com/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  })

  if (!res.ok) {
    throw new Error(`Stitch MCP HTTP ${res.status}: ${await res.text()}`)
  }

  const json = await res.json()
  if (json.result?.isError) {
    throw new Error(json.result.content?.[0]?.text ?? 'Stitch MCP error')
  }

  const text = json.result?.content?.[0]?.text
  return text ? JSON.parse(text) : json.result
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function main() {
  const screen = await stitchCall('get_screen', {
    name: `projects/${projectId}/screens/${screenId}`,
  })

  await mkdir(outDir, { recursive: true })

  const downloads = []
  if (screen.screenshot?.downloadUrl) {
    const path = join(outDir, 'screenshot.png')
    await download(screen.screenshot.downloadUrl, path)
    downloads.push({ type: 'screenshot', file: 'screenshot.png' })
  }

  if (screen.htmlCode?.downloadUrl) {
    const path = join(outDir, 'screen.html')
    await download(screen.htmlCode.downloadUrl, path)
    downloads.push({ type: 'htmlCode', file: 'screen.html' })
  }

  const manifest = {
    projectId,
    projectTitle: 'Student Payroll Tracker',
    screenId,
    title: screen.title,
    slug: slugify(screen.title ?? outputSlug),
    width: screen.width,
    height: screen.height,
    deviceType: screen.deviceType,
    fetchedAt: new Date().toISOString(),
    downloads,
  }

  await writeFile(
    join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  )

  console.log(`Wrote ${downloads.length} file(s) to ${outDir}`)
  console.log(`  ${screen.title}`)
  for (const d of downloads) {
    console.log(`  - ${d.file}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
