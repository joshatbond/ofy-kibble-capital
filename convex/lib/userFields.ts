import { v } from 'convex/values'

/** Convex Auth user fields plus app-specific flags. */
export const userFields = {
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  /** When set, user cannot sign in (soft deactivate). */
  inactiveDate: v.optional(v.number()),
  /**
   * Allows `organizations.createOrganization` (operator tooling only in v1).
   * Classroom orgs for teachers are created via `internal.seed.seedV1Catalog`.
   */
  canCreateOrganization: v.optional(v.boolean()),
}
