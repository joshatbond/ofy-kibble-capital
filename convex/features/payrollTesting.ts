import { v } from 'convex/values'

import { internalMutation } from '../_generated/server'

import {
  ensureCurrentPayPeriodForOrg,
  payPeriodPublicValidator,
  toPayPeriodPublic,
} from './payroll/periodStore'
import { postponePayPeriodRun } from './payroll/postpone'
import { executePayRunForPeriod } from './payroll/runPayPeriod'

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

/**
 * Test-only clock override for ensure/run/postpone.
 * Public payroll mutations always use `Date.now()` — do not expose `nowMs` on `api.*`.
 */
export const ensureCurrentPayPeriod = internalMutation({
  args: {
    organizationId: v.string(),
    nowMs: v.number(),
  },
  returns: payPeriodPublicValidator,
  handler: async (ctx, args) => {
    const period = await ensureCurrentPayPeriodForOrg(ctx, {
      organizationId: args.organizationId,
      nowMs: args.nowMs,
    })
    return toPayPeriodPublic(period)
  },
})

export const runPayPeriod = internalMutation({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
    nowMs: v.number(),
  },
  returns: payRunResultValidator,
  handler: async (ctx, args) => {
    return await executePayRunForPeriod(ctx, {
      organizationId: args.organizationId,
      payPeriodId: args.payPeriodId,
      triggeredBy: 'manual',
      nowMs: args.nowMs,
    })
  },
})

export const postponePayPeriod = internalMutation({
  args: {
    organizationId: v.string(),
    payPeriodId: v.id('payPeriods'),
    postponedUntil: v.string(),
    nowMs: v.number(),
  },
  returns: v.object({
    payRunId: v.id('payRuns'),
    payPeriodId: v.id('payPeriods'),
    postponedUntil: v.string(),
    effectivePayDate: v.string(),
  }),
  handler: async (ctx, args) => {
    return await postponePayPeriodRun(ctx, {
      organizationId: args.organizationId,
      payPeriodId: args.payPeriodId,
      postponedUntil: args.postponedUntil,
      nowMs: args.nowMs,
    })
  },
})
