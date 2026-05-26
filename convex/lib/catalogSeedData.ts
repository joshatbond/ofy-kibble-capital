/** Operator-maintained v1 catalog — see CONTEXT.md (Region, School site, Site slug). */

export const V1_REGION = {
  slug: 'ofysb',
  name: 'Options for Youth — San Bernardino region',
} as const

export const V1_SCHOOL_SITES = [
  { siteSlug: 'ofysb-mv', name: 'Moreno Valley' },
  { siteSlug: 'ofysb-sb1', name: 'San Bernardino 1' },
  { siteSlug: 'ofysb-sb2', name: 'San Bernardino 2' },
  { siteSlug: 'ofysb-sb3', name: 'San Bernardino 3' },
] as const

/** Default dev classroom seeded with the catalog. */
export const V1_DEV_CLASSROOM = {
  siteSlug: 'ofysb-mv',
  name: 'Dev classroom (Moreno Valley)',
  orgSlug: 'dev-classroom-ofysb-mv',
} as const

/** Bootstrap user that owns seeded tenant orgs (not a real sign-in account). */
export const SEED_OPERATOR_EMAIL = 'seed-operator@internal.ofy.local'
