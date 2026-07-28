import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import {
  payPeriodScheduleTypeValidator,
  payPeriodStatusValidator,
} from '../schema/schemaFields'

import { requireTeacherForOrg } from './auth/teacher'
import { validateStubAttendanceForPayPeriod } from './payroll/attendanceValidation'
import {
  ensureCurrentPayPeriodForOrg,
  listPayPeriodsForOrg,
  toPayPeriodPublic,
} from './payroll/periodStore'
import { postponePayPeriodRun } from './payroll/postpone'
import { executePayRunForPeriod } from './payroll/runPayPeriod'

const payPeriodPublicValidator = v.object({
  _id: v.id('payPeriods'),
  organizationId: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  payDate: v.string(),
  scheduleType: payPeriodScheduleTypeValidator,
  isTransition: v.boolean(),
  status: payPeriodStatusValidator,
  createdAt: v.number(),
  closedAt: v.optional(v.number()),
})

const attendanceValidationValidator = v.union(
  v.object({
    status: v.literal('ready'),
    activeStudentCount: v.number(),
    payPeriodId: v.id('payPeriods'),
    records: v.array(
      v.object({
        rosterStudentId: v.id('rosterStudents'),
        externalStudentId: v.number(),
        presentDates: v.array(v.string()),
        daysAttended: v.number(),
        overtimeHours: v.number(),
      })
    ),
  }),
  v.object({
    status: v.literal('blocked'),
    activeStudentCount: v.number(),
    payPeriodId: v.id('payPeriods'),
    blockReasons: v.array(v.string()),
  })
)

const payRunResultValidator = v.union(
  v.object({
    status: v.literal('succeeded'),
    payRunId: v.id('payRuns'),
    payPeriodId: v.id('payPeriods'),
    stubCount: v.number(),
    alreadyCompleted: v.boolean(),
  }),
  v.object({
    status: v.literal('blocked'),
    payRunId: v.id('payRuns'),
    payPeriodId: v.id('payPeriods'),
    blockReasons: v.array(v.string()),
  })
)

/** Pay periods for a classroom, newest pay date first. */
export const listPayPeriodsForOrganization = query({
  args: { organizationId: v.string() },
  returns: v.array(payPeriodPublicValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'organizations:read'
    )

    const periods = await listPayPeriodsForOrg(ctx, args.organizationId)
    return periods.map(toPayPeriodPublic)
  },
})

/**
 * Open period for the next payday on/after today, creating it when missing.
 * Pass `nowMs` only from tests; production uses Date.now().
 */
export const ensureCurrentPayPeriod = mutation({
  args: {
    organizationId: v.string(),
    nowMs: v.optional(v.number()),
  },
  returns: payPeriodPublicValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'organizations:update'
    )

    const period = await ensureCurrentPayPeriodForOrg(ctx, {
      organizationId: args.organizationId,
      nowMs: args.nowMs ?? Date.now(),
    })

    return toPayPeriodPublic(period)
  },
})

/**
 * Preview stub attendance validation for a pay period.
 * Pay run mutations must use the same gate before posting stubs.
 */
export const validateAttendanceForPayPeriod = query({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
  },
  returns: attendanceValidationValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'organizations:read'
    )

    const result = await validateStubAttendanceForPayPeriod(ctx, args)

    if (result.status === 'blocked') {
      return {
        status: 'blocked' as const,
        activeStudentCount: result.activeStudentCount,
        payPeriodId: result.payPeriod._id,
        blockReasons: result.blockReasons,
      }
    }

    return {
      status: 'ready' as const,
      activeStudentCount: result.activeStudentCount,
      payPeriodId: result.payPeriod._id,
      records: result.records,
    }
  },
})

/**
 * Manual **Pay run** for a period: attendance gate → paystubs → ledger.
 * Idempotent after the first successful run for that period.
 */
export const runPayPeriod = mutation({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
    nowMs: v.optional(v.number()),
  },
  returns: payRunResultValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'organizations:update'
    )

    return await executePayRunForPeriod(ctx, {
      organizationId: args.organizationId,
      payPeriodId: args.payPeriodId,
      triggeredBy: 'manual',
      nowMs: args.nowMs ?? Date.now(),
    })
  },
})

/**
 * **Postpone pay run** — delay automation to a later calendar date.
 * Work-window bounds stay the same; effective payday becomes `postponedUntil`.
 */
export const postponePayPeriod = mutation({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
    postponedUntil: v.string(),
    nowMs: v.optional(v.number()),
  },
  returns: v.object({
    payRunId: v.id('payRuns'),
    payPeriodId: v.id('payPeriods'),
    postponedUntil: v.string(),
    effectivePayDate: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'organizations:update'
    )

    return await postponePayPeriodRun(ctx, {
      organizationId: args.organizationId,
      payPeriodId: args.payPeriodId,
      postponedUntil: args.postponedUntil,
      nowMs: args.nowMs ?? Date.now(),
    })
  },
})
