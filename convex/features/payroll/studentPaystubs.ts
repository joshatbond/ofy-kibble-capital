import { v } from 'convex/values'

import {
  payPeriodsTableFields,
  paystubDisbursementValidator,
  paystubsTableFields,
} from '../../schema/schemaFields'

import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import type { PaginationOptions } from 'convex/server'
import type { Infer } from 'convex/values'

export const paystubListItemValidator = v.object({
  _id: v.id('paystubs'),
  payPeriodId: paystubsTableFields.payPeriodId,
  grossPayCents: paystubsTableFields.grossPayCents,
  netPayCents: paystubsTableFields.netPayCents,
  createdAt: paystubsTableFields.createdAt,
  isCorrection: paystubsTableFields.isCorrection,
  payDate: payPeriodsTableFields.payDate,
  periodStartDate: payPeriodsTableFields.startDate,
  periodEndDate: payPeriodsTableFields.endDate,
  isNew: v.boolean(),
})
export const paystubDetailValidator = v.object({
  _id: v.id('paystubs'),
  payPeriodId: paystubsTableFields.payPeriodId,
  payRunId: paystubsTableFields.payRunId,
  schoolYear: paystubsTableFields.schoolYear,
  daysAttended: paystubsTableFields.daysAttended,
  standardDayHours: paystubsTableFields.standardDayHours,
  overtimeHours: paystubsTableFields.overtimeHours,
  baseHours: paystubsTableFields.baseHours,
  basePayCents: paystubsTableFields.basePayCents,
  overtimePayCents: paystubsTableFields.overtimePayCents,
  grossPayCents: paystubsTableFields.grossPayCents,
  retirement401kCents: paystubsTableFields.retirement401kCents,
  medicalInsuranceCents: paystubsTableFields.medicalInsuranceCents,
  taxableWagesCents: paystubsTableFields.taxableWagesCents,
  federalIncomeTaxCents: paystubsTableFields.federalIncomeTaxCents,
  californiaIncomeTaxCents: paystubsTableFields.californiaIncomeTaxCents,
  socialSecurityCents: paystubsTableFields.socialSecurityCents,
  medicareCents: paystubsTableFields.medicareCents,
  caSdiCents: paystubsTableFields.caSdiCents,
  netPayCents: paystubsTableFields.netPayCents,
  disbursement: v.optional(paystubDisbursementValidator),
  ytdGrossCents: paystubsTableFields.ytdGrossCents,
  ytdTaxableWagesCents: paystubsTableFields.ytdTaxableWagesCents,
  ytdRetirement401kCents: paystubsTableFields.ytdRetirement401kCents,
  ytdMedicalInsuranceCents: paystubsTableFields.ytdMedicalInsuranceCents,
  ytdFederalIncomeTaxCents: paystubsTableFields.ytdFederalIncomeTaxCents,
  ytdCaliforniaIncomeTaxCents: paystubsTableFields.ytdCaliforniaIncomeTaxCents,
  ytdSocialSecurityCents: paystubsTableFields.ytdSocialSecurityCents,
  ytdMedicareCents: paystubsTableFields.ytdMedicareCents,
  ytdCaSdiCents: paystubsTableFields.ytdCaSdiCents,
  ytdNetPayCents: paystubsTableFields.ytdNetPayCents,
  isCorrection: paystubsTableFields.isCorrection,
  correctionReason: paystubsTableFields.correctionReason,
  createdAt: paystubsTableFields.createdAt,
  payDate: payPeriodsTableFields.payDate,
  periodStartDate: payPeriodsTableFields.startDate,
  periodEndDate: payPeriodsTableFields.endDate,
  isNew: v.boolean(),
})
export async function listPaystubsForStudent(
  ctx: QueryCtx | MutationCtx,
  args: {
    rosterStudentId: Id<'rosterStudents'>
    paginationOpts: PaginationOptions
  }
): Promise<{
  page: Array<PaystubListItem>
  isDone: boolean
  continueCursor: string
}> {
  const results = await ctx.db
    .query('paystubs')
    .withIndex('by_rosterStudent_createdAt', q =>
      q.eq('rosterStudentId', args.rosterStudentId)
    )
    .order('desc')
    .paginate(args.paginationOpts)

  const page: Array<PaystubListItem> = []
  for (const stub of results.page) {
    page.push(await toListItem(ctx, stub))
  }

  return {
    page,
    isDone: results.isDone,
    continueCursor: results.continueCursor,
  }
}
export async function getPaystubForStudent(
  ctx: QueryCtx | MutationCtx,
  args: {
    rosterStudentId: Id<'rosterStudents'>
    paystubId: Id<'paystubs'>
  }
): Promise<PaystubDetail | null> {
  const stub = await ctx.db.get('paystubs', args.paystubId)
  if (stub === null || stub.rosterStudentId !== args.rosterStudentId) {
    return null
  }

  return await toDetail(ctx, stub)
}
/**
 * Exact unread badge count from the denormalized roster counter.
 */
export async function countUnviewedPaystubsForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<number> {
  const roster = await ctx.db.get('rosterStudents', rosterStudentId)
  if (roster === null) {
    return 0
  }
  return roster.unviewedPaystubCount
}
export async function markPaystubViewedForStudent(
  ctx: MutationCtx,
  args: {
    rosterStudentId: Id<'rosterStudents'>
    paystubId: Id<'paystubs'>
    nowMs: number
  }
): Promise<PaystubDetail | null> {
  const stub = await ctx.db.get('paystubs', args.paystubId)
  if (stub === null || stub.rosterStudentId !== args.rosterStudentId) {
    return null
  }

  if (stub.viewedAt === undefined) {
    await ctx.db.patch('paystubs', stub._id, { viewedAt: args.nowMs })
    await decrementUnviewedPaystubCount(ctx, args.rosterStudentId)
  }

  const refreshed = await ctx.db.get('paystubs', args.paystubId)
  if (refreshed === null) {
    throw new Error(
      `Paystub ${args.paystubId} disappeared while marking viewed.`
    )
  }

  return await toDetail(ctx, refreshed)
}
/** Bump the roster unread counter after inserting an unviewed paystub. */
export async function incrementUnviewedPaystubCount(
  ctx: MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<void> {
  const roster = await ctx.db.get('rosterStudents', rosterStudentId)
  if (roster === null) {
    throw new Error(`Roster student ${rosterStudentId} not found.`)
  }
  await ctx.db.patch('rosterStudents', rosterStudentId, {
    unviewedPaystubCount: roster.unviewedPaystubCount + 1,
  })
}
export type PaystubListItem = Infer<typeof paystubListItemValidator>
export type PaystubDetail = Infer<typeof paystubDetailValidator>
async function decrementUnviewedPaystubCount(
  ctx: MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<void> {
  const roster = await ctx.db.get('rosterStudents', rosterStudentId)
  if (roster === null) {
    throw new Error(`Roster student ${rosterStudentId} not found.`)
  }
  await ctx.db.patch('rosterStudents', rosterStudentId, {
    unviewedPaystubCount: Math.max(0, roster.unviewedPaystubCount - 1),
  })
}
async function requirePayPeriodForStub(
  ctx: QueryCtx | MutationCtx,
  stub: Doc<'paystubs'>
): Promise<Doc<'payPeriods'>> {
  const period = await ctx.db.get('payPeriods', stub.payPeriodId)
  if (period === null) {
    throw new Error(
      `Paystub ${stub._id} references missing pay period ${stub.payPeriodId}.`
    )
  }
  return period
}
async function toListItem(
  ctx: QueryCtx | MutationCtx,
  stub: Doc<'paystubs'>
): Promise<PaystubListItem> {
  const period = await requirePayPeriodForStub(ctx, stub)
  return {
    _id: stub._id,
    payPeriodId: stub.payPeriodId,
    payDate: period.payDate,
    periodStartDate: period.startDate,
    periodEndDate: period.endDate,
    grossPayCents: stub.grossPayCents,
    netPayCents: stub.netPayCents,
    createdAt: stub.createdAt,
    isNew: stub.viewedAt === undefined,
    isCorrection: stub.isCorrection,
  }
}
async function toDetail(
  ctx: QueryCtx | MutationCtx,
  stub: Doc<'paystubs'>
): Promise<PaystubDetail> {
  const period = await requirePayPeriodForStub(ctx, stub)
  const {
    organizationId: _organizationId,
    rosterStudentId: _rosterStudentId,
    viewedAt,
    _creationTime: _creationTime,
    ...publicFields
  } = stub

  return {
    ...publicFields,
    payDate: period.payDate,
    periodStartDate: period.startDate,
    periodEndDate: period.endDate,
    isNew: viewedAt === undefined,
  }
}
