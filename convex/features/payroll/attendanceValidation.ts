import { userError } from '../appError'

import { loadStubAttendance } from './attendanceSource'
import { validateAttendanceForPayRun } from './validateAttendance'

import type { AttendanceRosterStudent } from './attendanceSource'
import type { PayRunAttendanceValidation } from './validateAttendance'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

export async function listActiveAttendanceRoster(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
): Promise<Array<AttendanceRosterStudent>> {
  const roster = await ctx.db
    .query('rosterStudents')
    .withIndex('by_organizationId', q => q.eq('organizationId', organizationId))
    .collect()

  return roster
    .filter(student => student.status === 'active')
    .map(toAttendanceRosterStudent)
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Load stub attendance for a pay period and validate for **Blocked pay run**.
 * Pay run orchestration / automation must call this before posting stubs.
 */
export async function validateStubAttendanceForPayPeriod(
  ctx: QueryCtx | MutationCtx,
  args: {
    organizationId: string
    payPeriodId: Id<'payPeriods'>
  }
): Promise<
  PayRunAttendanceValidation & {
    payPeriod: Doc<'payPeriods'>
    activeStudentCount: number
  }
> {
  const payPeriod = await ctx.db.get('payPeriods', args.payPeriodId)
  if (payPeriod === null) {
    userError('Pay period not found.')
  }

  if (payPeriod.organizationId !== args.organizationId) {
    userError('Pay period does not belong to this organization.')
  }

  const activeStudents = await listActiveAttendanceRoster(
    ctx,
    args.organizationId
  )
  const source = loadStubAttendance({
    organizationId: args.organizationId,
    startDate: payPeriod.startDate,
    endDate: payPeriod.endDate,
    activeStudents,
  })
  const validation = validateAttendanceForPayRun({ activeStudents, source })

  return {
    ...validation,
    payPeriod,
    activeStudentCount: activeStudents.length,
  }
}

function toAttendanceRosterStudent(
  student: Doc<'rosterStudents'>
): AttendanceRosterStudent {
  return {
    rosterStudentId: student._id,
    externalStudentId: student.externalStudentId,
    label: student.displayName?.trim() || student.email,
  }
}
