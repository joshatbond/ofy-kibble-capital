import { describe, expect, test } from 'vitest'

import { listWeekdayDatesInRange, loadStubAttendance } from './attendanceSource'
import { validateAttendanceForPayRun } from './validateAttendance'

import type { Id } from '../../_generated/dataModel'

const studentA = {
  rosterStudentId: 'rosterA' as Id<'rosterStudents'>,
  externalStudentId: 1001,
  label: 'Ada',
}
const studentB = {
  rosterStudentId: 'rosterB' as Id<'rosterStudents'>,
  externalStudentId: 1002,
  label: 'Bea',
}

describe('listWeekdayDatesInRange', () => {
  test('counts Mon–Fri only within the inclusive window', () => {
    // Jul 6–12 2026 is Mon–Sun → 5 weekdays.
    expect(listWeekdayDatesInRange('2026-07-06', '2026-07-12')).toEqual([
      '2026-07-06',
      '2026-07-07',
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
    ])
  })
})

describe('loadStubAttendance', () => {
  test('marks every weekday present with zero overtime for each active student', () => {
    const result = loadStubAttendance({
      organizationId: 'org_1',
      startDate: '2026-06-29',
      endDate: '2026-07-12',
      activeStudents: [studentA, studentB],
    })

    expect(result.ok).toBe(true)
    expect(result).toMatchObject({
      ok: true,
    })
    if (result.ok !== true) {
      expect.unreachable('expected stub attendance to succeed')
    }

    expect(result.records).toHaveLength(2)
    expect(result.records[0]).toMatchObject({
      rosterStudentId: studentA.rosterStudentId,
      daysAttended: 10,
      overtimeHours: 0,
    })
    expect(result.records[0]?.presentDates).toHaveLength(10)
    expect(result.records[1]?.daysAttended).toBe(10)
  })

  test('fails on inverted period bounds', () => {
    expect(
      loadStubAttendance({
        organizationId: 'org_1',
        startDate: '2026-07-12',
        endDate: '2026-07-06',
        activeStudents: [studentA],
      })
    ).toEqual({
      ok: false,
      failureReason: 'Invalid pay period bounds 2026-07-12–2026-07-06.',
    })
  })
})

describe('validateAttendanceForPayRun', () => {
  test('ready when stub covers every active student', () => {
    const source = loadStubAttendance({
      organizationId: 'org_1',
      startDate: '2026-07-06',
      endDate: '2026-07-12',
      activeStudents: [studentA, studentB],
    })

    expect(
      validateAttendanceForPayRun({
        activeStudents: [studentA, studentB],
        source,
      })
    ).toMatchObject({
      status: 'ready',
    })
  })

  test('blocks when the roster has no active students', () => {
    expect(
      validateAttendanceForPayRun({
        activeStudents: [],
        source: { ok: true, records: [] },
      })
    ).toEqual({
      status: 'blocked',
      blockReasons: ['No active students on the roster.'],
    })
  })

  test('blocks on attendance source failure', () => {
    expect(
      validateAttendanceForPayRun({
        activeStudents: [studentA],
        source: { ok: false, failureReason: 'Turso unreachable' },
      })
    ).toEqual({
      status: 'blocked',
      blockReasons: ['Turso unreachable'],
    })
  })

  test('blocks when any active student is missing from the source', () => {
    expect(
      validateAttendanceForPayRun({
        activeStudents: [studentA, studentB],
        source: {
          ok: true,
          records: [
            {
              rosterStudentId: studentA.rosterStudentId,
              externalStudentId: studentA.externalStudentId,
              presentDates: ['2026-07-06'],
              daysAttended: 1,
              overtimeHours: 0,
            },
          ],
        },
      })
    ).toEqual({
      status: 'blocked',
      blockReasons: [
        'Missing attendance for Bea (external id 1002).',
      ],
    })
  })
})
