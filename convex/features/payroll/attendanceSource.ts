import {
  addDays,
  compareIsoDates,
  formatIsoDate,
  parseIsoDate,
  weekdayOf,
} from './dates'

import type { Id } from '../../_generated/dataModel'

export function loadStubAttendance(
  request: AttendanceSourceRequest
): AttendanceSourceResult {
  if (compareIsoDates(request.startDate, request.endDate) > 0) {
    return {
      ok: false,
      failureReason: `Invalid pay period bounds ${request.startDate}–${request.endDate}.`,
    }
  }

  const weekdayDates = listWeekdayDatesInRange(
    request.startDate,
    request.endDate
  )

  const records: Array<StudentAttendanceRecord> = request.activeStudents.map(
    student => ({
      rosterStudentId: student.rosterStudentId,
      externalStudentId: student.externalStudentId,
      presentDates: [...weekdayDates],
      daysAttended: weekdayDates.length,
      overtimeHours: 0,
    })
  )

  return { ok: true, records }
}
export function listWeekdayDatesInRange(
  startIso: string,
  endIso: string
): Array<string> {
  const dates: Array<string> = []
  let cursor = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)

  while (compareIsoDates(formatIsoDate(cursor), formatIsoDate(end)) <= 0) {
    const dow = weekdayOf(cursor)
    if (dow >= 1 && dow <= 5) {
      dates.push(formatIsoDate(cursor))
    }
    cursor = addDays(cursor, 1)
  }

  return dates
}
export type AttendanceRosterStudent = {
  rosterStudentId: Id<'rosterStudents'>
  externalStudentId: number
  /** Optional label for block-reason messages. */
  label: string
}
export type StudentAttendanceRecord = {
  rosterStudentId: Id<'rosterStudents'>
  externalStudentId: number
  /** ISO dates marked present (all-or-nothing day). */
  presentDates: Array<string>
  /** Count of present days — drives base hours. */
  daysAttended: number
  /** Overtime hours for the period (includes cafe night when imported). */
  overtimeHours: number
}
export type AttendanceSourceSuccess = {
  ok: true
  records: Array<StudentAttendanceRecord>
}
export type AttendanceSourceFailure = {
  ok: false
  failureReason: string
}
export type AttendanceSourceResult =
  | AttendanceSourceSuccess
  | AttendanceSourceFailure
export type AttendanceSourceRequest = {
  organizationId: string
  startDate: string
  endDate: string
  activeStudents: Array<AttendanceRosterStudent>
}
