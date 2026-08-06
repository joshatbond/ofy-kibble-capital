import { v } from 'convex/values'

const bankAccountKind = v.union(v.literal('checking'), v.literal('savings'))
const ledgerDirection = v.union(v.literal('credit'), v.literal('debit'))
const ledgerEntryType = v.union(
  v.literal('sweep_to_checking'),
  v.literal('internal_transfer'),
  v.literal('net_pay'),
  v.literal('pay_split'),
  v.literal('vault_on_deposit'),
  v.literal('vault_scheduled'),
  v.literal('vault_manual'),
  v.literal('vault_close')
)
const vaultFundingMode = v.union(
  v.literal('on_deposit'),
  v.literal('scheduled'),
  v.literal('manual')
)
const vaultStatus = v.union(
  v.literal('active'),
  v.literal('complete'),
  v.literal('closed')
)
const vaultScheduleCadence = v.union(
  v.literal('weekly'),
  v.literal('biweekly'),
  v.literal('monthly')
)
const vaultOnDepositRule = v.union(
  v.object({
    kind: v.literal('percent'),
    percent: v.number(),
  }),
  v.object({
    kind: v.literal('fixed'),
    amountCents: v.number(),
  })
)
const notificationKind = v.union(v.literal('transfer_skipped'))
const payPeriodScheduleType = v.union(
  v.literal('weekly'),
  v.literal('biweekly'),
  v.literal('semi_monthly'),
  v.literal('monthly'),
  v.literal('transition')
)
const payPeriodStatus = v.union(v.literal('open'), v.literal('closed'))
const payRunStatus = v.union(
  v.literal('pending'),
  v.literal('blocked'),
  v.literal('succeeded'),
  v.literal('postponed')
)
const payRunTrigger = v.union(v.literal('manual'), v.literal('automation'))
const rosterStatus = v.union(
  v.literal('pending'),
  v.literal('active'),
  v.literal('revoked')
)
const siteSlug = v.string()
const studentApp = v.union(v.literal('kibble'), v.literal('pawket'))
const weekdayValidator = v.number()
const payScheduleValidator = v.union(
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
export const grade = v.union(v.literal(7), v.literal(8))
export const usersTableFields = {
  /**
   * Allows `organizations.createOrganization` (operator tooling only in v1).
   * Classroom orgs for teachers are created via `internal.seed.index.seedV1Catalog`.
   */
  canCreateOrganization: v.optional(v.boolean()),
  /** Primary sign-in email; must match invitation email on accept. */
  email: v.optional(v.string()),
  /** Unix ms when email was verified (Convex Auth). */
  emailVerificationTime: v.optional(v.number()),
  /** Avatar URL from OAuth provider. */
  image: v.optional(v.string()),
  /** Anonymous session flag (Convex Auth). */
  isAnonymous: v.optional(v.boolean()),
  /** When set, user cannot sign in (soft deactivate). */
  inactiveDate: v.optional(v.number()),
  /** Display name from OAuth or profile update. */
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  /** Unix ms when phone was verified (Convex Auth). */
  phoneVerificationTime: v.optional(v.number()),
}
export const regionsTableFields = {
  /** Human-readable region name. */
  name: v.string(),
  /** Short code, e.g. `ofysb`. */
  slug: v.string(),
}
export const schoolSitesTableFields = {
  /** Parent region. */
  regionId: v.id('regions'),
  /** Display name for the site. */
  name: v.string(),
  /** Canonical site slug, e.g. `ofysb-mv`. */
  siteSlug,
}
export const classroomsTableFields = {
  /** `@djpanda/convex-tenants` organization id for this classroom. */
  organizationId: v.string(),
  /** Classroom display name (teacher-facing). */
  name: v.string(),
  /** Catalog site this classroom belongs to. */
  siteSlug,
  /** URL-safe slug unique within the site. */
  orgSlug: v.string(),
}
export const settingsTableFields = {
  /** Hourly wage in cents. */
  hourlyRateCents: v.number(),
  /** Standard hours per school day for pay calculations. */
  standardDayHours: v.number(),
  /** Pay cadence for the classroom economy. */
  paySchedule: payScheduleValidator,
  /** Annual percent yield, e.g. 3.3 for 3.3%. */
  savingsApyPercent: v.number(),
  /** Percent of gross pay, e.g. 5 for 5%. */
  retirement401kPercentGross: v.number(),
  /** Fixed pre-tax medical premium per pay run, in cents. */
  medicalInsuranceCentsPerPayRun: v.number(),
  /** Overtime pay multiplier (e.g. 1.5). */
  overtimeMultiplier: v.number(),
  /** Calendar days before payday automation in product timezone (1–7). */
  paydayNoticeLeadDays: v.number(),
  /** In-app currency label (e.g. Kibbles). */
  currencyLabel: v.string(),
  /** Maximum vault balance cap. */
  vaultCap: v.number(),
} as const
export const regionSettingsTableFields = {
  regionId: v.id('regions'),
  ...settingsTableFields,
}
export const schoolSiteSettingsTableFields = {
  schoolSiteId: v.id('schoolSites'),
  ...settingsTableFields,
}
export const classSettingsTableFields = {
  organizationId: v.string(),
  classroomId: v.id('classrooms'),
  ...settingsTableFields,
}
export const authSessionsTableFields = {
  userId: v.id('users'),
  /** Unix ms when this session expires. */
  expirationTime: v.number(),
  /** Which student app this session was opened from (set at OAuth sign-in). */
  studentApp: v.optional(studentApp),
}
export const studentOAuthIntentsTableFields = {
  verifierId: v.id('authVerifiers'),
  studentApp: studentApp,
  /** Unix ms when this intent row expires. */
  expirationTime: v.number(),
}
export const rosterStudentsTableFields = {
  classroomId: v.id('classrooms'),
  organizationId: v.string(),
  /** Set when the student accepts and links their user row. */
  userId: v.optional(v.id('users')),
  /** Teacher-provided label until the student links a Google profile name. */
  displayName: v.optional(v.string()),
  /** Invite email; must match OAuth email on accept. */
  email: v.string(),
  /** School SIS / roster id unique within the organization. */
  externalStudentId: v.number(),
  grade,
  /** Tenants component invitation id. */
  invitationId: v.string(),
  /** Student pay / transfer token (provisioned at invite send). */
  payToken: v.string(),
  status: rosterStatus,
  /** Denormalized count of this student's paystubs that have not been viewed. */
  unviewedPaystubCount: v.number(),
}
export const bankAccountsTableFields = {
  organizationId: v.string(),
  rosterStudentId: v.id('rosterStudents'),
  /** Balance in cents (starts at 0). */
  balanceCents: v.number(),
  kind: bankAccountKind,
}
export const ledgerEntriesTableFields = {
  organizationId: v.string(),
  rosterStudentId: v.id('rosterStudents'),
  bankAccountId: v.id('bankAccounts'),
  accountKind: bankAccountKind,
  direction: ledgerDirection,
  /** Always positive; direction determines credit vs debit. */
  amountCents: v.number(),
  entryType: ledgerEntryType,
  /** Short label for activity history. */
  label: v.string(),
  /** Unix ms when the entry was recorded. */
  createdAt: v.number(),
  /** Set when the line is tied to a vault movement. */
  vaultId: v.optional(v.id('vaults')),
}
export const paySplitsTableFields = {
  organizationId: v.string(),
  rosterStudentId: v.id('rosterStudents'),
  /** Percent of post-vault Net pay remainder to Savings (0–100). */
  savingsPercent: v.number(),
  /** Complement of savingsPercent (0–100). */
  checkingPercent: v.number(),
  /** Unix ms when the split was last set. */
  updatedAt: v.number(),
}
export const vaultsTableFields = {
  rosterStudentId: v.id('rosterStudents'),
  name: v.string(),
  /** Emoji or icon key chosen in Vault setup. */
  icon: v.string(),
  /** Optional Savings goal in cents; uncapped when omitted. */
  goalCents: v.optional(v.number()),
  balanceCents: v.number(),
  fundingMode: vaultFundingMode,
  /** Required when fundingMode is on_deposit. */
  onDepositRule: v.optional(vaultOnDepositRule),
  /** Required when fundingMode is scheduled — cents moved each run. */
  scheduledAmountCents: v.optional(v.number()),
  /** Required when fundingMode is scheduled. */
  scheduleCadence: v.optional(vaultScheduleCadence),
  /** Next due run (ms) for scheduled vaults. */
  nextRunAt: v.optional(v.number()),
  status: vaultStatus,
  createdAt: v.number(),
  updatedAt: v.number(),
  closedAt: v.optional(v.number()),
}
export const notificationsTableFields = {
  userId: v.id('users'),
  rosterStudentId: v.id('rosterStudents'),
  kind: notificationKind,
  title: v.string(),
  body: v.string(),
  /** Unix ms when marked read; omitted while unread. */
  readAt: v.optional(v.number()),
  createdAt: v.number(),
  /** Optional vault that triggered the notice. */
  vaultId: v.optional(v.id('vaults')),
}
export const payPeriodsTableFields = {
  organizationId: v.string(),
  /** Inclusive work-window start (`YYYY-MM-DD`) in product timezone. */
  startDate: v.string(),
  /** Inclusive work-window end (`YYYY-MM-DD`) in product timezone. */
  endDate: v.string(),
  /** Calendar payday (`YYYY-MM-DD`) when automation / manual run targets this period. */
  payDate: v.string(),
  scheduleType: payPeriodScheduleType,
  /** True for one-off gap coverage after a pay schedule change (ADR-0004). */
  isTransition: v.boolean(),
  status: payPeriodStatus,
  createdAt: v.number(),
  /** Unix ms when a successful pay run closed this period. */
  closedAt: v.optional(v.number()),
}
export const payRunsTableFields = {
  organizationId: v.string(),
  payPeriodId: v.id('payPeriods'),
  status: payRunStatus,
  triggeredBy: payRunTrigger,
  /** Human-readable block reasons when status is blocked. */
  blockReasons: v.optional(v.array(v.string())),
  /** New payday (`YYYY-MM-DD`) when status is postponed. */
  postponedUntil: v.optional(v.string()),
  /** Unix ms when this run attempt started. */
  startedAt: v.number(),
  /** Unix ms when status became succeeded or blocked (terminal for this attempt). */
  completedAt: v.optional(v.number()),
  /**
   * Denormalized sum of paystub `netPayCents` for succeeded runs; 0 otherwise.
   * Written transactionally with the run so admin lists avoid rescanning stubs.
   */
  totalFundsCents: v.number(),
  /**
   * Denormalized paystub count for succeeded runs; 0 otherwise.
   * Written transactionally with the run.
   */
  stubCount: v.number(),
}
/** Historical paycheck allocation written onto the stub at post time. */
export const paystubDisbursementValidator = v.object({
  checkingCents: v.number(),
  savingsCents: v.number(),
  /** Percent of post-vault remainder to checking (0–100). */
  checkingPercent: v.number(),
  /** Percent of post-vault remainder to savings (0–100). */
  savingsPercent: v.number(),
  vaultCuts: v.array(
    v.object({
      vaultId: v.id('vaults'),
      name: v.string(),
      amountCents: v.number(),
    })
  ),
})
export const paystubsTableFields = {
  organizationId: v.string(),
  payPeriodId: v.id('payPeriods'),
  payRunId: v.id('payRuns'),
  rosterStudentId: v.id('rosterStudents'),
  /** School year label, e.g. `2026-2027` (July 1 reset). */
  schoolYear: v.string(),
  daysAttended: v.number(),
  standardDayHours: v.number(),
  overtimeHours: v.number(),
  baseHours: v.number(),
  basePayCents: v.number(),
  overtimePayCents: v.number(),
  grossPayCents: v.number(),
  retirement401kCents: v.number(),
  medicalInsuranceCents: v.number(),
  taxableWagesCents: v.number(),
  federalIncomeTaxCents: v.number(),
  californiaIncomeTaxCents: v.number(),
  socialSecurityCents: v.number(),
  medicareCents: v.number(),
  caSdiCents: v.number(),
  netPayCents: v.number(),
  /**
   * Snapshot of checking / savings / on-deposit vault allocation at post time.
   * Admin reports must read this instead of recomputing from live paySplits.
   * Optional for stubs posted before this field existed.
   */
  disbursement: v.optional(paystubDisbursementValidator),
  /** Cumulative totals after this stub posts (school-year YTD). */
  ytdGrossCents: v.number(),
  ytdTaxableWagesCents: v.number(),
  ytdRetirement401kCents: v.number(),
  ytdMedicalInsuranceCents: v.number(),
  ytdFederalIncomeTaxCents: v.number(),
  ytdCaliforniaIncomeTaxCents: v.number(),
  ytdSocialSecurityCents: v.number(),
  ytdMedicareCents: v.number(),
  ytdCaSdiCents: v.number(),
  ytdNetPayCents: v.number(),
  /** True when this stub is a later-run payroll correction. */
  isCorrection: v.boolean(),
  /** Required when isCorrection — teacher-supplied reason. */
  correctionReason: v.optional(v.string()),
  createdAt: v.number(),
  /** Unix ms when the student opened this stub; omitted while “new”. */
  viewedAt: v.optional(v.number()),
}
export const payrollYtdTableFields = {
  organizationId: v.string(),
  rosterStudentId: v.id('rosterStudents'),
  /** School year label, e.g. `2026-2027` (July 1 reset). */
  schoolYear: v.string(),
  grossCents: v.number(),
  taxableWagesCents: v.number(),
  /** Wages subject to Social Security before applying the annual wage base cap. */
  socialSecurityWagesCents: v.number(),
  retirement401kCents: v.number(),
  medicalInsuranceCents: v.number(),
  federalIncomeTaxCents: v.number(),
  californiaIncomeTaxCents: v.number(),
  socialSecurityCents: v.number(),
  medicareCents: v.number(),
  caSdiCents: v.number(),
  netPayCents: v.number(),
  updatedAt: v.number(),
}
export const bankAccountKindValidator = bankAccountKind
export const ledgerEntryTypeValidator = ledgerEntryType
export const rosterStatusValidator = rosterStatus
export const studentAppValidator = studentApp
export const vaultFundingModeValidator = vaultFundingMode
export const vaultStatusValidator = vaultStatus
export const vaultScheduleCadenceValidator = vaultScheduleCadence
export const vaultOnDepositRuleValidator = vaultOnDepositRule
export const notificationKindValidator = notificationKind
export const payPeriodScheduleTypeValidator = payPeriodScheduleType
export const payPeriodStatusValidator = payPeriodStatus
export const payRunStatusValidator = payRunStatus
export const payRunTriggerValidator = payRunTrigger
export { payScheduleValidator, weekdayValidator }
