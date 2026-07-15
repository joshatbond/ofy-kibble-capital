/**
 * Generates theme CSS (oklch) from src/lib/theme-tones.ts and theme-semantics.ts
 * Usage: bun scripts/generate-theme-tone-css.ts
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  kineticLedgerSemantics,
  vibrantScholarSemantics,
} from '../src/lib/theme-semantics'
import {
  kineticLedgerTones,
  toneStepToSuffix,
  vibrantScholarTones,
} from '../src/lib/theme-tones'

import { cssVarBlock, hexToOklch } from './lib/hex-to-oklch'

import type { ThemeTones } from '../src/lib/theme-tones'

const repoRoot = join(import.meta.dirname, '..')
const themesDir = join(repoRoot, 'src', 'styles', 'themes')
const toneSteps = [
  '000',
  '010',
  '020',
  '030',
  '040',
  '050',
  '060',
  '070',
  '080',
  '090',
  '095',
  '100',
] as const
await main()
function cssVarName(role: string, step: (typeof toneSteps)[number]): string {
  return `--${role}-${toneStepToSuffix(step)}`
}
function tailwindColorName(
  role: string,
  step: (typeof toneSteps)[number]
): string {
  return `${role}-${toneStepToSuffix(step)}`
}
function generateToneBlock(
  dataTheme: string,
  label: string,
  tones: ThemeTones
): string {
  const lines: Array<string> = [
    `/** ${label} tonal steps (generated — bun run theme:tones) */`,
    `[data-theme='${dataTheme}'] {`,
  ]

  for (const [role, scale] of Object.entries(tones) as Array<
    [keyof ThemeTones, ThemeTones[keyof ThemeTones]]
  >) {
    for (const step of toneSteps) {
      lines.push(`  ${cssVarName(role, step)}: ${hexToOklch(scale[step])};`)
    }
  }

  lines.push('}')
  return lines.join('\n')
}
function generateProductThemeFile(options: {
  dataTheme: string
  label: string
  stitchPath: string
  tonesImport: string
  tones: ThemeTones
  semantics: Record<string, string>
  radius: string
  fontSans: string
  fontHeading: string
}): string {
  const ink = hexToOklch(options.semantics.ink)
  const semanticVars = { ...options.semantics }
  delete (semanticVars as { ink?: string }).ink

  return `/**
 * ${options.label}
 * Source: ${options.stitchPath}
 * Generated — bun run theme:tones
 */
@import '${options.tonesImport}';

[data-theme='${options.dataTheme}'] {
  color-scheme: light;

  --font-sans: ${options.fontSans};
  --font-heading: ${options.fontHeading};

${cssVarBlock(semanticVars).join('\n')}
  --radius: ${options.radius};

  --ink: ${ink};
  --shadow-brutal: 4px 4px 0 0 var(--ink);
  --shadow-brutal-lg: 8px 8px 0 0 var(--ink);
}

[data-theme='${options.dataTheme}'] .font-heading,
[data-theme='${options.dataTheme}'] h1,
[data-theme='${options.dataTheme}'] h2,
[data-theme='${options.dataTheme}'] h3 {
  font-family: var(--font-heading);
}
`
}
function generateTailwindThemeBridge(): string {
  const lines: Array<string> = [
    '/** Tailwind color utilities for Stitch tonal steps (generated) */',
    '@theme inline {',
  ]

  for (const role of ['primary', 'secondary', 'tertiary', 'neutral'] as const) {
    for (const step of toneSteps) {
      const varName = cssVarName(role, step)
      lines.push(`  --color-${tailwindColorName(role, step)}: var(${varName});`)
    }
  }

  lines.push('}')
  return lines.join('\n')
}
async function main() {
  const kibbleTones = generateToneBlock(
    'kibble',
    'Kinetic Ledger',
    kineticLedgerTones
  )
  const pawketTones = generateToneBlock(
    'pawket',
    'Vibrant Scholar',
    vibrantScholarTones
  )
  const bridgeCss = generateTailwindThemeBridge()

  const kibbleTheme = generateProductThemeFile({
    dataTheme: 'kibble',
    label: 'Kibble Capital — Kinetic Ledger',
    stitchPath: 'design/stitch/student-payroll-tracker/kinetic-ledger',
    tonesImport: './kinetic-ledger-tones.css',
    tones: kineticLedgerTones,
    semantics: { ...kineticLedgerSemantics },
    radius: '0.5rem',
    fontSans: "'Work Sans Variable', 'Work Sans', sans-serif",
    fontHeading: "'Montserrat Variable', Montserrat, sans-serif",
  })

  const pawketTheme = generateProductThemeFile({
    dataTheme: 'pawket',
    label: 'PawKet Exchange — Vibrant Scholar',
    stitchPath: 'design/stitch/student-payroll-tracker/vibrant-scholar',
    tonesImport: './vibrant-scholar-tones.css',
    tones: vibrantScholarTones,
    semantics: { ...vibrantScholarSemantics },
    radius: '1rem',
    fontSans: "'Rubik Variable', Rubik, sans-serif",
    fontHeading: "'Montserrat Variable', Montserrat, sans-serif",
  })

  await writeFile(
    join(themesDir, 'kinetic-ledger-tones.css'),
    `${kibbleTones}\n`,
    'utf8'
  )
  await writeFile(
    join(themesDir, 'vibrant-scholar-tones.css'),
    `${pawketTones}\n`,
    'utf8'
  )
  await writeFile(
    join(themesDir, 'tonal-palette-theme.css'),
    `${bridgeCss}\n`,
    'utf8'
  )
  await writeFile(join(themesDir, 'kinetic-ledger.css'), kibbleTheme, 'utf8')
  await writeFile(join(themesDir, 'vibrant-scholar.css'), pawketTheme, 'utf8')

  console.log(
    'Wrote oklch theme CSS to src/styles/themes/ (tones + product themes)'
  )
}
