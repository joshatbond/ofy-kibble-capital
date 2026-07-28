import {
  civilDateInProductTimezone,
  compareIsoDates,
  parseIsoDate,
} from './dates'
import { findSucceededPayRun } from './runPayPeriod'

import type { Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

/**
 * Effective automation payday: latest **Postpone** date, else period.payDate.
 * Work-window bounds are unchanged by postpone.
 */
export async function getEffectivePayDate(
  ctx: QueryCtx | MutationCtx,
  payPeriodId: Id<'payPeriods'>,
  schedulePayDate: string
): Promise<string> {
  const runs = await ctx.db
    .query('payRuns')
    .withIndex('by_payPeriodId', q => q.eq('payPeriodId', payPeriodId))
    .collect()

  const postponements = runs
    .filter(
      run => run.status === 'postponed' && run.postponedUntil !== undefined
    )
    .sort((a, b) => b.startedAt - a.startedAt)

  for (const run of postponements) {
    if (run.postponedUntil !== undefined) {
      return run.postponedUntil
    }
  }

  return schedulePayDate
}

export async function postponePayPeriodRun(
  ctx: MutationCtx,
  args: {
    organizationId: string
    payPeriodId: Id<'payPeriods'>
    postponedUntil: string
    nowMs: number
  }
): Promise<{
  payRunId: Id<'payRuns'>
  payPeriodId: Id<'payPeriods'>
  postponedUntil: string
  effectivePayDate: string
}> {
  parseIsoDate(args.postponedUntil)

  const payPeriod = await ctx.db.get('payPeriods', args.payPeriodId)
  if (payPeriod === null) {
    throw new Error('Pay period not found.')
  }
  if (payPeriod.organizationId !== args.organizationId) {
    throw new Error('Pay period does not belong to this organization.')
  }
  if (payPeriod.status !== 'open') {
    throw new Error('Only an open pay period can be postponed.')
  }

  const succeeded = await findSucceededPayRun(ctx, args.payPeriodId)
  if (succeeded !== null) {
    throw new Error(
      'Cannot postpone a pay period that already paid successfully.'
    )
  }

  const today = civilDateInProductTimezone(args.nowMs)
  const currentEffective = await getEffectivePayDate(
    ctx,
    args.payPeriodId,
    payPeriod.payDate
  )

  if (compareIsoDates(args.postponedUntil, today) <= 0) {
    throw new Error('Postpone date must be after today in product timezone.')
  }
  if (compareIsoDates(args.postponedUntil, currentEffective) <= 0) {
    throw new Error('Postpone date must be after the current effective payday.')
  }

  const payRunId = await ctx.db.insert('payRuns', {
    organizationId: args.organizationId,
    payPeriodId: args.payPeriodId,
    status: 'postponed',
    triggeredBy: 'manual',
    postponedUntil: args.postponedUntil,
    startedAt: args.nowMs,
    completedAt: args.nowMs,
  })

  return {
    payRunId,
    payPeriodId: args.payPeriodId,
    postponedUntil: args.postponedUntil,
    effectivePayDate: args.postponedUntil,
  }
}
