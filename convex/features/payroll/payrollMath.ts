import { parseIsoDate } from './dates'
import { percentOfCents, roundHalfUpToCents } from './money'
import {
  CA_SDI_RATE_PERCENT,
  CA_SINGLE_BRACKETS_2025,
  FEDERAL_SINGLE_BRACKETS_2025,
  MEDICARE_RATE_PERCENT,
  SOCIAL_SECURITY_RATE_PERCENT,
  SOCIAL_SECURITY_WAGE_BASE_CENTS,
} from './taxTables'

import type { TaxBracket } from './taxTables'

export const EMPTY_PAYROLL_YTD: PayrollYtdSnapshot = {
  grossCents: 0,
  taxableWagesCents: 0,
  socialSecurityWagesCents: 0,
  retirement401kCents: 0,
  medicalInsuranceCents: 0,
  federalIncomeTaxCents: 0,
  californiaIncomeTaxCents: 0,
  socialSecurityCents: 0,
  medicareCents: 0,
  caSdiCents: 0,
  netPayCents: 0,
}
export function schoolYearForIsoDate(iso: string): string {
  const { year, month } = parseIsoDate(iso)
  if (month >= 7) {
    return `${String(year)}-${String(year + 1)}`
  }
  return `${String(year - 1)}-${String(year)}`
}
export function computePayrollForStudent(
  input: PayrollMathInput
): PayrollMathResult {
  assertNonNegativeInteger(input.daysAttended, 'daysAttended')
  if (!Number.isFinite(input.overtimeHours) || input.overtimeHours < 0) {
    throw new Error('overtimeHours must be a non-negative number.')
  }

  const { settings, ytd } = input
  const baseHours = input.daysAttended * settings.standardDayHours
  const basePayCents = roundHalfUpToCents(
    baseHours * settings.hourlyRateCents
  )
  const overtimePayCents = roundHalfUpToCents(
    input.overtimeHours *
      settings.hourlyRateCents *
      settings.overtimeMultiplier
  )
  const grossPayCents = basePayCents + overtimePayCents

  const retirement401kCents = Math.min(
    percentOfCents(grossPayCents, settings.retirement401kPercentGross),
    grossPayCents
  )
  const afterRetirement = grossPayCents - retirement401kCents
  const medicalInsuranceCents = Math.min(
    Math.max(0, settings.medicalInsuranceCentsPerPayRun),
    afterRetirement
  )
  const taxableWagesCents =
    grossPayCents - retirement401kCents - medicalInsuranceCents

  const federalIncomeTaxCents = cumulativeBracketTaxThisPeriod({
    priorYtdTaxableCents: ytd.taxableWagesCents,
    thisPeriodTaxableCents: taxableWagesCents,
    brackets: FEDERAL_SINGLE_BRACKETS_2025,
  })
  const californiaIncomeTaxCents = cumulativeBracketTaxThisPeriod({
    priorYtdTaxableCents: ytd.taxableWagesCents,
    thisPeriodTaxableCents: taxableWagesCents,
    brackets: CA_SINGLE_BRACKETS_2025,
  })

  const remainingSsWageBase = Math.max(
    0,
    SOCIAL_SECURITY_WAGE_BASE_CENTS - ytd.socialSecurityWagesCents
  )
  const socialSecurityWagesThisPeriodCents = Math.min(
    taxableWagesCents,
    remainingSsWageBase
  )
  const socialSecurityCents = percentOfCents(
    socialSecurityWagesThisPeriodCents,
    SOCIAL_SECURITY_RATE_PERCENT
  )
  const medicareCents = percentOfCents(
    taxableWagesCents,
    MEDICARE_RATE_PERCENT
  )
  const caSdiCents = percentOfCents(taxableWagesCents, CA_SDI_RATE_PERCENT)

  const totalWithholding =
    federalIncomeTaxCents +
    californiaIncomeTaxCents +
    socialSecurityCents +
    medicareCents +
    caSdiCents
  const netPayCents = Math.max(
    0,
    grossPayCents -
      retirement401kCents -
      medicalInsuranceCents -
      totalWithholding
  )

  const ytdAfter: PayrollYtdSnapshot = {
    grossCents: ytd.grossCents + grossPayCents,
    taxableWagesCents: ytd.taxableWagesCents + taxableWagesCents,
    socialSecurityWagesCents:
      ytd.socialSecurityWagesCents + socialSecurityWagesThisPeriodCents,
    retirement401kCents: ytd.retirement401kCents + retirement401kCents,
    medicalInsuranceCents: ytd.medicalInsuranceCents + medicalInsuranceCents,
    federalIncomeTaxCents: ytd.federalIncomeTaxCents + federalIncomeTaxCents,
    californiaIncomeTaxCents:
      ytd.californiaIncomeTaxCents + californiaIncomeTaxCents,
    socialSecurityCents: ytd.socialSecurityCents + socialSecurityCents,
    medicareCents: ytd.medicareCents + medicareCents,
    caSdiCents: ytd.caSdiCents + caSdiCents,
    netPayCents: ytd.netPayCents + netPayCents,
  }

  return {
    daysAttended: input.daysAttended,
    standardDayHours: settings.standardDayHours,
    overtimeHours: input.overtimeHours,
    baseHours,
    basePayCents,
    overtimePayCents,
    grossPayCents,
    retirement401kCents,
    medicalInsuranceCents,
    taxableWagesCents,
    federalIncomeTaxCents,
    californiaIncomeTaxCents,
    socialSecurityCents,
    medicareCents,
    caSdiCents,
    netPayCents,
    socialSecurityWagesThisPeriodCents,
    ytdAfter,
  }
}
export function taxOnTaxableWages(
  taxableCents: number,
  brackets: Array<TaxBracket>
): number {
  if (taxableCents <= 0) {
    return 0
  }

  let tax = 0
  let priorCap = 0

  for (const bracket of brackets) {
    const slice = Math.min(taxableCents, bracket.upToCents) - priorCap
    if (slice > 0) {
      tax += percentOfCents(slice, bracket.ratePercent)
    }
    if (taxableCents <= bracket.upToCents) {
      break
    }
    priorCap = bracket.upToCents
  }

  return tax
}
export type PayrollMathSettings = {
  hourlyRateCents: number
  standardDayHours: number
  overtimeMultiplier: number
  retirement401kPercentGross: number
  medicalInsuranceCentsPerPayRun: number
}
export type PayrollYtdSnapshot = {
  grossCents: number
  taxableWagesCents: number
  socialSecurityWagesCents: number
  retirement401kCents: number
  medicalInsuranceCents: number
  federalIncomeTaxCents: number
  californiaIncomeTaxCents: number
  socialSecurityCents: number
  medicareCents: number
  caSdiCents: number
  netPayCents: number
}
export type PayrollMathInput = {
  daysAttended: number
  overtimeHours: number
  settings: PayrollMathSettings
  /** Prior YTD before this run (zeros at school-year start). */
  ytd: PayrollYtdSnapshot
}
export type PayrollMathResult = {
  daysAttended: number
  standardDayHours: number
  overtimeHours: number
  baseHours: number
  basePayCents: number
  overtimePayCents: number
  grossPayCents: number
  retirement401kCents: number
  medicalInsuranceCents: number
  taxableWagesCents: number
  federalIncomeTaxCents: number
  californiaIncomeTaxCents: number
  socialSecurityCents: number
  medicareCents: number
  caSdiCents: number
  netPayCents: number
  /** Social Security wages credited this period (after wage-base cap). */
  socialSecurityWagesThisPeriodCents: number
  ytdAfter: PayrollYtdSnapshot
}
function cumulativeBracketTaxThisPeriod(args: {
  priorYtdTaxableCents: number
  thisPeriodTaxableCents: number
  brackets: Array<TaxBracket>
}): number {
  const after = taxOnTaxableWages(
    args.priorYtdTaxableCents + args.thisPeriodTaxableCents,
    args.brackets
  )
  const before = taxOnTaxableWages(args.priorYtdTaxableCents, args.brackets)
  return Math.max(0, after - before)
}
function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`)
  }
}
