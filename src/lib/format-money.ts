/** Numeric portion of a money display (no currency symbol). */
export function formatCentsAmount(cents: number): string {
  return (Math.abs(cents) / 100).toFixed(2)
}

/**
 * @deprecated Prefer `<MoneyAmount cents={…} />` in UI. Kept for non-React call sites.
 */
export function formatCents(cents: number): string {
  return formatCentsAmount(cents)
}

/**
 * @deprecated The Bark Buck symbol replaces inline currency labels in UI.
 */
export function formatCentsWithLabel(
  cents: number,
  _currencyLabel: string
): string {
  return formatCentsAmount(cents)
}

export function formatPaySchedule(schedule: {
  type: string
  weekday?: number
  firstPayDate?: string
  daysOfMonth?: Array<number>
  dayOfMonth?: number
}): string {
  switch (schedule.type) {
    case 'weekly':
      return `Weekly (weekday ${String(schedule.weekday)})`
    case 'biweekly':
      return `Bi-weekly from ${schedule.firstPayDate ?? 'anchor'}`
    case 'semi_monthly':
      return `Semi-monthly on days ${(schedule.daysOfMonth ?? []).join(', ')}`
    case 'monthly':
      return `Monthly on day ${String(schedule.dayOfMonth)}`
    default:
      return schedule.type
  }
}
