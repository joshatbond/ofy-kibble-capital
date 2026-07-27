import type {
  AttendanceRosterStudent,
  AttendanceSourceResult,
  StudentAttendanceRecord,
} from './attendanceSource'

export type PayRunAttendanceReady = {
  status: 'ready'
  records: Array<StudentAttendanceRecord>
}

export type PayRunAttendanceBlocked = {
  status: 'blocked'
  blockReasons: Array<string>
}

export type PayRunAttendanceValidation =
  | PayRunAttendanceReady
  | PayRunAttendanceBlocked

/**
 * Classroom-wide pre–pay-run gate: source failure or any missing active
 * student → **Blocked pay run** (no partial pay).
 */
export function validateAttendanceForPayRun(args: {
  activeStudents: Array<AttendanceRosterStudent>
  source: AttendanceSourceResult
}): PayRunAttendanceValidation {
  if (args.activeStudents.length === 0) {
    return {
      status: 'blocked',
      blockReasons: ['No active students on the roster.'],
    }
  }

  if (!args.source.ok) {
    return {
      status: 'blocked',
      blockReasons: [args.source.failureReason],
    }
  }

  const byRosterId = new Map(
    args.source.records.map(record => [record.rosterStudentId, record])
  )
  const blockReasons: Array<string> = []

  for (const student of args.activeStudents) {
    const record = byRosterId.get(student.rosterStudentId)
    if (record === undefined) {
      blockReasons.push(
        `Missing attendance for ${student.label} (external id ${String(student.externalStudentId)}).`
      )
      continue
    }

    if (record.externalStudentId !== student.externalStudentId) {
      blockReasons.push(
        `Attendance external id mismatch for ${student.label}.`
      )
    }

    if (
      !Number.isFinite(record.overtimeHours) ||
      record.overtimeHours < 0
    ) {
      blockReasons.push(
        `Invalid overtime hours for ${student.label}.`
      )
    }

    if (
      !Number.isInteger(record.daysAttended) ||
      record.daysAttended < 0 ||
      record.daysAttended !== record.presentDates.length
    ) {
      blockReasons.push(
        `Invalid days attended for ${student.label}.`
      )
    }
  }

  if (blockReasons.length > 0) {
    return { status: 'blocked', blockReasons }
  }

  // Stable order matching the active roster.
  const records = args.activeStudents.map(student => {
    const record = byRosterId.get(student.rosterStudentId)
    if (record === undefined) {
      throw new Error('Attendance record missing after validation.')
    }
    return record
  })

  return { status: 'ready', records }
}
