import { v } from 'convex/values'

import {
  payRunsTableFields,
  paystubsTableFields,
} from '../../schema/schemaFields'

import { validateStubAttendanceForPayPeriod } from './attendanceValidation'
import {
  listPayPeriodsForOrg,
  payPeriodPublicValidator,
  toPayPeriodPublic,
} from './periodStore'
import { getEffectivePayDate } from './postpone'

import type { Doc, Id } from '../../_generated/dataModel'
import type { QueryCtx } from '../../_generated/server'
import type { Infer } from 'convex/values'

const paySplitShareValidator = v.object({
  label: v.string(),
  amountCents: v.number(),
  percent: v.number(),
})
const adminPaystubLineValidator = v.object({
  rosterStudentId: v.id('rosterStudents'),
  displayName: v.string(),
  grossPayCents: paystubsTableFields.grossPayCents,
  netPayCents: paystubsTableFields.netPayCents,
  baseHours: paystubsTableFields.baseHours,
  overtimeHours: paystubsTableFields.overtimeHours,
  basePayCents: paystubsTableFields.basePayCents,
  overtimePayCents: paystubsTableFields.overtimePayCents,
  regularRateCents: v.number(),
  overtimeRateCents: v.number(),
  retirement401kCents: paystubsTableFields.retirement401kCents,
  medicalInsuranceCents: paystubsTableFields.medicalInsuranceCents,
  federalIncomeTaxCents: paystubsTableFields.federalIncomeTaxCents,
  californiaIncomeTaxCents: paystubsTableFields.californiaIncomeTaxCents,
  socialSecurityCents: paystubsTableFields.socialSecurityCents,
  medicareCents: paystubsTableFields.medicareCents,
  caSdiCents: paystubsTableFields.caSdiCents,
  paySplit: v.array(paySplitShareValidator),
})
export const payRunAdminSummaryValidator = v.object({
  _id: v.id('payRuns'),
  status: payRunsTableFields.status,
  triggeredBy: payRunsTableFields.triggeredBy,
  startedAt: payRunsTableFields.startedAt,
  completedAt: payRunsTableFields.completedAt,
  blockReasons: payRunsTableFields.blockReasons,
  postponedUntil: payRunsTableFields.postponedUntil,
  totalFundsCents: v.number(),
})
export const payPeriodAdminDetailsValidator = v.object({
  period: payPeriodPublicValidator,
  effectivePayDate: v.string(),
  attendance: v.union(
    v.object({
      status: v.literal('ready'),
      activeStudentCount: v.number(),
      payPeriodId: v.id('payPeriods'),
    }),
    v.object({
      status: v.literal('blocked'),
      activeStudentCount: v.number(),
      payPeriodId: v.id('payPeriods'),
      blockReasons: v.array(v.string()),
    })
  ),
  latestRun: v.union(v.null(), payRunAdminSummaryValidator),
  runs: v.array(payRunAdminSummaryValidator),
})
export const payrollAdminPageValidator = v.object({
  current: payPeriodAdminDetailsValidator,
  previousRuns: v.array(payRunAdminSummaryValidator),
})
export const payRunAdminReportValidator = v.object({
  run: payRunAdminSummaryValidator,
  period: payPeriodPublicValidator,
  effectivePayDate: v.string(),
  studentCount: v.number(),
  fundsDispersedCents: v.number(),
  stubs: v.array(adminPaystubLineValidator),
})
export async function getOpenPayPeriodAdminDetails(
  ctx: QueryCtx,
  args: { organizationId: string }
): Promise<PayPeriodAdminDetails | null> {
  const periods = await listPayPeriodsForOrg(ctx, args.organizationId)
  const open = periods.find(period => period.status === 'open')
  if (open === undefined) {
    return null
  }

  return await getPayPeriodAdminDetails(ctx, {
    organizationId: args.organizationId,
    payPeriodId: open._id,
  })
}
export async function getPayrollAdminPage(
  ctx: QueryCtx,
  args: { organizationId: string }
): Promise<PayrollAdminPage | null> {
  const periods = await listPayPeriodsForOrg(ctx, args.organizationId)
  const open = periods.find(period => period.status === 'open')
  if (open === undefined) {
    return null
  }

  const current = await getPayPeriodAdminDetails(ctx, {
    organizationId: args.organizationId,
    payPeriodId: open._id,
  })

  const previousPeriods = periods.filter(
    period => period._id !== open._id && period.status !== 'open'
  )
  const previousRuns: Array<PayRunAdminSummary> = []
  for (const period of previousPeriods) {
    const runs = await listPayRunSummariesForPeriod(ctx, period._id)
    for (const run of runs) {
      if (run.status === 'succeeded' || run.status === 'blocked') {
        previousRuns.push(run)
      }
    }
  }
  previousRuns.sort((a, b) => b.startedAt - a.startedAt)

  return { current, previousRuns }
}
export async function getPayPeriodAdminDetails(
  ctx: QueryCtx,
  args: {
    organizationId: string
    payPeriodId: Id<'payPeriods'>
  }
): Promise<PayPeriodAdminDetails> {
  const period = await ctx.db.get('payPeriods', args.payPeriodId)
  if (period === null) {
    throw new Error('Pay period not found.')
  }
  if (period.organizationId !== args.organizationId) {
    throw new Error('Pay period does not belong to this organization.')
  }

  const effectivePayDate = await getEffectivePayDate(
    ctx,
    period._id,
    period.payDate
  )
  const validation = await validateStubAttendanceForPayPeriod(ctx, {
    organizationId: args.organizationId,
    payPeriodId: period._id,
  })
  const runs = await listPayRunSummariesForPeriod(ctx, period._id)
  const latestRun = runs[0] ?? null

  if (validation.status === 'blocked') {
    return {
      period: toPayPeriodPublic(period),
      effectivePayDate,
      attendance: {
        status: 'blocked',
        activeStudentCount: validation.activeStudentCount,
        payPeriodId: validation.payPeriod._id,
        blockReasons: validation.blockReasons,
      },
      latestRun,
      runs,
    }
  }

  return {
    period: toPayPeriodPublic(period),
    effectivePayDate,
    attendance: {
      status: 'ready',
      activeStudentCount: validation.activeStudentCount,
      payPeriodId: validation.payPeriod._id,
    },
    latestRun,
    runs,
  }
}
export async function getPayRunAdminReport(
  ctx: QueryCtx,
  args: {
    organizationId: string
    payRunId: Id<'payRuns'>
  }
): Promise<PayRunAdminReport> {
  const run = await ctx.db.get('payRuns', args.payRunId)
  if (run === null) {
    throw new Error('Pay run not found.')
  }
  if (run.organizationId !== args.organizationId) {
    throw new Error('Pay run does not belong to this organization.')
  }

  const period = await ctx.db.get('payPeriods', run.payPeriodId)
  if (period === null) {
    throw new Error('Pay period not found.')
  }

  const effectivePayDate = await getEffectivePayDate(
    ctx,
    period._id,
    period.payDate
  )
  const stubs = await ctx.db
    .query('paystubs')
    .withIndex('by_payRunId', q => q.eq('payRunId', run._id))
    .collect()

  const lines: Array<AdminPaystubLine> = []
  let fundsDispersedCents = 0
  for (const stub of stubs) {
    const line = await toAdminPaystubLine(ctx, stub)
    fundsDispersedCents += line.netPayCents
    lines.push(line)
  }
  lines.sort((a, b) => a.displayName.localeCompare(b.displayName))

  const summary = await toPayRunAdminSummary(ctx, run)

  return {
    run: summary,
    period: toPayPeriodPublic(period),
    effectivePayDate,
    studentCount: lines.length,
    fundsDispersedCents,
    stubs: lines,
  }
}
export type PayRunAdminSummary = Infer<typeof payRunAdminSummaryValidator>
export type PayPeriodAdminDetails = Infer<typeof payPeriodAdminDetailsValidator>
export type PayrollAdminPage = Infer<typeof payrollAdminPageValidator>
export type PayRunAdminReport = Infer<typeof payRunAdminReportValidator>
async function listPayRunSummariesForPeriod(
  ctx: QueryCtx,
  payPeriodId: Id<'payPeriods'>
): Promise<Array<PayRunAdminSummary>> {
  const runs = await ctx.db
    .query('payRuns')
    .withIndex('by_payPeriodId', q => q.eq('payPeriodId', payPeriodId))
    .collect()

  runs.sort((a, b) => b.startedAt - a.startedAt)

  const summaries: Array<PayRunAdminSummary> = []
  for (const run of runs) {
    summaries.push(await toPayRunAdminSummary(ctx, run))
  }
  return summaries
}
async function toPayRunAdminSummary(
  ctx: QueryCtx,
  run: Doc<'payRuns'>
): Promise<PayRunAdminSummary> {
  const stubs = await ctx.db
    .query('paystubs')
    .withIndex('by_payRunId', q => q.eq('payRunId', run._id))
    .collect()
  const totalFundsCents = stubs.reduce((sum, stub) => sum + stub.netPayCents, 0)

  return {
    _id: run._id,
    status: run.status,
    triggeredBy: run.triggeredBy,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    blockReasons: run.blockReasons,
    postponedUntil: run.postponedUntil,
    totalFundsCents,
  }
}
async function toAdminPaystubLine(
  ctx: QueryCtx,
  stub: Doc<'paystubs'>
): Promise<AdminPaystubLine> {
  const roster = await ctx.db.get('rosterStudents', stub.rosterStudentId)
  const displayName =
    roster?.displayName?.trim() ||
    roster?.email ||
    `Student ${String(roster?.externalStudentId ?? stub.rosterStudentId)}`

  const paySplitDoc = await ctx.db
    .query('paySplits')
    .withIndex('by_rosterStudentId', q =>
      q.eq('rosterStudentId', stub.rosterStudentId)
    )
    .unique()

  const checkingPercent = paySplitDoc?.checkingPercent ?? 100
  const savingsPercent = 100 - checkingPercent
  const checkingCents = Math.round((stub.netPayCents * checkingPercent) / 100)
  const savingsCents = stub.netPayCents - checkingCents

  return {
    rosterStudentId: stub.rosterStudentId,
    displayName,
    grossPayCents: stub.grossPayCents,
    netPayCents: stub.netPayCents,
    baseHours: stub.baseHours,
    overtimeHours: stub.overtimeHours,
    basePayCents: stub.basePayCents,
    overtimePayCents: stub.overtimePayCents,
    regularRateCents:
      stub.baseHours > 0 ? Math.round(stub.basePayCents / stub.baseHours) : 0,
    overtimeRateCents:
      stub.overtimeHours > 0
        ? Math.round(stub.overtimePayCents / stub.overtimeHours)
        : 0,
    retirement401kCents: stub.retirement401kCents,
    medicalInsuranceCents: stub.medicalInsuranceCents,
    federalIncomeTaxCents: stub.federalIncomeTaxCents,
    californiaIncomeTaxCents: stub.californiaIncomeTaxCents,
    socialSecurityCents: stub.socialSecurityCents,
    medicareCents: stub.medicareCents,
    caSdiCents: stub.caSdiCents,
    paySplit: [
      {
        label: 'Checking',
        amountCents: checkingCents,
        percent: checkingPercent,
      },
      {
        label: 'Savings',
        amountCents: savingsCents,
        percent: savingsPercent,
      },
    ],
  }
}
type AdminPaystubLine = Infer<typeof adminPaystubLineValidator>
