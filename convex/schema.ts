import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'

import {
  authSessionsTableFields,
  bankAccountsTableFields,
  classSettingsTableFields,
  classroomsTableFields,
  ledgerEntriesTableFields,
  notificationsTableFields,
  paySplitsTableFields,
  regionSettingsTableFields,
  regionsTableFields,
  rosterStudentsTableFields,
  schoolSiteSettingsTableFields,
  schoolSitesTableFields,
  studentOAuthIntentsTableFields,
  usersTableFields,
  vaultsTableFields,
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
  ledgerEntries: defineTable(ledgerEntriesTableFields)
    .index('by_rosterStudent_createdAt', ['rosterStudentId', 'createdAt'])
    .index('by_rosterStudent_accountKind_createdAt', [
      'rosterStudentId',
      'accountKind',
      'createdAt',
    ])
    .index('by_organizationId_createdAt', ['organizationId', 'createdAt'])
    .index('by_vaultId_createdAt', ['vaultId', 'createdAt']),
  paySplits: defineTable(paySplitsTableFields)
    .index('by_rosterStudentId', ['rosterStudentId'])
    .index('by_organizationId', ['organizationId']),
  vaults: defineTable(vaultsTableFields)
    .index('by_rosterStudent_status', ['rosterStudentId', 'status'])
    .index('by_rosterStudentId', ['rosterStudentId'])
    .index('by_nextRunAt', ['nextRunAt']),
  notifications: defineTable(notificationsTableFields)
    .index('by_user_createdAt', ['userId', 'createdAt'])
    .index('by_user_readAt_createdAt', ['userId', 'readAt', 'createdAt']),
})
