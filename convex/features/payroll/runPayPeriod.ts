import { userError } from '../appError'
import {
  applyPaycheckPipeline,
  preparePaycheckAllocation,
} from '../banking/paycheckPipeline'
import { resolveEffectiveSettings } from '../settings/effectiveSettings'

import { validateStubAttendanceForPayPeriod } from './attendanceValidation'
import {
  EMPTY_PAYROLL_YTD,
  computePayrollForStudent,
  schoolYearForIsoDate,
} from './payrollMath'
import { incrementUnviewedPaystubCount } from './studentPaystubs'

import type { PayrollYtdSnapshot } from './payrollMath'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

export async function executePayRunForPeriod(
  ctx: MutationCtx,
  args: {
    organizationId: string
    payPeriodId: Id<'payPeriods'>
    triggeredBy: 'manual' | 'automation'
    nowMs: number
  }
): Promise<PayRunExecutionResult> {
  const payPeriod = await ctx.db.get('payPeriods', args.payPeriodId)
  if (payPeriod === null) {
    userError('Pay period not found.')
  }
  if (payPeriod.organizationId !== args.organizationId) {
    userError('Pay period does not belong to this organization.')
  }

  const existingSuccess = await findSucceededPayRun(ctx, args.payPeriodId)
  if (existingSuccess !== null) {
    return {
      status: 'succeeded',
      payRunId: existingSuccess._id,
      payPeriodId: args.payPeriodId,
      stubCount: existingSuccess.stubCount,
      alreadyCompleted: true,
    }
  }

  if (payPeriod.status === 'closed') {
    userError('Pay period is closed without a successful pay run.')
  }

  const validation = await validateStubAttendanceForPayPeriod(ctx, {
    organizationId: args.organizationId,
    payPeriodId: args.payPeriodId,
  })

  if (validation.status === 'blocked') {
    const payRunId = await ctx.db.insert('payRuns', {
      organizationId: args.organizationId,
      payPeriodId: args.payPeriodId,
      status: 'blocked',
      triggeredBy: args.triggeredBy,
      blockReasons: validation.blockReasons,
      startedAt: args.nowMs,
      completedAt: args.nowMs,
      totalFundsCents: 0,
      stubCount: 0,
    })

    return {
      status: 'blocked',
      payRunId,
      payPeriodId: args.payPeriodId,
      blockReasons: validation.blockReasons,
    }
  }

  const settings = await resolveEffectiveSettings(ctx, args.organizationId)
  const schoolYear = schoolYearForIsoDate(payPeriod.payDate)
  const payRunId = await ctx.db.insert('payRuns', {
    organizationId: args.organizationId,
    payPeriodId: args.payPeriodId,
    status: 'pending',
    triggeredBy: args.triggeredBy,
    startedAt: args.nowMs,
    totalFundsCents: 0,
    stubCount: 0,
  })

  let stubCount = 0
  let totalFundsCents = 0

  for (const attendance of validation.records) {
    const roster = await ctx.db.get(
      'rosterStudents',
      attendance.rosterStudentId
    )
    if (roster === null || roster.status !== 'active') {
      throw new Error(
        `Active roster student required for ${attendance.rosterStudentId}.`
      )
    }

    const priorYtd = await loadYtdSnapshot(ctx, {
      rosterStudentId: roster._id,
      schoolYear,
    })

    const math = computePayrollForStudent({
      daysAttended: attendance.daysAttended,
      overtimeHours: attendance.overtimeHours,
      settings: {
        hourlyRateCents: settings.hourlyRateCents,
        standardDayHours: settings.standardDayHours,
        overtimeMultiplier: settings.overtimeMultiplier,
        retirement401kPercentGross: settings.retirement401kPercentGross,
        medicalInsuranceCentsPerPayRun: settings.medicalInsuranceCentsPerPayRun,
      },
      ytd: priorYtd,
    })

    const prepared = await preparePaycheckAllocation(ctx, {
      roster,
      netPayCents: math.netPayCents,
    })

    await ctx.db.insert('paystubs', {
      organizationId: args.organizationId,
      payPeriodId: args.payPeriodId,
      payRunId,
      rosterStudentId: roster._id,
      schoolYear,
      daysAttended: math.daysAttended,
      standardDayHours: math.standardDayHours,
      overtimeHours: math.overtimeHours,
      baseHours: math.baseHours,
      basePayCents: math.basePayCents,
      overtimePayCents: math.overtimePayCents,
      grossPayCents: math.grossPayCents,
      retirement401kCents: math.retirement401kCents,
      medicalInsuranceCents: math.medicalInsuranceCents,
      taxableWagesCents: math.taxableWagesCents,
      federalIncomeTaxCents: math.federalIncomeTaxCents,
      californiaIncomeTaxCents: math.californiaIncomeTaxCents,
      socialSecurityCents: math.socialSecurityCents,
      medicareCents: math.medicareCents,
      caSdiCents: math.caSdiCents,
      netPayCents: math.netPayCents,
      disbursement: prepared.disbursement,
      ytdGrossCents: math.ytdAfter.grossCents,
      ytdTaxableWagesCents: math.ytdAfter.taxableWagesCents,
      ytdRetirement401kCents: math.ytdAfter.retirement401kCents,
      ytdMedicalInsuranceCents: math.ytdAfter.medicalInsuranceCents,
      ytdFederalIncomeTaxCents: math.ytdAfter.federalIncomeTaxCents,
      ytdCaliforniaIncomeTaxCents: math.ytdAfter.californiaIncomeTaxCents,
      ytdSocialSecurityCents: math.ytdAfter.socialSecurityCents,
      ytdMedicareCents: math.ytdAfter.medicareCents,
      ytdCaSdiCents: math.ytdAfter.caSdiCents,
      ytdNetPayCents: math.ytdAfter.netPayCents,
      isCorrection: false,
      createdAt: args.nowMs,
    })

    await incrementUnviewedPaystubCount(ctx, roster._id)

    await upsertPayrollYtd(ctx, {
      organizationId: args.organizationId,
      rosterStudentId: roster._id,
      schoolYear,
      snapshot: math.ytdAfter,
      updatedAt: args.nowMs,
    })

    if (math.netPayCents > 0) {
      await applyPaycheckPipeline(ctx, {
        roster,
        netPayCents: math.netPayCents,
        nowMs: args.nowMs,
        prepared,
      })
    }

    stubCount += 1
    totalFundsCents += math.netPayCents
  }

  await ctx.db.patch('payRuns', payRunId, {
    status: 'succeeded',
    completedAt: args.nowMs,
    totalFundsCents,
    stubCount,
  })
  await ctx.db.patch('payPeriods', args.payPeriodId, {
    status: 'closed',
    closedAt: args.nowMs,
  })

  return {
    status: 'succeeded',
    payRunId,
    payPeriodId: args.payPeriodId,
    stubCount,
    alreadyCompleted: false,
  }
}
export async function findSucceededPayRun(
  ctx: MutationCtx,
  payPeriodId: Id<'payPeriods'>
): Promise<Doc<'payRuns'> | null> {
  const runs = await ctx.db
    .query('payRuns')
    .withIndex('by_payPeriodId', q => q.eq('payPeriodId', payPeriodId))
    .collect()

  return runs.find(run => run.status === 'succeeded') ?? null
}
export type PayRunExecutionResult =
  | {
      status: 'succeeded'
      payRunId: Id<'payRuns'>
      payPeriodId: Id<'payPeriods'>
      stubCount: number
      alreadyCompleted: boolean
    }
  | {
      status: 'blocked'
      payRunId: Id<'payRuns'>
      payPeriodId: Id<'payPeriods'>
      blockReasons: Array<string>
    }
async function loadYtdSnapshot(
  ctx: MutationCtx,
  args: {
    rosterStudentId: Id<'rosterStudents'>
    schoolYear: string
  }
): Promise<PayrollYtdSnapshot> {
  const row = await ctx.db
    .query('payrollYtd')
    .withIndex('by_rosterStudent_schoolYear', q =>
      q
        .eq('rosterStudentId', args.rosterStudentId)
        .eq('schoolYear', args.schoolYear)
    )
    .unique()

  if (row === null) {
    return { ...EMPTY_PAYROLL_YTD }
  }

  return {
    grossCents: row.grossCents,
    taxableWagesCents: row.taxableWagesCents,
    socialSecurityWagesCents: row.socialSecurityWagesCents,
    retirement401kCents: row.retirement401kCents,
    medicalInsuranceCents: row.medicalInsuranceCents,
    federalIncomeTaxCents: row.federalIncomeTaxCents,
    californiaIncomeTaxCents: row.californiaIncomeTaxCents,
    socialSecurityCents: row.socialSecurityCents,
    medicareCents: row.medicareCents,
    caSdiCents: row.caSdiCents,
    netPayCents: row.netPayCents,
  }
}
async function upsertPayrollYtd(
  ctx: MutationCtx,
  args: {
    organizationId: string
    rosterStudentId: Id<'rosterStudents'>
    schoolYear: string
    snapshot: PayrollYtdSnapshot
    updatedAt: number
  }
): Promise<void> {
  const existing = await ctx.db
    .query('payrollYtd')
    .withIndex('by_rosterStudent_schoolYear', q =>
      q
        .eq('rosterStudentId', args.rosterStudentId)
        .eq('schoolYear', args.schoolYear)
    )
    .unique()

  const fields = {
    organizationId: args.organizationId,
    rosterStudentId: args.rosterStudentId,
    schoolYear: args.schoolYear,
    grossCents: args.snapshot.grossCents,
    taxableWagesCents: args.snapshot.taxableWagesCents,
    socialSecurityWagesCents: args.snapshot.socialSecurityWagesCents,
    retirement401kCents: args.snapshot.retirement401kCents,
    medicalInsuranceCents: args.snapshot.medicalInsuranceCents,
    federalIncomeTaxCents: args.snapshot.federalIncomeTaxCents,
    californiaIncomeTaxCents: args.snapshot.californiaIncomeTaxCents,
    socialSecurityCents: args.snapshot.socialSecurityCents,
    medicareCents: args.snapshot.medicareCents,
    caSdiCents: args.snapshot.caSdiCents,
    netPayCents: args.snapshot.netPayCents,
    updatedAt: args.updatedAt,
  }

  if (existing === null) {
    await ctx.db.insert('payrollYtd', fields)
    return
  }

  await ctx.db.patch('payrollYtd', existing._id, fields)
}
