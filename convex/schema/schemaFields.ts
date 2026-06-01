import { v } from 'convex/values'

/**
 * Central field maps for app-owned Convex tables.
 *
 * - Pass directly to `defineTable(...)` in `schema.ts`.
 * - Wrap with `v.object(tableFields)` for mutation `args` / query `returns`.
 *
 * Auth component tables (`authTables` spread) are not defined here.
 */

/**
 * PawKet account type on `bankAccounts` (one row per kind per student).
 *
 * - `checking` — spending / everyday balance (PawKet Exchange)
 * - `savings` — interest-bearing balance (`savingsApyPercent` in class settings)
 *
 * Both are created at invite send via `provisionStudentBankAccounts`.
 */
const bankAccountKind = v.union(v.literal('checking'), v.literal('savings'))

/** Student **Grade** — 7 or 8 only in v1 (CONTEXT.md). */
export const grade = v.union(v.literal(7), v.literal(8))

/**
 * Lifecycle of a `rosterStudents` row relative to its classroom invitation.
 *
 * - `pending` — invite sent; student has not signed in and accepted yet
 * - `active` — student accepted; `userId` is set and they can use the apps
 * - `revoked` — teacher cancelled the invite; accept flow must reject
 */
const rosterStatus = v.union(
  v.literal('pending'),
  v.literal('active'),
  v.literal('revoked')
)
/** Canonical site slug, e.g. `ofysb-mv`. */
const siteSlug = v.string()

/**
 * Which student-facing PWA the user signed in from.
 *
 * - `kibble` — Kibble Capital (accounting)
 * - `pawket` — PawKet Exchange (banking)
 *
 */
const studentApp = v.union(v.literal('kibble'), v.literal('pawket'))

/** 0 = Sunday … 6 = Saturday (matches JS `Date.getDay()`). */
const weekdayValidator = v.number()
/** Classroom pay cadence (weekly, biweekly, semi-monthly, or monthly). */
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

/**
 * Signed-in identity (Convex Auth) plus app flags.
 * @see `users` in `schema.ts`
 */
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

/**
 * Operator catalog region (e.g. Options for Youth South Bay).
 * @see `regions` in `schema.ts`
 */
export const regionsTableFields = {
  /** Human-readable region name. */
  name: v.string(),
  /** Short code, e.g. `ofysb`. */
  slug: v.string(),
}

/**
 * Physical school site within a region (catalog row, not a tenant).
 * @see `schoolSites` in `schema.ts`
 */
export const schoolSitesTableFields = {
  /** Parent region. */
  regionId: v.id('regions'),
  /** Display name for the site. */
  name: v.string(),
  /** Canonical site slug, e.g. `ofysb-mv`. */
  siteSlug,
}

/**
 * Links a tenant classroom organization to operator catalog site slug.
 * @see `classrooms` in `schema.ts`
 */
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

/**
 * Shared payroll / product settings columns (hourly rate, pay schedule, vault cap, etc.).
 * Composed into `regionSettings`, `schoolSiteSettings`, and `classSettings`.
 */
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

/**
 * Region-level default settings (operator catalog).
 * @see `regionSettings` in `schema.ts`
 */
export const regionSettingsTableFields = {
  regionId: v.id('regions'),
  ...settingsTableFields,
}

/**
 * School-site overrides on top of region defaults.
 * @see `schoolSiteSettings` in `schema.ts`
 */
export const schoolSiteSettingsTableFields = {
  schoolSiteId: v.id('schoolSites'),
  ...settingsTableFields,
}

/**
 * Snapshot of effective settings at classroom create (editable by teachers later).
 * @see `classSettings` in `schema.ts`
 */
export const classSettingsTableFields = {
  organizationId: v.string(),
  classroomId: v.id('classrooms'),
  ...settingsTableFields,
}

/**
 * App session metadata keyed off Convex Auth sessions.
 * @see `authSessions` in `schema.ts`
 */
export const authSessionsTableFields = {
  userId: v.id('users'),
  /** Unix ms when this session expires. */
  expirationTime: v.number(),
  /** Which student app this session was opened from (set at OAuth sign-in). */
  studentApp: v.optional(studentApp),
}

/**
 * Binds OAuth verifier to target student app before redirect completes.
 * @see `studentOAuthIntents` in `schema.ts`
 */
export const studentOAuthIntentsTableFields = {
  verifierId: v.id('authVerifiers'),
  studentApp: studentApp,
  /** Unix ms when this intent row expires. */
  expirationTime: v.number(),
}

/**
 * Classroom roster row for a **Student** — pending until invitation accept.
 * Pay token and bank accounts are provisioned at invite send.
 * @see `rosterStudents` in `schema.ts`
 */
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

/**
 * Empty checking/savings accounts created when a student invite is sent.
 * @see `bankAccounts` in `schema.ts`
 */
export const bankAccountsTableFields = {
  organizationId: v.string(),
  rosterStudentId: v.id('rosterStudents'),
  /** Balance in cents (starts at 0). */
  balanceCents: v.number(),
  kind: bankAccountKind,
}

/** Re-export validators for function `args` / `returns` (see `convex/schema/`). */
export const rosterStatusValidator = rosterStatus
export const studentAppValidator = studentApp
export { payScheduleValidator, weekdayValidator }
