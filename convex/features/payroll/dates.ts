/** Product timezone for payday / pay-period civil dates (CONTEXT.md). */
export const PRODUCT_TIMEZONE = 'America/Los_Angeles'

export function parseIsoDate(iso: string): CivilDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (match === null) {
    throw new Error(`Invalid ISO date "${iso}". Expected YYYY-MM-DD.`)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Invalid calendar date "${iso}".`)
  }

  return { year, month, day }
}
export function formatIsoDate(date: CivilDate): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}
export function civilDateInProductTimezone(nowMs: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PRODUCT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(nowMs))
}

/** Clock parts in product timezone (24h). */
export function clockInProductTimezone(nowMs: number): {
  hour: number
  minute: number
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PRODUCT_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(nowMs))

  const hour = Number(parts.find(part => part.type === 'hour')?.value)
  const minute = Number(parts.find(part => part.type === 'minute')?.value)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('Failed to read product-timezone clock.')
  }

  return { hour, minute }
}

/** v1 **Pay run time**: 8:30 AM America/Los_Angeles. */
export function isPaydayAutomationClock(nowMs: number): boolean {
  const { hour, minute } = clockInProductTimezone(nowMs)
  return hour === 8 && minute === 30
}

export function weekdayOf(date: CivilDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12)).getUTCDay()
}
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}
export function addDays(date: CivilDate, delta: number): CivilDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day, 12))
  utc.setUTCDate(utc.getUTCDate() + delta)
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  }
}
export function compareIsoDates(a: string, b: string): number {
  if (a === b) {
    return 0
  }
  return a < b ? -1 : 1
}
export function mondayOnOrBefore(date: CivilDate): CivilDate {
  const dow = weekdayOf(date)
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  return addDays(date, -daysFromMonday)
}
export function clampDayOfMonth(
  year: number,
  month: number,
  dayOfMonth: number
): number {
  return Math.min(Math.max(dayOfMonth, 1), daysInMonth(year, month))
}
export type CivilDate = {
  year: number
  month: number
  day: number
}
