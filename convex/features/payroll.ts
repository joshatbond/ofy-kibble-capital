import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import {
  payPeriodScheduleTypeValidator,
  payPeriodStatusValidator,
} from '../schema/schemaFields'

import { requireTeacherForOrg } from './auth/teacher'
import {
  ensureCurrentPayPeriodForOrg,
  listPayPeriodsForOrg,
  toPayPeriodPublic,
} from './payroll/periodStore'

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
