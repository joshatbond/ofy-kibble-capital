/** Half-up to nearest integer cent (CONTEXT.md — Money amount). */
export function roundHalfUpToCents(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('Expected a finite number of cents.')
  }
  return Math.floor(value + 0.5)
}

export function percentOfCents(cents: number, percent: number): number {
  return roundHalfUpToCents((cents * percent) / 100)
}
