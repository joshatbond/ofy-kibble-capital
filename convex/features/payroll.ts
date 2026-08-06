import { getAuthUserId } from '@convex-dev/auth/server'
import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'

import { toUserError, userError } from './appError'
import { requireTeacherForOrg } from './auth/teacher'
import { getActiveRosterStudentForUser } from './banking/student'
import {
  getOpenPayPeriodAdminDetails,
  getPayPeriodAdminDetails,
  getPayRunAdminReport,
  getPayrollAdminPage,
  payPeriodAdminDetailsValidator,
  payRunAdminReportValidator,
  payrollAdminPageValidator,
} from './payroll/adminStatus'
import { validateStubAttendanceForPayPeriod } from './payroll/attendanceValidation'
import {
  ensureCurrentPayPeriodForOrg,
  listPayPeriodsForOrg,
  payPeriodPublicValidator,
  toPayPeriodPublic,
} from './payroll/periodStore'
import { postponePayPeriodRun } from './payroll/postpone'
import { executePayRunForPeriod } from './payroll/runPayPeriod'
import {
  countUnviewedPaystubsForStudent,
  getPaystubForStudent,
  listPaystubsForStudent,
  markPaystubViewedForStudent,
  paystubDetailValidator,
  paystubListItemValidator,
} from './payroll/studentPaystubs'

const payScheduleUserErrors = [
  {
    pattern: /firstPayDate.*must fall on weekday/i,
    message:
      'The biweekly pay schedule is invalid. Open Settings, pick Bi-weekly again, and save.',
  },
  {
    pattern: /search horizon/i,
    message:
      'Could not find a valid payday for this classroom schedule. Check Settings, then try again.',
  },
] as const

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
export const listPayPeriodsForOrganization = query({
  args: { organizationId: v.string() },
  returns: v.array(payPeriodPublicValidator),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      await requireTeacherForOrg(
        ctx,
        userId,
        args.organizationId,
        'organizations:read'
      )

      const periods = await listPayPeriodsForOrg(ctx, args.organizationId)
      return periods.map(toPayPeriodPublic)
    } catch (error) {
      toUserError(error, 'Could not load pay periods.')
    }
  },
})
export const ensureCurrentPayPeriod = mutation({
  args: {
    organizationId: v.string(),
  },
  returns: payPeriodPublicValidator,
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      await requireTeacherForOrg(
        ctx,
        userId,
        args.organizationId,
        'organizations:update'
      )

      const period = await ensureCurrentPayPeriodForOrg(ctx, {
        organizationId: args.organizationId,
        nowMs: Date.now(),
      })

      return toPayPeriodPublic(period)
    } catch (error) {
      toUserError(error, 'Could not load the current pay period.', [
        ...payScheduleUserErrors,
      ])
    }
  },
})
export const getOpenPayPeriodAdminDetailsForOrganization = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.union(payPeriodAdminDetailsValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      await requireTeacherForOrg(
        ctx,
        userId,
        args.organizationId,
        'organizations:read'
      )

      return await getOpenPayPeriodAdminDetails(ctx, {
        organizationId: args.organizationId,
      })
    } catch (error) {
      toUserError(error, 'Could not load pay period details.')
    }
  },
})
export const getPayrollAdminPageForOrganization = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.union(payrollAdminPageValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      await requireTeacherForOrg(
        ctx,
        userId,
        args.organizationId,
        'organizations:read'
      )

      return await getPayrollAdminPage(ctx, {
        organizationId: args.organizationId,
      })
    } catch (error) {
      toUserError(error, 'Could not load payroll.')
    }
  },
})
export const getPayPeriodAdminDetailsForOrganization = query({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
  },
  returns: payPeriodAdminDetailsValidator,
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      await requireTeacherForOrg(
        ctx,
        userId,
        args.organizationId,
        'organizations:read'
      )

      return await getPayPeriodAdminDetails(ctx, {
        organizationId: args.organizationId,
        payPeriodId: args.payPeriodId,
      })
    } catch (error) {
      toUserError(error, 'Could not load pay period details.')
    }
  },
})
export const getPayRunAdminReportForOrganization = query({
  args: {
    organizationId: v.string(),
    payRunId: v.id('payRuns'),
  },
  returns: payRunAdminReportValidator,
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      await requireTeacherForOrg(
        ctx,
        userId,
        args.organizationId,
        'organizations:read'
      )

      return await getPayRunAdminReport(ctx, {
        organizationId: args.organizationId,
        payRunId: args.payRunId,
      })
    } catch (error) {
      toUserError(error, 'Could not load pay run report.')
    }
  },
})
export const validateAttendanceForPayPeriod = query({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
  },
  returns: attendanceValidationValidator,
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
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
    } catch (error) {
      toUserError(error, 'Could not validate attendance for this pay period.')
    }
  },
})
export const runPayPeriod = mutation({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
  },
  returns: payRunResultValidator,
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
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
        nowMs: Date.now(),
      })
    } catch (error) {
      toUserError(error, 'Could not run payroll.')
    }
  },
})
export const postponePayPeriod = mutation({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
    postponedUntil: v.string(),
  },
  returns: v.object({
    payRunId: v.id('payRuns'),
    payPeriodId: v.id('payPeriods'),
    postponedUntil: v.string(),
    effectivePayDate: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
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
        nowMs: Date.now(),
      })
    } catch (error) {
      toUserError(error, 'Could not postpone payday.')
    }
  },
})
export const listMyPaystubs = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(paystubListItemValidator),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      const roster = await getActiveRosterStudentForUser(ctx, userId)
      if (roster === null) {
        return { page: [], isDone: true, continueCursor: '' }
      }

      return await listPaystubsForStudent(ctx, {
        rosterStudentId: roster._id,
        paginationOpts: args.paginationOpts,
      })
    } catch (error) {
      toUserError(error, 'Could not load paystubs.')
    }
  },
})
export const countMyUnviewedPaystubs = query({
  args: {},
  returns: v.number(),
  handler: async ctx => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      const roster = await getActiveRosterStudentForUser(ctx, userId)
      if (roster === null) {
        return 0
      }

      return await countUnviewedPaystubsForStudent(ctx, roster._id)
    } catch (error) {
      toUserError(error, 'Could not load unread paystub count.')
    }
  },
})
export const getMyPaystub = query({
  args: { paystubId: v.string() },
  returns: v.union(paystubDetailValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      const roster = await getActiveRosterStudentForUser(ctx, userId)
      if (roster === null) {
        return null
      }

      const paystubId = ctx.db.normalizeId('paystubs', args.paystubId)
      if (paystubId === null) {
        return null
      }

      return await getPaystubForStudent(ctx, {
        rosterStudentId: roster._id,
        paystubId,
      })
    } catch (error) {
      toUserError(error, 'Could not load paystub.')
    }
  },
})
export const markMyPaystubViewed = mutation({
  args: {
    paystubId: v.string(),
  },
  returns: v.union(paystubDetailValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (userId === null) {
        userError('Sign in to continue.')
      }

      const roster = await getActiveRosterStudentForUser(ctx, userId)
      if (roster === null) {
        return null
      }

      const paystubId = ctx.db.normalizeId('paystubs', args.paystubId)
      if (paystubId === null) {
        return null
      }

      return await markPaystubViewedForStudent(ctx, {
        rosterStudentId: roster._id,
        paystubId,
        nowMs: Date.now(),
      })
    } catch (error) {
      toUserError(error, 'Could not mark paystub viewed.')
    }
  },
})
