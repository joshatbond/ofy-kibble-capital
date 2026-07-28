import { resolveEffectiveSettings } from '../settings/effectiveSettings'

import { civilDateInProductTimezone, isPaydayAutomationClock } from './dates'
import { isPayDate } from './periods'
import { ensureCurrentPayPeriodForOrg } from './periodStore'
import { getEffectivePayDate } from './postpone'
import { executePayRunForPeriod } from './runPayPeriod'

import type { Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

export async function processPaydayAutomation(
  ctx: MutationCtx,
  args: { nowMs: number }
): Promise<PaydayAutomationSummary> {
  if (!isPaydayAutomationClock(args.nowMs)) {
    return {
      examinedClassrooms: 0,
      attempted: 0,
      succeeded: 0,
      blocked: 0,
      skipped: 0,
      outsidePayRunTime: true,
    }
  }

  const today = civilDateInProductTimezone(args.nowMs)
  const classrooms = await ctx.db.query('classrooms').collect()
  const processedPeriods = new Set<Id<'payPeriods'>>()

  let attempted = 0
  let succeeded = 0
  let blocked = 0
  let skipped = 0

  for (const classroom of classrooms) {
    const openPeriods = await ctx.db
      .query('payPeriods')
      .withIndex('by_organizationId_status', q =>
        q.eq('organizationId', classroom.organizationId).eq('status', 'open')
      )
      .collect()

    for (const period of openPeriods) {
      const effective = await getEffectivePayDate(
        ctx,
        period._id,
        period.payDate
      )
      if (effective !== today) {
        continue
      }
      if (processedPeriods.has(period._id)) {
        continue
      }
      processedPeriods.add(period._id)

      const result = await executePayRunForPeriod(ctx, {
        organizationId: classroom.organizationId,
        payPeriodId: period._id,
        triggeredBy: 'automation',
        nowMs: args.nowMs,
      })
      attempted += 1
      if (result.status === 'succeeded') {
        if (result.alreadyCompleted) {
          skipped += 1
        } else {
          succeeded += 1
        }
      } else {
        blocked += 1
      }
    }

    const settings = await resolveEffectiveSettings(
      ctx,
      classroom.organizationId
    )
    if (!isPayDate(settings.paySchedule, today)) {
      continue
    }

    const period = await ensureCurrentPayPeriodForOrg(ctx, {
      organizationId: classroom.organizationId,
      nowMs: args.nowMs,
    })
    if (period.status !== 'open' || processedPeriods.has(period._id)) {
      continue
    }

    const effective = await getEffectivePayDate(ctx, period._id, period.payDate)
    if (effective !== today) {
      skipped += 1
      continue
    }

    processedPeriods.add(period._id)
    const result = await executePayRunForPeriod(ctx, {
      organizationId: classroom.organizationId,
      payPeriodId: period._id,
      triggeredBy: 'automation',
      nowMs: args.nowMs,
    })
    attempted += 1
    if (result.status === 'succeeded') {
      if (result.alreadyCompleted) {
        skipped += 1
      } else {
        succeeded += 1
      }
    } else {
      blocked += 1
    }
  }

  return {
    examinedClassrooms: classrooms.length,
    attempted,
    succeeded,
    blocked,
    skipped,
    outsidePayRunTime: false,
  }
}
export type PaydayAutomationSummary = {
  examinedClassrooms: number
  attempted: number
  succeeded: number
  blocked: number
  skipped: number
  outsidePayRunTime: boolean
}
