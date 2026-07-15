/** Parse a dollar input string into integer cents, or null when invalid. */
export function parseDollarInputToCents(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, '').replace(/,/g, '')
  if (trimmed.length === 0) {
    return null
  }

  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) {
    return null
  }

  const dollars = Number(trimmed)
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return null
  }

  return Math.round(dollars * 100)
}
