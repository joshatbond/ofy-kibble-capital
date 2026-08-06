import { v } from 'convex/values'

import {
  payRunsTableFields,
  paystubsTableFields,
} from '../../schema/schemaFields'
import { userError } from '../appError'

import { validateStubAttendanceForPayPeriod } from './attendanceValidation'
import {
  findOpenPayPeriodForOrg,
  payPeriodPublicValidator,
  toPayPeriodPublic,
} from './periodStore'
import { getEffectivePayDate } from './postpone'

import type { Doc, Id } from '../../_generated/dataModel'
import type { QueryCtx } from '../../_generated/server'
import type { Infer } from 'convex/values'

/** Bound on runs listed for the current (open) period only. */
const CURRENT_PERIOD_RUNS_LIMIT = 50

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

/** Deliberate history window for the payroll admin page reactive query. */
export const PREVIOUS_PAY_RUNS_LIMIT = 25
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
  previousRunsHasMore: v.boolean(),
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
  const open = await findOpenPayPeriodForOrg(ctx, args.organizationId)
  if (open === null) {
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
  const open = await findOpenPayPeriodForOrg(ctx, args.organizationId)
  if (open === null) {
    return null
  }

  const current = await getPayPeriodAdminDetails(ctx, {
    organizationId: args.organizationId,
    payPeriodId: open._id,
  })

  const previous = await listRecentHistoricalPayRunSummaries(ctx, {
    organizationId: args.organizationId,
    excludePayPeriodId: open._id,
    limit: PREVIOUS_PAY_RUNS_LIMIT,
  })

  return {
    current,
    previousRuns: previous.runs,
    previousRunsHasMore: previous.hasMore,
  }
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
    userError('Pay period not found.')
  }
  if (period.organizationId !== args.organizationId) {
    userError('Pay period does not belong to this organization.')
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
    userError('Pay run not found.')
  }
  if (run.organizationId !== args.organizationId) {
    userError('Pay run does not belong to this organization.')
  }

  const period = await ctx.db.get('payPeriods', run.payPeriodId)
  if (period === null) {
    userError('Pay period not found.')
  }
  if (period.organizationId !== args.organizationId) {
    userError('Pay period does not belong to this organization.')
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

  const { rosterById, paySplitByRosterId } = await loadReportLookups(
    ctx,
    args.organizationId
  )

  const lines: Array<AdminPaystubLine> = []
  let fundsDispersedCents = 0
  for (const stub of stubs) {
    const line = toAdminPaystubLine(stub, {
      roster: rosterById.get(stub.rosterStudentId) ?? null,
      paySplit: paySplitByRosterId.get(stub.rosterStudentId) ?? null,
    })
    fundsDispersedCents += line.netPayCents
    lines.push(line)
  }
  lines.sort((a, b) => a.displayName.localeCompare(b.displayName))

  return {
    run: toPayRunAdminSummary(run),
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

async function listRecentHistoricalPayRunSummaries(
  ctx: QueryCtx,
  args: {
    organizationId: string
    excludePayPeriodId: Id<'payPeriods'>
    limit: number
  }
): Promise<{ runs: Array<PayRunAdminSummary>; hasMore: boolean }> {
  const fetchLimit = args.limit + 1
  const [succeeded, blocked] = await Promise.all([
    ctx.db
      .query('payRuns')
      .withIndex('by_organizationId_status', q =>
        q.eq('organizationId', args.organizationId).eq('status', 'succeeded')
      )
      .order('desc')
      .take(fetchLimit),
    ctx.db
      .query('payRuns')
      .withIndex('by_organizationId_status', q =>
        q.eq('organizationId', args.organizationId).eq('status', 'blocked')
      )
      .order('desc')
      .take(fetchLimit),
  ])

  const merged = [...succeeded, ...blocked]
    .filter(run => run.payPeriodId !== args.excludePayPeriodId)
    .sort((a, b) => b.startedAt - a.startedAt)

  const hasMore = merged.length > args.limit
  const runs = merged.slice(0, args.limit).map(toPayRunAdminSummary)
  return { runs, hasMore }
}

async function listPayRunSummariesForPeriod(
  ctx: QueryCtx,
  payPeriodId: Id<'payPeriods'>
): Promise<Array<PayRunAdminSummary>> {
  const runs = await ctx.db
    .query('payRuns')
    .withIndex('by_payPeriodId', q => q.eq('payPeriodId', payPeriodId))
    .order('desc')
    .take(CURRENT_PERIOD_RUNS_LIMIT)

  runs.sort((a, b) => b.startedAt - a.startedAt)
  return runs.map(toPayRunAdminSummary)
}

function toPayRunAdminSummary(run: Doc<'payRuns'>): PayRunAdminSummary {
  return {
    _id: run._id,
    status: run.status,
    triggeredBy: run.triggeredBy,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    blockReasons: run.blockReasons,
    postponedUntil: run.postponedUntil,
    totalFundsCents: run.totalFundsCents,
  }
}

async function loadReportLookups(
  ctx: QueryCtx,
  organizationId: string
): Promise<{
  rosterById: Map<Id<'rosterStudents'>, Doc<'rosterStudents'>>
  paySplitByRosterId: Map<Id<'rosterStudents'>, Doc<'paySplits'>>
}> {
  const [rosters, paySplits] = await Promise.all([
    ctx.db
      .query('rosterStudents')
      .withIndex('by_organizationId', q => q.eq('organizationId', organizationId))
      .collect(),
    ctx.db
      .query('paySplits')
      .withIndex('by_organizationId', q => q.eq('organizationId', organizationId))
      .collect(),
  ])

  const rosterById = new Map<Id<'rosterStudents'>, Doc<'rosterStudents'>>()
  for (const roster of rosters) {
    rosterById.set(roster._id, roster)
  }

  const paySplitByRosterId = new Map<Id<'rosterStudents'>, Doc<'paySplits'>>()
  for (const split of paySplits) {
    paySplitByRosterId.set(split.rosterStudentId, split)
  }

  return { rosterById, paySplitByRosterId }
}

function toAdminPaystubLine(
  stub: Doc<'paystubs'>,
  lookups: {
    roster: Doc<'rosterStudents'> | null
    paySplit: Doc<'paySplits'> | null
  }
): AdminPaystubLine {
  const roster = lookups.roster
  const displayName =
    roster?.displayName?.trim() ||
    roster?.email ||
    `Student ${String(roster?.externalStudentId ?? stub.rosterStudentId)}`

  const checkingPercent = lookups.paySplit?.checkingPercent ?? 100
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
