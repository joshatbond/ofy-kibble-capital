import { describe, expect, test } from 'vitest'

import {
  civilDateInProductTimezone,
  formatIsoDate,
  mondayOnOrBefore,
  parseIsoDate,
  weekdayOf,
} from './dates'
import {
  defaultFirstPayDate,
  nextPayDateOnOrAfter,
  periodBoundsForPayDate,
  planNextPeriodAfterScheduleChange,
} from './periods'

describe('payroll dates', () => {
  test('weekdayOf matches JS Sunday=0 (Tuesday = 2)', () => {
    // 2026-07-14 is a Tuesday.
    expect(weekdayOf(parseIsoDate('2026-07-14'))).toBe(2)
  })

  test('mondayOnOrBefore returns the Monday of that week', () => {
    expect(formatIsoDate(mondayOnOrBefore(parseIsoDate('2026-07-14')))).toBe(
      '2026-07-13'
    )
    expect(formatIsoDate(mondayOnOrBefore(parseIsoDate('2026-07-12')))).toBe(
      '2026-07-06'
    )
  })

  test('civilDateInProductTimezone formats YYYY-MM-DD in PT', () => {
    // 2026-07-14 15:00 UTC = 08:00 PT
    expect(civilDateInProductTimezone(Date.UTC(2026, 6, 14, 15, 0, 0))).toBe(
      '2026-07-14'
    )
  })
})

describe('periodBoundsForPayDate', () => {
  test('weekly: prior Mon–Sun before payday week', () => {
    expect(
      periodBoundsForPayDate(
        { type: 'weekly', weekday: 2 },
        '2026-07-14'
      )
    ).toEqual({
      startDate: '2026-07-06',
      endDate: '2026-07-12',
      payDate: '2026-07-14',
      scheduleType: 'weekly',
      isTransition: false,
    })
  })

  test('biweekly: prior two Mon–Sun weeks with firstPayDate parity', () => {
    expect(
      periodBoundsForPayDate(
        {
          type: 'biweekly',
          weekday: 2,
          firstPayDate: '2026-07-14',
        },
        '2026-07-14'
      )
    ).toEqual({
      startDate: '2026-06-29',
      endDate: '2026-07-12',
      payDate: '2026-07-14',
      scheduleType: 'biweekly',
      isTransition: false,
    })

    expect(
      periodBoundsForPayDate(
        {
          type: 'biweekly',
          weekday: 2,
          firstPayDate: '2026-07-14',
        },
        '2026-07-28'
      )
    ).toEqual({
      startDate: '2026-07-13',
      endDate: '2026-07-26',
      payDate: '2026-07-28',
      scheduleType: 'biweekly',
      isTransition: false,
    })
  })

  test('biweekly rejects off-parity Tuesdays', () => {
    expect(() =>
      periodBoundsForPayDate(
        {
          type: 'biweekly',
          weekday: 2,
          firstPayDate: '2026-07-14',
        },
        '2026-07-21'
      )
    ).toThrow(/bi-weekly cadence/)
  })

  test('semi-monthly: 1–15 and 16–EOM windows', () => {
    expect(
      periodBoundsForPayDate(
        { type: 'semi_monthly', daysOfMonth: [15, 31] },
        '2026-07-15'
      )
    ).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      payDate: '2026-07-15',
      scheduleType: 'semi_monthly',
      isTransition: false,
    })

    expect(
      periodBoundsForPayDate(
        { type: 'semi_monthly', daysOfMonth: [15, 31] },
        '2026-07-31'
      )
    ).toEqual({
      startDate: '2026-07-16',
      endDate: '2026-07-31',
      payDate: '2026-07-31',
      scheduleType: 'semi_monthly',
      isTransition: false,
    })

    // February clamps day 31 → 28.
    expect(
      periodBoundsForPayDate(
        { type: 'semi_monthly', daysOfMonth: [15, 31] },
        '2026-02-28'
      )
    ).toEqual({
      startDate: '2026-02-16',
      endDate: '2026-02-28',
      payDate: '2026-02-28',
      scheduleType: 'semi_monthly',
      isTransition: false,
    })
  })

  test('monthly: prior calendar month', () => {
    expect(
      periodBoundsForPayDate({ type: 'monthly', dayOfMonth: 28 }, '2026-08-28')
    ).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      payDate: '2026-08-28',
      scheduleType: 'monthly',
      isTransition: false,
    })
  })
})

describe('nextPayDateOnOrAfter', () => {
  test('weekly finds the next matching weekday', () => {
    expect(
      nextPayDateOnOrAfter({ type: 'weekly', weekday: 2 }, '2026-07-13')
    ).toBe('2026-07-14')
    expect(
      nextPayDateOnOrAfter({ type: 'weekly', weekday: 2 }, '2026-07-14')
    ).toBe('2026-07-14')
  })

  test('biweekly skips off-parity weeks', () => {
    expect(
      nextPayDateOnOrAfter(
        {
          type: 'biweekly',
          weekday: 2,
          firstPayDate: '2026-07-14',
        },
        '2026-07-15'
      )
    ).toBe('2026-07-28')
  })

  test('biweekly rejects firstPayDate that is not on weekday', () => {
    expect(() =>
      nextPayDateOnOrAfter(
        {
          type: 'biweekly',
          weekday: 5,
          firstPayDate: '2025-07-15',
        },
        '2026-07-29'
      )
    ).toThrow(/firstPayDate.*must fall on weekday/)
  })
})

describe('defaultFirstPayDate', () => {
  test('July 1 + period + week, snapped to biweekly Tuesday', () => {
    // July 1 + 14 + 7 = July 22 (Wed) → next Tuesday July 28.
    expect(
      defaultFirstPayDate(
        {
          type: 'biweekly',
          weekday: 2,
          firstPayDate: '2026-07-14',
        },
        '2026-07-01'
      )
    ).toBe('2026-07-28')
  })
})

describe('planNextPeriodAfterScheduleChange', () => {
  test('inserts a transition period when schedules leave a gap', () => {
    const previous = {
      type: 'biweekly' as const,
      weekday: 2,
      firstPayDate: '2026-07-14',
    }
    const next = {
      type: 'semi_monthly' as const,
      daysOfMonth: [15, 31],
    }

    // Last biweekly window ended Jul 12. Jul 1–15 overlaps; next clean
    // semi-monthly window is Jul 16–31 — gap Jul 13–15 paid on Jul 31.
    expect(
      planNextPeriodAfterScheduleChange({
        previousSchedule: previous,
        nextSchedule: next,
        lastPeriodEndIso: '2026-07-12',
        fromIso: '2026-07-13',
      })
    ).toEqual({
      startDate: '2026-07-13',
      endDate: '2026-07-15',
      payDate: '2026-07-31',
      scheduleType: 'transition',
      isTransition: true,
    })
  })

  test('returns the normal next period when windows abut', () => {
    // Skip the Jul 14 payday (window Jul 6–12 already closed); Jul 21 abuts.
    expect(
      planNextPeriodAfterScheduleChange({
        previousSchedule: { type: 'weekly', weekday: 2 },
        nextSchedule: { type: 'weekly', weekday: 2 },
        lastPeriodEndIso: '2026-07-12',
        fromIso: '2026-07-14',
      })
    ).toEqual({
      startDate: '2026-07-13',
      endDate: '2026-07-19',
      payDate: '2026-07-21',
      scheduleType: 'weekly',
      isTransition: false,
    })
  })
})
