import { getAuthUserId } from '@convex-dev/auth/server'

import { components } from '../_generated/api'

import { authz } from './auth/authz'
import {
  INVITATION_TTL_MS,
  assertOfyOrgEmail,
  emailsMatch,
  normalizeInviteEmail,
} from './invitations/policy'
import { activateRosterStudent, getRosterByInvitationId } from './roster/roster'
import {
  defineTenantsApiOptions,
  makeTypedTenantsAPI,
} from './tenants/makeTenantsAPI'

import type { Id } from '../_generated/dataModel'
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

    defaultInvitationExpiration: INVITATION_TTL_MS,

    validateInvitationCreate: (_ctx, data) => {
      try {
        assertOfyOrgEmail(data.inviteeIdentifier)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid invitation email.'
        return Promise.resolve({ allowed: false as const, reason: message })
      }

      return Promise.resolve({ allowed: true as const })
    },

    validateInvitationAccept: async (ctx, data) => {
      if (
        !emailsMatch(
          data.invitation.inviteeIdentifier,
          data.acceptingUserIdentifier
        )
      ) {
        return {
          allowed: false,
          reason: `Sign in with ${normalizeInviteEmail(data.invitation.inviteeIdentifier)} to accept this invitation.`,
        }
      }

      const user = await ctx.db.get('users', data.acceptingUserId)
      if (
        user?.email !== undefined &&
        !emailsMatch(user.email, data.acceptingUserIdentifier)
      ) {
        return {
          allowed: false,
          reason: 'Signed-in account does not match this invitation.',
        }
      }

      return { allowed: true }
    },

    onInvitationAccepted: async (ctx, data) => {
      if (data.role !== 'student') {
        return
      }

      const roster = await getRosterByInvitationId(ctx, data.invitationId)
      if (roster === null) {
        return
      }

      await activateRosterStudent(ctx, roster._id, data.userId as Id<'users'>)
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
