/**
 * Fetch Stitch design systems for a project via MCP (list_design_systems).
 * Usage: node scripts/fetch-stitch-design-systems.mjs [projectId]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const projectId = process.argv[2] ?? '310125272977918197'
const repoRoot = join(import.meta.dirname, '..')
const mcpPath = join(repoRoot, '.cursor', 'mcp.json')
const outRoot = join(repoRoot, 'design', 'stitch', 'student-payroll-tracker')

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

function slug(displayName) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  return dest
}

async function main() {
  const data = await stitchCall('list_design_systems', { projectId })
  await mkdir(outRoot, { recursive: true })

  const manifest = {
    projectId,
    projectTitle: 'Student Payroll Tracker',
    fetchedAt: new Date().toISOString(),
    note: 'Design systems are returned by list_design_systems, not get_screen. Asset-stub IDs map to assets/<hash> entries below.',
    designSystems: [],
  }

  for (const entry of data.designSystems ?? []) {
    const assetId = entry.name?.replace(/^assets\//, '') ?? 'unknown'
    const ds = entry.designSystem ?? {}
    const dir = join(outRoot, slug(ds.displayName ?? assetId))
    await mkdir(dir, { recursive: true })

    const designMd = ds.theme?.designMd ?? ''
    if (designMd) {
      await writeFile(join(dir, 'DESIGN.md'), designMd, 'utf8')
    }
    if (ds.styleGuidelines) {
      await writeFile(
        join(dir, 'style-guidelines.md'),
        ds.styleGuidelines,
        'utf8'
      )
    }
    await writeFile(
      join(dir, 'theme.json'),
      JSON.stringify(
        {
          displayName: ds.displayName,
          assetName: entry.name,
          version: entry.version,
          theme: ds.theme,
        },
        null,
        2
      ),
      'utf8'
    )

    const downloads = []
    for (const [key, url] of Object.entries({
      screenshot: ds.screenshot?.downloadUrl,
      htmlCode: ds.htmlCode?.downloadUrl,
    })) {
      if (!url) continue
      const ext =
        key === 'screenshot'
          ? '.png'
          : ds.htmlCode?.mimeType?.includes('html')
            ? '.html'
            : '.bin'
      const path = await download(url, join(dir, `${key}${ext}`))
      downloads.push({ key, url, path: path.replace(repoRoot + '/', '') })
    }

    const outputDir = join(
      'design',
      'stitch',
      'student-payroll-tracker',
      slug(ds.displayName ?? assetId)
    ).replaceAll('\\', '/')

    manifest.designSystems.push({
      displayName: ds.displayName,
      assetName: entry.name,
      assetId,
      stitchAssetStubPrefix: `asset-stub-assets-${assetId}`,
      outputDir,
      downloads,
    })
  }

  const project = await stitchCall('get_project', {
    name: `projects/${projectId}`,
  })
  const instancesByAsset = new Map()
  for (const inst of project.screenInstances ?? []) {
    if (inst.type !== 'DESIGN_SYSTEM_INSTANCE' || !inst.sourceAsset) continue
    instancesByAsset.set(inst.sourceAsset, inst)
  }

  for (const dsEntry of manifest.designSystems) {
    const inst = instancesByAsset.get(dsEntry.assetName)
    if (!inst) continue
    dsEntry.canvasInstanceId = inst.id
    dsEntry.stitchScreenId = `asset-stub-${inst.id}`
    dsEntry.canvas = {
      width: inst.width,
      height: inst.height,
      x: inst.x,
      y: inst.y,
    }

    const dir = join(outRoot, slug(dsEntry.displayName ?? dsEntry.assetId))
    await writeFile(
      join(dir, 'screen-instance.json'),
      JSON.stringify(
        {
          title: 'Design System',
          stitchScreenId: dsEntry.stitchScreenId,
          canvasInstanceId: inst.id,
          sourceAsset: inst.sourceAsset,
          displayName: dsEntry.displayName,
          type: inst.type,
          canvas: dsEntry.canvas,
          apiNote:
            'Stitch MCP get_screen returns entity not found for DESIGN_SYSTEM_INSTANCE IDs. Token code lives in DESIGN.md, style-guidelines.md, and theme.json.',
        },
        null,
        2
      ),
      'utf8'
    )
  }

  await writeFile(
    join(outRoot, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  )

  console.log(
    `Wrote ${manifest.designSystems.length} design system(s) to ${outRoot}`
  )
  for (const ds of manifest.designSystems) {
    console.log(`  - ${ds.displayName} → ${ds.outputDir}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
