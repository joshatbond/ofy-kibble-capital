import { getAuthUserId } from '@convex-dev/auth/server'

import { components } from './_generated/api'
import { authz } from './authz'
import {
  defineTenantsApiOptions,
  makeTypedTenantsAPI,
} from './lib/makeTenantsAPI'

import type { Member } from '@djpanda/convex-tenants'

const tenantsAPI = makeTypedTenantsAPI(
  components.tenants,
  defineTenantsApiOptions({
    authz,
    creatorRole: 'owner',

    auth: async ctx => (await getAuthUserId(ctx)) ?? null,

    getUser: async (ctx, userId) => {
      const user = await ctx.db.get('users', userId)
      return user
        ? {
            name: user.name ?? undefined,
            email: user.email ?? undefined,
          }
        : null
    },

    onBeforeUpdateMemberRole: async (ctx, { organizationId, memberUserId }) => {
      const allMembers: Array<Member> = await ctx.runQuery(
        components.tenants.members.listOrganizationMembers,
        { organizationId }
      )
      const target = allMembers.find(m => m.userId === memberUserId)
      if (target?.role !== 'owner') return

      const otherOwners = allMembers.filter(
        m => m.role === 'owner' && m.userId !== memberUserId
      )
      if (otherOwners.length === 0) {
        throw new Error(
          'Cannot remove the last owner. Transfer ownership first.'
        )
      }
    },
  })
)

// createOrganization omitted — operator-gated org creation lands in step 2.
export const {
  listOrganizations,
  getOrganization,
  getOrganizationBySlug,
  updateOrganization,
  transferOwnership,
  deleteOrganization,
  listMembers,
  listMembersPaginated,
  countMembers,
  getMember,
  getCurrentMember,
  addMember,
  bulkAddMembers,
  removeMember,
  bulkRemoveMembers,
  updateMemberRole,
  suspendMember,
  unsuspendMember,
  leaveOrganization,
  listTeams,
  listTeamsAsTree,
  listTeamsPaginated,
  countTeams,
  getTeam,
  listTeamMembers,
  listTeamMembersPaginated,
  isTeamMember,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  listInvitations,
  listInvitationsPaginated,
  countInvitations,
  getInvitation,
  getPendingInvitations,
  inviteMember,
  bulkInviteMembers,
  acceptInvitation,
  resendInvitation,
  cancelInvitation,
  checkPermission,
  getUserPermissions,
  getUserRoles,
  grantPermission,
  denyPermission,
  getAuditLog,
  getCurrentUserEmail,
  checkMemberPermission,
} = tenantsAPI
