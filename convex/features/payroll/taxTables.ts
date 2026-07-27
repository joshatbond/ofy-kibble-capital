/**
 * Educational CA/federal withholding tables (tax-year 2025 shape).
 * Update intentionally when refreshing classroom tax fixtures (ADR-0001).
 *
 * Brackets are upper bounds in **cents** of taxable wages; the last bracket
 * uses `Number.POSITIVE_INFINITY`.
 */

export const FEDERAL_SINGLE_BRACKETS_2025: Array<TaxBracket> = [
  { upToCents: 1_192_500, ratePercent: 10 },
  { upToCents: 4_847_500, ratePercent: 12 },
  { upToCents: 10_335_000, ratePercent: 22 },
  { upToCents: 19_730_000, ratePercent: 24 },
  { upToCents: 25_052_500, ratePercent: 32 },
  { upToCents: 62_635_000, ratePercent: 35 },
  { upToCents: Number.POSITIVE_INFINITY, ratePercent: 37 },
]
export const CA_SINGLE_BRACKETS_2025: Array<TaxBracket> = [
  { upToCents: 1_074_900, ratePercent: 1 },
  { upToCents: 2_545_000, ratePercent: 2 },
  { upToCents: 4_015_900, ratePercent: 4 },
  { upToCents: 5_571_500, ratePercent: 6 },
  { upToCents: 7_045_500, ratePercent: 8 },
  { upToCents: 36_065_900, ratePercent: 9.3 },
  { upToCents: 43_278_700, ratePercent: 10.3 },
  { upToCents: 72_131_400, ratePercent: 11.3 },
  { upToCents: Number.POSITIVE_INFINITY, ratePercent: 12.3 },
]
export const SOCIAL_SECURITY_RATE_PERCENT = 6.2
export const SOCIAL_SECURITY_WAGE_BASE_CENTS = 17_610_000
export const MEDICARE_RATE_PERCENT = 1.45
export const CA_SDI_RATE_PERCENT = 1.2
export type TaxBracket = {
  /** Inclusive upper bound of this bracket in cents (Infinity for top). */
  upToCents: number
  /** Marginal rate as a percent (e.g. 10 for 10%). */
  ratePercent: number
}
