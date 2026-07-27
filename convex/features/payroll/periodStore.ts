import { resolveEffectiveSettings } from '../settings/effectiveSettings'

import { civilDateInProductTimezone } from './dates'
import { nextPayDateOnOrAfter, periodBoundsForPayDate } from './periods'

import type { PayPeriodDraft } from './periods'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

export function toPayPeriodPublic(period: Doc<'payPeriods'>): PayPeriodPublic {
  return {
    _id: period._id,
    organizationId: period.organizationId,
    startDate: period.startDate,
    endDate: period.endDate,
    payDate: period.payDate,
    scheduleType: period.scheduleType,
    isTransition: period.isTransition,
    status: period.status,
    createdAt: period.createdAt,
    closedAt: period.closedAt,
  }
}
export async function listPayPeriodsForOrg(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
): Promise<Array<Doc<'payPeriods'>>> {
  const periods = await ctx.db
    .query('payPeriods')
    .withIndex('by_organizationId', q => q.eq('organizationId', organizationId))
    .collect()

  return periods.sort((a, b) => {
    if (a.payDate === b.payDate) {
      return b.createdAt - a.createdAt
    }
    return a.payDate < b.payDate ? 1 : -1
  })
}
export async function findPayPeriodByPayDate(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  payDate: string
): Promise<Doc<'payPeriods'> | null> {
  return await ctx.db
    .query('payPeriods')
    .withIndex('by_organizationId_payDate', q =>
      q.eq('organizationId', organizationId).eq('payDate', payDate)
    )
    .unique()
}
export async function ensureCurrentPayPeriodForOrg(
  ctx: MutationCtx,
  args: {
    organizationId: string
    nowMs: number
  }
): Promise<Doc<'payPeriods'>> {
  const settings = await resolveEffectiveSettings(ctx, args.organizationId)
  const todayIso = civilDateInProductTimezone(args.nowMs)
  const payDate = nextPayDateOnOrAfter(settings.paySchedule, todayIso)

  const existing = await findPayPeriodByPayDate(
    ctx,
    args.organizationId,
    payDate
  )
  if (existing !== null) {
    return existing
  }

  const draft = periodBoundsForPayDate(settings.paySchedule, payDate)
  return await insertPayPeriod(ctx, args.organizationId, draft, args.nowMs)
}
export async function insertPayPeriod(
  ctx: MutationCtx,
  organizationId: string,
  draft: PayPeriodDraft,
  createdAt: number
): Promise<Doc<'payPeriods'>> {
  const id = await ctx.db.insert('payPeriods', {
    organizationId,
    startDate: draft.startDate,
    endDate: draft.endDate,
    payDate: draft.payDate,
    scheduleType: draft.scheduleType,
    isTransition: draft.isTransition,
    status: 'open',
    createdAt,
  })

  const period = await ctx.db.get('payPeriods', id)
  if (period === null) {
    throw new Error('Failed to load pay period after insert.')
  }

  return period
}
export type PayPeriodPublic = {
  _id: Id<'payPeriods'>
  organizationId: string
  startDate: string
  endDate: string
  payDate: string
  scheduleType: Doc<'payPeriods'>['scheduleType']
  isTransition: boolean
  status: Doc<'payPeriods'>['status']
  createdAt: number
  closedAt?: number
}
