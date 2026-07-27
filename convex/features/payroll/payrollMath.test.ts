import { describe, expect, test } from 'vitest'

import { V1_BASE_SETTINGS } from '../settings/defaults'

import { percentOfCents, roundHalfUpToCents } from './money'
import {
  EMPTY_PAYROLL_YTD,
  computePayrollForStudent,
  schoolYearForIsoDate,
  taxOnTaxableWages,
} from './payrollMath'
import {
  CA_SINGLE_BRACKETS_2025,
  FEDERAL_SINGLE_BRACKETS_2025,
  SOCIAL_SECURITY_WAGE_BASE_CENTS,
} from './taxTables'

import type { PayrollMathSettings, PayrollYtdSnapshot } from './payrollMath'

const SETTINGS: PayrollMathSettings = {
  hourlyRateCents: V1_BASE_SETTINGS.hourlyRateCents,
  standardDayHours: V1_BASE_SETTINGS.standardDayHours,
  overtimeMultiplier: V1_BASE_SETTINGS.overtimeMultiplier,
  retirement401kPercentGross: V1_BASE_SETTINGS.retirement401kPercentGross,
  medicalInsuranceCentsPerPayRun:
    V1_BASE_SETTINGS.medicalInsuranceCentsPerPayRun,
}

describe('roundHalfUpToCents', () => {
  test('rounds .5 up for positive values', () => {
    expect(roundHalfUpToCents(1.5)).toBe(2)
    expect(roundHalfUpToCents(2.4)).toBe(2)
    expect(percentOfCents(100, 33)).toBe(33)
  })
})

describe('schoolYearForIsoDate', () => {
  test('resets on July 1', () => {
    expect(schoolYearForIsoDate('2026-07-01')).toBe('2026-2027')
    expect(schoolYearForIsoDate('2026-06-30')).toBe('2025-2026')
    expect(schoolYearForIsoDate('2027-01-15')).toBe('2026-2027')
  })
})

describe('taxOnTaxableWages fixtures (TY2025 Single)', () => {
  test('federal 10% slice then 12%', () => {
    // $11,925 → all 10%
    expect(taxOnTaxableWages(1_192_500, FEDERAL_SINGLE_BRACKETS_2025)).toBe(
      119_250
    )
    // $11,925 + $100 = $12,025 → 10% of 11925 + 12% of 100
    expect(taxOnTaxableWages(1_202_500, FEDERAL_SINGLE_BRACKETS_2025)).toBe(
      119_250 + 1_200
    )
  })

  test('california lowest bracket is 1%', () => {
    expect(taxOnTaxableWages(50_000, CA_SINGLE_BRACKETS_2025)).toBe(500)
  })
})

describe('computePayrollForStudent', () => {
  test('computes gross, pre-tax, withholding, and net from empty YTD', () => {
    // 10 days × 4h × $15 = $600; no OT
    const result = computePayrollForStudent({
      daysAttended: 10,
      overtimeHours: 0,
      settings: SETTINGS,
      ytd: EMPTY_PAYROLL_YTD,
    })

    expect(result).toMatchObject({
      baseHours: 40,
      basePayCents: 60_000,
      overtimePayCents: 0,
      grossPayCents: 60_000,
      retirement401kCents: 3_000, // 5%
      medicalInsuranceCents: 2_500,
      taxableWagesCents: 54_500,
    })

    // Taxable $545 — entirely in federal 10% / CA 1%
    expect(result.federalIncomeTaxCents).toBe(5_450)
    expect(result.californiaIncomeTaxCents).toBe(545)
    expect(result.socialSecurityCents).toBe(3_379) // 6.2%
    expect(result.medicareCents).toBe(790) // 1.45%
    expect(result.caSdiCents).toBe(654) // 1.2%
    expect(result.netPayCents).toBe(43_682)
    expect(result.ytdAfter.grossCents).toBe(60_000)
    expect(result.ytdAfter.taxableWagesCents).toBe(54_500)
    expect(result.ytdAfter.socialSecurityWagesCents).toBe(54_500)
  })

  test('applies overtime at the overtime multiplier', () => {
    const result = computePayrollForStudent({
      daysAttended: 5,
      overtimeHours: 3,
      settings: SETTINGS,
      ytd: EMPTY_PAYROLL_YTD,
    })

    expect(result.basePayCents).toBe(30_000) // 5×4×1500
    expect(result.overtimePayCents).toBe(6_750) // 3×1500×1.5
    expect(result.grossPayCents).toBe(36_750)
  })

  test('cumulative federal steps into the 12% bracket', () => {
    const ytd: PayrollYtdSnapshot = {
      ...EMPTY_PAYROLL_YTD,
      taxableWagesCents: 1_192_500,
      federalIncomeTaxCents: 119_250,
    }

    const result = computePayrollForStudent({
      daysAttended: 1,
      overtimeHours: 0,
      settings: {
        hourlyRateCents: 10_000,
        standardDayHours: 1,
        overtimeMultiplier: 1.5,
        retirement401kPercentGross: 0,
        medicalInsuranceCentsPerPayRun: 0,
      },
      ytd,
    })

    // Gross/taxable = $100 → entirely in 12% marginal
    expect(result.taxableWagesCents).toBe(10_000)
    expect(result.federalIncomeTaxCents).toBe(1_200)
    expect(result.ytdAfter.federalIncomeTaxCents).toBe(120_450)
  })

  test('Social Security stops after the annual wage base within the school year', () => {
    const ytd: PayrollYtdSnapshot = {
      ...EMPTY_PAYROLL_YTD,
      socialSecurityWagesCents: SOCIAL_SECURITY_WAGE_BASE_CENTS - 500,
      taxableWagesCents: SOCIAL_SECURITY_WAGE_BASE_CENTS - 500,
    }

    const result = computePayrollForStudent({
      daysAttended: 1,
      overtimeHours: 0,
      settings: {
        hourlyRateCents: 5_000,
        standardDayHours: 1,
        overtimeMultiplier: 1.5,
        retirement401kPercentGross: 0,
        medicalInsuranceCentsPerPayRun: 0,
      },
      ytd,
    })

    // Taxable $50 this period; only $5 of SS wages remain under the cap.
    expect(result.taxableWagesCents).toBe(5_000)
    expect(result.socialSecurityWagesThisPeriodCents).toBe(500)
    expect(result.socialSecurityCents).toBe(31) // 6.2% of 500
    expect(result.ytdAfter.socialSecurityWagesCents).toBe(
      SOCIAL_SECURITY_WAGE_BASE_CENTS
    )

    const pastCap = computePayrollForStudent({
      daysAttended: 1,
      overtimeHours: 0,
      settings: {
        hourlyRateCents: 5_000,
        standardDayHours: 1,
        overtimeMultiplier: 1.5,
        retirement401kPercentGross: 0,
        medicalInsuranceCentsPerPayRun: 0,
      },
      ytd: result.ytdAfter,
    })

    expect(pastCap.socialSecurityWagesThisPeriodCents).toBe(0)
    expect(pastCap.socialSecurityCents).toBe(0)
    expect(pastCap.medicareCents).toBeGreaterThan(0)
  })

  test('caps medical and 401k so taxable wages never go negative', () => {
    const result = computePayrollForStudent({
      daysAttended: 0,
      overtimeHours: 0,
      settings: SETTINGS,
      ytd: EMPTY_PAYROLL_YTD,
    })

    expect(result.grossPayCents).toBe(0)
    expect(result.retirement401kCents).toBe(0)
    expect(result.medicalInsuranceCents).toBe(0)
    expect(result.taxableWagesCents).toBe(0)
    expect(result.netPayCents).toBe(0)
  })
})
