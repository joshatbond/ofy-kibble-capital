import { v } from 'convex/values'

import {
  payScheduleValidator,
  settingsTableFields,
  weekdayValidator,
} from '../../schema/schemaFields'

import type { Infer } from 'convex/values'

export { payScheduleValidator, settingsTableFields, weekdayValidator }
export const settingsValuesValidator = v.object(settingsTableFields)
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

/** Product constraints for classroom settings writes. */
export function assertClassSettings(values: SettingsValues): void {
  if (values.hourlyRateCents < 1) {
    throw new Error('Hourly rate must be at least 0.01.')
  }

  if (values.standardDayHours <= 0) {
    throw new Error('Standard day hours must be greater than zero.')
  }

  if (values.savingsApyPercent < 0) {
    throw new Error('Savings APY cannot be negative.')
  }

  if (
    values.retirement401kPercentGross < 0 ||
    values.retirement401kPercentGross > 100
  ) {
    throw new Error('401(k) percent must be between 0 and 100.')
  }

  if (values.medicalInsuranceCentsPerPayRun < 0) {
    throw new Error('Medical insurance cannot be negative.')
  }

  if (values.overtimeMultiplier < 1) {
    throw new Error('Overtime multiplier must be at least 1.')
  }

  assertPaydayNoticeLeadDays(values.paydayNoticeLeadDays)

  if (values.currencyLabel.trim().length === 0) {
    throw new Error('Currency label is required.')
  }

  if (values.vaultCap < 1) {
    throw new Error('Vault cap must be at least 1.')
  }
}
export function pickSettingsValues(
  source: SettingsValues & Record<string, unknown>
): SettingsValues {
  return {
    hourlyRateCents: source.hourlyRateCents,
    standardDayHours: source.standardDayHours,
    paySchedule: source.paySchedule,
    savingsApyPercent: source.savingsApyPercent,
    retirement401kPercentGross: source.retirement401kPercentGross,
    medicalInsuranceCentsPerPayRun: source.medicalInsuranceCentsPerPayRun,
    overtimeMultiplier: source.overtimeMultiplier,
    paydayNoticeLeadDays: source.paydayNoticeLeadDays,
    currencyLabel: source.currencyLabel,
    vaultCap: source.vaultCap,
  }
}
export type SettingsValues = Infer<typeof settingsValuesValidator>
