/** Format a calendar `YYYY-MM-DD` for display (UTC noon to avoid TZ shifts). */
export function formatIsoDay(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) {
    return iso
  }
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return iso
  }
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
  )
}
