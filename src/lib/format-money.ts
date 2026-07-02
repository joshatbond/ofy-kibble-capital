/** Format integer cents as a USD display string for wireframe admin pages. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/** Format integer cents with a classroom currency label (e.g. Kibbles). */
export function formatCentsWithLabel(
  cents: number,
  currencyLabel: string
): string {
  return `${formatCents(cents)} ${currencyLabel}`
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
