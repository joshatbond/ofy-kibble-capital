import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'

import {
  authSessionsTableFields,
  bankAccountsTableFields,
  classSettingsTableFields,
  classroomsTableFields,
  regionSettingsTableFields,
  regionsTableFields,
  rosterStudentsTableFields,
  schoolSiteSettingsTableFields,
  schoolSitesTableFields,
  studentOAuthIntentsTableFields,
  usersTableFields,
} from './schema/schemaFields'

export default defineSchema({
  ...authTables,
  users: defineTable(usersTableFields)
    .index('email', ['email'])
    .index('phone', ['phone'])
    .index('is_active', ['inactiveDate']),
  regions: defineTable(regionsTableFields).index('by_slug', ['slug']),
  schoolSites: defineTable(schoolSitesTableFields)
    .index('by_siteSlug', ['siteSlug'])
    .index('by_regionId', ['regionId']),
  classrooms: defineTable(classroomsTableFields)
    .index('by_organizationId', ['organizationId'])
    .index('by_siteSlug', ['siteSlug'])
    .index('by_orgSlug', ['orgSlug']),
  regionSettings: defineTable(regionSettingsTableFields).index('by_regionId', [
    'regionId',
  ]),
  schoolSiteSettings: defineTable(schoolSiteSettingsTableFields).index(
    'by_schoolSiteId',
    ['schoolSiteId']
  ),
  classSettings: defineTable(classSettingsTableFields).index(
    'by_organizationId',
    ['organizationId']
  ),
  authSessions: defineTable(authSessionsTableFields).index('userId', [
    'userId',
  ]),
  studentOAuthIntents: defineTable(studentOAuthIntentsTableFields).index(
    'by_verifier',
    ['verifierId']
  ),
  rosterStudents: defineTable(rosterStudentsTableFields)
    .index('by_organizationId', ['organizationId'])
    .index('by_invitationId', ['invitationId'])
    .index('by_org_payToken', ['organizationId', 'payToken'])
    .index('by_org_externalStudentId', ['organizationId', 'externalStudentId'])
    .index('by_userId', ['userId']),
  bankAccounts: defineTable(bankAccountsTableFields)
    .index('by_rosterStudent_kind', ['rosterStudentId', 'kind'])
    .index('by_organizationId', ['organizationId']),
})
