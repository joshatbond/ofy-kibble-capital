/**
 * Static v1 operator catalog rows for dev seeding.
 * See CONTEXT.md (**Region**, **School site**, site slug).
 */

/** San Bernardino region row seeded in development. */
export const V1_REGION = {
  slug: 'ofysb',
  name: 'Options for Youth — San Bernardino region',
} as const

/** School sites under {@link V1_REGION} included in the v1 catalog seed. */
export const V1_SCHOOL_SITES = [
  { siteSlug: 'ofysb-mv', name: 'Moreno Valley' },
  { siteSlug: 'ofysb-sb1', name: 'San Bernardino 1' },
  { siteSlug: 'ofysb-sb2', name: 'San Bernardino 2' },
  { siteSlug: 'ofysb-sb3', name: 'San Bernardino 3' },
] as const

/** Default classroom organization created on `ofysb-mv` for local dev. */
export const V1_DEV_CLASSROOM = {
  siteSlug: 'ofysb-mv',
  name: 'Dev classroom (Moreno Valley)',
  orgSlug: 'dev-classroom-ofysb-mv',
} as const

/**
 * Bootstrap user that owns seeded tenant organizations.
 * Not a real Google sign-in account (`@internal.ofy.local`).
 */
export const OPERATOR_EMAIL = 'seed-operator@internal.ofy.local'
