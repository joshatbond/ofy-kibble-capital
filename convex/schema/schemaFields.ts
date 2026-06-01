import { v } from 'convex/values'

const bankAccountKind = v.union(v.literal('checking'), v.literal('savings'))
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
}
export const bankAccountsTableFields = {
  organizationId: v.string(),
  rosterStudentId: v.id('rosterStudents'),
  /** Balance in cents (starts at 0). */
  balanceCents: v.number(),
  kind: bankAccountKind,
}
export const rosterStatusValidator = rosterStatus
export const studentAppValidator = studentApp
export { payScheduleValidator, weekdayValidator }
