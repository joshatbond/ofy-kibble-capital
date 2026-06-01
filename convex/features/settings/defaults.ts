import type { SettingsValues } from './values'

/** v1 product defaults — see CONTEXT.md (Savings APY, overtime, vault cap, etc.). */
export const V1_BASE_SETTINGS: SettingsValues = {
  hourlyRateCents: 1500,
  standardDayHours: 4,
  paySchedule: {
    type: 'biweekly',
    weekday: 2,
    firstPayDate: '2026-07-14',
  },
  savingsApyPercent: 3.3,
  retirement401kPercentGross: 5,
  medicalInsuranceCentsPerPayRun: 2500,
  overtimeMultiplier: 1.5,
  /** 4 calendar days before Tuesday pay → Friday (school week ends Tuesday). */
  paydayNoticeLeadDays: 4,
  currencyLabel: 'Bark Bucks',
  vaultCap: 5,
}

/** Region-level defaults (OFY SB charter network). */
export const V1_REGION_SETTINGS: SettingsValues = {
  ...V1_BASE_SETTINGS,
}

/** School site overrides on top of region — unset fields inherit at merge time. */
export const V1_SCHOOL_SITE_SETTINGS: Record<
  string,
  Partial<SettingsValues>
> = {
  'ofysb-mv': {},
  'ofysb-sb1': {},
  'ofysb-sb2': {},
  'ofysb-sb3': {},
}
