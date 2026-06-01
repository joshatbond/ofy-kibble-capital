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
export type SettingsValues = Infer<typeof settingsValuesValidator>
