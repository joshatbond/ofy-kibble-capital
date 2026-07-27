import {
  addDays,
  clampDayOfMonth,
  compareIsoDates,
  daysInMonth,
  formatIsoDate,
  mondayOnOrBefore,
  parseIsoDate,
  weekdayOf,
} from './dates'

import type { CivilDate } from './dates'
import type { SettingsValues } from '../settings/values'

export function periodBoundsForPayDate(
  schedule: PaySchedule,
  payDateIso: string
): PayPeriodDraft {
  const payDate = parseIsoDate(payDateIso)

  switch (schedule.type) {
    case 'weekly': {
      assertPayDateMatchesWeekday(payDate, schedule.weekday)
      const mondayOfPayWeek = mondayOnOrBefore(payDate)
      const start = addDays(mondayOfPayWeek, -7)
      const end = addDays(mondayOfPayWeek, -1)
      return draft(start, end, payDate, 'weekly', false)
    }
    case 'biweekly': {
      assertPayDateMatchesWeekday(payDate, schedule.weekday)
      assertBiweeklyParity(schedule.firstPayDate, payDateIso)
      const mondayOfPayWeek = mondayOnOrBefore(payDate)
      const start = addDays(mondayOfPayWeek, -14)
      const end = addDays(mondayOfPayWeek, -1)
      return draft(start, end, payDate, 'biweekly', false)
    }
    case 'semi_monthly': {
      const days = normalizedSemiMonthlyDays(schedule.daysOfMonth)
      const payDay = payDate.day
      const first = clampDayOfMonth(payDate.year, payDate.month, days[0])
      const second = clampDayOfMonth(payDate.year, payDate.month, days[1])

      if (payDay === first) {
        return draft(
          { year: payDate.year, month: payDate.month, day: 1 },
          { year: payDate.year, month: payDate.month, day: 15 },
          payDate,
          'semi_monthly',
          false
        )
      }

      if (payDay === second) {
        const last = daysInMonth(payDate.year, payDate.month)
        return draft(
          { year: payDate.year, month: payDate.month, day: 16 },
          { year: payDate.year, month: payDate.month, day: last },
          payDate,
          'semi_monthly',
          false
        )
      }

      throw new Error(
        `Pay date ${payDateIso} is not a semi-monthly payday for days ${days.join(', ')}.`
      )
    }
    case 'monthly': {
      const expected = clampDayOfMonth(
        payDate.year,
        payDate.month,
        schedule.dayOfMonth
      )
      if (payDate.day !== expected) {
        throw new Error(
          `Pay date ${payDateIso} does not match monthly payday day ${String(schedule.dayOfMonth)}.`
        )
      }

      const prior = addDays(
        { year: payDate.year, month: payDate.month, day: 1 },
        -1
      )
      return draft(
        { year: prior.year, month: prior.month, day: 1 },
        prior,
        payDate,
        'monthly',
        false
      )
    }
  }
}
export function nextPayDateOnOrAfter(
  schedule: PaySchedule,
  fromIso: string
): string {
  const from = parseIsoDate(fromIso)
  let cursor = from

  for (let i = 0; i < 400; i += 1) {
    const iso = formatIsoDate(cursor)
    if (isPayDate(schedule, iso) && compareIsoDates(iso, fromIso) >= 0) {
      return iso
    }
    cursor = addDays(cursor, 1)
  }

  throw new Error('Could not find a pay date within search horizon.')
}
export function isPayDate(schedule: PaySchedule, iso: string): boolean {
  const date = parseIsoDate(iso)

  switch (schedule.type) {
    case 'weekly':
      return weekdayOf(date) === schedule.weekday
    case 'biweekly':
      return (
        weekdayOf(date) === schedule.weekday &&
        isBiweeklyParity(schedule.firstPayDate, iso)
      )
    case 'semi_monthly': {
      const days = normalizedSemiMonthlyDays(schedule.daysOfMonth)
      const first = clampDayOfMonth(date.year, date.month, days[0])
      const second = clampDayOfMonth(date.year, date.month, days[1])
      return date.day === first || date.day === second
    }
    case 'monthly':
      return (
        date.day === clampDayOfMonth(date.year, date.month, schedule.dayOfMonth)
      )
  }
}
export function defaultFirstPayDate(
  schedule: PaySchedule,
  schoolYearStartIso = '2026-07-01'
): string {
  const start = parseIsoDate(schoolYearStartIso)
  const periodLengthDays = approximatePeriodLengthDays(schedule)
  const raw = formatIsoDate(addDays(start, periodLengthDays + 7))
  return nextPayDateOnOrAfter(schedule, raw)
}
export function planNextPeriodAfterScheduleChange(args: {
  previousSchedule: PaySchedule
  nextSchedule: PaySchedule
  lastPeriodEndIso: string
  /** Civil date to search for the next payday from (usually today). */
  fromIso: string
}): PayPeriodDraft {
  const gapStart = formatIsoDate(
    addDays(parseIsoDate(args.lastPeriodEndIso), 1)
  )
  // previousSchedule reserved for future UX / cutover messaging (ADR-0004).
  void args.previousSchedule
  let searchFrom = args.fromIso

  for (let i = 0; i < 24; i += 1) {
    const nextPayDate = nextPayDateOnOrAfter(args.nextSchedule, searchFrom)
    const nextNormal = periodBoundsForPayDate(args.nextSchedule, nextPayDate)

    if (compareIsoDates(nextNormal.startDate, gapStart) === 0) {
      return nextNormal
    }

    if (compareIsoDates(nextNormal.startDate, gapStart) > 0) {
      const gapEnd = formatIsoDate(
        addDays(parseIsoDate(nextNormal.startDate), -1)
      )
      return {
        startDate: gapStart,
        endDate: gapEnd,
        payDate: nextPayDate,
        scheduleType: 'transition',
        isTransition: true,
      }
    }

    // Window starts before the gap — already covered or overlapping; try later.
    searchFrom = formatIsoDate(addDays(parseIsoDate(nextPayDate), 1))
  }

  throw new Error('Could not plan a post-schedule-change pay period.')
}
export type PaySchedule = SettingsValues['paySchedule']
export type PayPeriodDraft = {
  startDate: string
  endDate: string
  payDate: string
  scheduleType:
    | 'weekly'
    | 'biweekly'
    | 'semi_monthly'
    | 'monthly'
    | 'transition'
  isTransition: boolean
}
function draft(
  start: CivilDate,
  end: CivilDate,
  payDate: CivilDate,
  scheduleType: PayPeriodDraft['scheduleType'],
  isTransition: boolean
): PayPeriodDraft {
  const startDate = formatIsoDate(start)
  const endDate = formatIsoDate(end)
  if (compareIsoDates(startDate, endDate) > 0) {
    throw new Error(`Invalid period bounds ${startDate}–${endDate}.`)
  }

  return {
    startDate,
    endDate,
    payDate: formatIsoDate(payDate),
    scheduleType,
    isTransition,
  }
}
function assertPayDateMatchesWeekday(date: CivilDate, weekday: number): void {
  if (weekdayOf(date) !== weekday) {
    throw new Error(
      `Pay date ${formatIsoDate(date)} is not weekday ${String(weekday)}.`
    )
  }
}
function assertBiweeklyParity(firstPayDate: string, payDateIso: string): void {
  if (!isBiweeklyParity(firstPayDate, payDateIso)) {
    throw new Error(
      `Pay date ${payDateIso} is not on the bi-weekly cadence from ${firstPayDate}.`
    )
  }
}
function isBiweeklyParity(firstPayDate: string, payDateIso: string): boolean {
  const anchor = parseIsoDate(firstPayDate)
  const pay = parseIsoDate(payDateIso)
  const diffDays = civilDiffDays(anchor, pay)
  return diffDays % 14 === 0
}
function civilDiffDays(from: CivilDate, to: CivilDate): number {
  const a = Date.UTC(from.year, from.month - 1, from.day, 12)
  const b = Date.UTC(to.year, to.month - 1, to.day, 12)
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}
function normalizedSemiMonthlyDays(
  daysOfMonth: Array<number>
): [number, number] {
  if (daysOfMonth.length !== 2) {
    throw new Error('Semi-monthly schedule requires exactly two days of month.')
  }

  const sorted = [...daysOfMonth].sort((a, b) => a - b)
  return [sorted[0], sorted[1]]
}
function approximatePeriodLengthDays(schedule: PaySchedule): number {
  switch (schedule.type) {
    case 'weekly':
      return 7
    case 'biweekly':
      return 14
    case 'semi_monthly':
      return 15
    case 'monthly':
      return 30
  }
}
