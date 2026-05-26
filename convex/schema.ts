import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

import { settingsTableFields } from './lib/settingsValues'
import { siteSlugValidator } from './lib/siteSlug'
import { studentAppValidator } from './lib/studentApp'
import { userFields } from './lib/userFields'

export default defineSchema({
  ...authTables,
  users: defineTable(userFields)
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('is_active', ['inactiveDate']),
  regions: defineTable({
    /** Short code, e.g. `ofysb`. */
    slug: v.string(),
    name: v.string(),
  }).index('by_slug', ['slug']),
  schoolSites: defineTable({
    siteSlug: siteSlugValidator,
    regionId: v.id('regions'),
    name: v.string(),
  })
    .index('by_siteSlug', ['siteSlug'])
    .index('by_regionId', ['regionId']),
  /** Links a tenants classroom organization to operator catalog site slug. */
  classrooms: defineTable({
    organizationId: v.string(),
    siteSlug: siteSlugValidator,
    name: v.string(),
    orgSlug: v.string(),
  })
    .index('by_organizationId', ['organizationId'])
    .index('by_siteSlug', ['siteSlug'])
    .index('by_orgSlug', ['orgSlug']),
  regionSettings: defineTable({
    regionId: v.id('regions'),
    ...settingsTableFields,
  }).index('by_regionId', ['regionId']),
  schoolSiteSettings: defineTable({
    schoolSiteId: v.id('schoolSites'),
    ...settingsTableFields,
  }).index('by_schoolSiteId', ['schoolSiteId']),
  /** Snapshot of effective settings at classroom create (editable by teachers later). */
  classSettings: defineTable({
    organizationId: v.string(),
    classroomId: v.id('classrooms'),
    ...settingsTableFields,
  }).index('by_organizationId', ['organizationId']),
  authSessions: defineTable({
    userId: v.id('users'),
    expirationTime: v.number(),
    /** Which student app this session was opened from (set at OAuth sign-in). */
    studentApp: v.optional(studentAppValidator),
  }).index('userId', ['userId']),
  studentOAuthIntents: defineTable({
    verifierId: v.id('authVerifiers'),
    studentApp: studentAppValidator,
    expirationTime: v.number(),
  }).index('by_verifier', ['verifierId']),
  numbers: defineTable({
    value: v.number(),
  }),
})
