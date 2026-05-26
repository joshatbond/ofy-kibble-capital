import { converter, parse } from 'culori'

const toOklch = converter('oklch')

function formatChannel(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

/** Convert a hex (or css) color to `oklch(L C H)` for theme tokens. */
export function hexToOklch(color: string): string {
  const parsed = parse(color)
  if (!parsed) {
    throw new Error(`Invalid color: ${color}`)
  }

  const oklch = toOklch(parsed)
  const l = formatChannel(oklch.l, 3)
  const c = formatChannel(oklch.c, 3)
  const h = oklch.h

  if (oklch.c === 0 || h === undefined || Number.isNaN(h)) {
    return `oklch(${l} ${c} 0)`
  }

  return `oklch(${l} ${c} ${formatChannel(h, 1)})`
}

export function cssVarBlock(vars: Record<string, string>): Array<string> {
  return Object.entries(vars).map(
    ([name, hex]) => `  --${name}: ${hexToOklch(hex)};`
  )
}
