import { v } from 'convex/values'

import type { Infer } from 'convex/values'

/** 0 = Sunday … 6 = Saturday (matches JS `Date.getDay()`). */
export const weekdayValidator = v.number()

export const payScheduleValidator = v.union(
  v.object({
    type: v.literal('weekly'),
    weekday: weekdayValidator,
  }),
  v.object({
    type: v.literal('biweekly'),
    weekday: weekdayValidator,
    /** ISO date `YYYY-MM-DD` anchor for bi-weekly parity. */
    firstPayDate: v.string(),
  }),
  v.object({
    type: v.literal('semi_monthly'),
    daysOfMonth: v.array(v.number()),
  }),
  v.object({
    type: v.literal('monthly'),
    dayOfMonth: v.number(),
  })
)

/** Full settings document (region / school site defaults). */
export const settingsValuesValidator = v.object({
  hourlyRateCents: v.number(),
  standardDayHours: v.number(),
  paySchedule: payScheduleValidator,
  /** Annual percent yield, e.g. 3.3 for 3.3%. */
  savingsApyPercent: v.number(),
  /** Percent of gross pay, e.g. 5 for 5%. */
  retirement401kPercentGross: v.number(),
  /** Fixed pre-tax medical premium per pay run, in cents. */
  medicalInsuranceCentsPerPayRun: v.number(),
  overtimeMultiplier: v.number(),
  /** Calendar days before payday automation in product timezone (1–7). */
  paydayNoticeLeadDays: v.number(),
  currencyLabel: v.string(),
  vaultCap: v.number(),
})

export const settingsTableFields = {
  hourlyRateCents: v.number(),
  standardDayHours: v.number(),
  paySchedule: payScheduleValidator,
  savingsApyPercent: v.number(),
  retirement401kPercentGross: v.number(),
  medicalInsuranceCentsPerPayRun: v.number(),
  overtimeMultiplier: v.number(),
  paydayNoticeLeadDays: v.number(),
  currencyLabel: v.string(),
  vaultCap: v.number(),
} as const

export type SettingsValues = Infer<typeof settingsValuesValidator>

export const PAYDAY_NOTICE_LEAD_DAYS_MIN = 1
export const PAYDAY_NOTICE_LEAD_DAYS_MAX = 7

export function assertPaydayNoticeLeadDays(days: number): void {
  if (
    days < PAYDAY_NOTICE_LEAD_DAYS_MIN ||
    days > PAYDAY_NOTICE_LEAD_DAYS_MAX
  ) {
    throw new Error(
      `Payday notice lead must be between ${PAYDAY_NOTICE_LEAD_DAYS_MIN} and ${PAYDAY_NOTICE_LEAD_DAYS_MAX} calendar days before pay day.`
    )
  }
}
