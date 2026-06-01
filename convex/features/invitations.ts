import { getAuthUserId } from '@convex-dev/auth/server'
import { orgScope } from '@djpanda/convex-tenants'
import { v } from 'convex/values'

import { api, components } from '../_generated/api'
import { mutation, query } from '../_generated/server'
import { grade } from '../schema/schemaFields'

import { authz } from './auth/authz'
import { generatePayToken } from './invitations/payToken'
import {
  assertOfyOrgEmail,
  emailsMatch,
  invitationExpiresAt,
  normalizeInviteEmail,
} from './invitations/policy'
import {
  assertUniqueExternalStudentId,
  getClassroomIdForOrganization,
  getRosterByInvitationId,
  insertPendingRosterStudent,
  setRosterStatus,
} from './roster/roster'
import { rosterStatusValidator } from './roster/status'
import { isTeacherMemberRole } from './tenants/roles'

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

const invitationResultValidator = v.object({
  invitationId: v.string(),
  inviteeIdentifier: v.string(),
  expiresAt: v.number(),
})

const rosterRowValidator = v.object({
  rosterStudentId: v.id('rosterStudents'),
  email: v.string(),
  externalStudentId: v.number(),
  grade,
  status: rosterStatusValidator,
  payToken: v.string(),
  invitationId: v.string(),
  invitationStatus: v.union(
    v.literal('pending'),
    v.literal('accepted'),
    v.literal('cancelled'),
    v.literal('expired')
  ),
  invitationExpiresAt: v.number(),
  invitationIsExpired: v.boolean(),
  userId: v.optional(v.id('users')),
})

/** Invite a **Student** by `@ofy.org` email — provisions roster + bank accounts. */
export const inviteStudent = mutation({
  args: {
    organizationId: v.string(),
    email: v.string(),
    externalStudentId: v.number(),
    grade,
  },
  returns: invitationResultValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to invite students.')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'invitations:create'
    )

    const email = assertOfyOrgEmail(args.email)
    const classroomId = await getClassroomIdForOrganization(
      ctx,
      args.organizationId
    )

    await assertUniqueExternalStudentId(
      ctx,
      args.organizationId,
      args.externalStudentId
    )

    const payToken = generatePayToken()
    const expiresAt = invitationExpiresAt()

    const result = await ctx.runMutation(
      components.tenants.invitations.inviteMember,
      {
        organizationId: args.organizationId,
        userId,
        inviteeIdentifier: email,
        role: 'student',
        expiresAt,
        inviterName: await getInviterName(ctx, userId),
      }
    )

    await insertPendingRosterStudent(ctx, {
      organizationId: args.organizationId,
      classroomId,
      invitationId: result.invitationId,
      email,
      externalStudentId: args.externalStudentId,
      grade: args.grade,
      payToken,
    })

    return result
  },
})

/** Invite a **Co-teacher** with equal **Teacher** permissions. */
export const inviteCoTeacher = mutation({
  args: {
    organizationId: v.string(),
    email: v.string(),
  },
  returns: invitationResultValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to invite co-teachers.')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'invitations:create'
    )

    const email = assertOfyOrgEmail(args.email)

    return await ctx.runMutation(components.tenants.invitations.inviteMember, {
      organizationId: args.organizationId,
      userId,
      inviteeIdentifier: email,
      role: 'teacher',
      expiresAt: invitationExpiresAt(),
      inviterName: await getInviterName(ctx, userId),
    })
  },
})

/** **Resend invitation** — refreshes the 14-day expiry. */
export const resendClassroomInvitation = mutation({
  args: {
    organizationId: v.string(),
    invitationId: v.string(),
  },
  returns: v.object({
    invitationId: v.string(),
    inviteeIdentifier: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to resend invitations.')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'invitations:resend'
    )

    const invitation = await ctx.runQuery(
      components.tenants.invitations.getInvitation,
      { invitationId: args.invitationId }
    )

    if (
      invitation === null ||
      invitation.organizationId !== args.organizationId
    ) {
      throw new Error('Invitation not found.')
    }

    const result = await ctx.runMutation(
      components.tenants.invitations.resendInvitation,
      {
        invitationId: args.invitationId,
        userId,
      }
    )

    return {
      invitationId: result.invitationId,
      inviteeIdentifier: result.inviteeIdentifier,
      expiresAt: invitationExpiresAt(),
    }
  },
})

/** **Revoke invitation** — cancels the tenants invite and marks roster revoked. */
export const revokeClassroomInvitation = mutation({
  args: {
    organizationId: v.string(),
    invitationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to revoke invitations.')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'invitations:cancel'
    )

    const invitation = await ctx.runQuery(
      components.tenants.invitations.getInvitation,
      { invitationId: args.invitationId }
    )

    if (
      invitation === null ||
      invitation.organizationId !== args.organizationId
    ) {
      throw new Error('Invitation not found.')
    }

    await ctx.runMutation(components.tenants.invitations.cancelInvitation, {
      invitationId: args.invitationId,
      userId,
    })

    const roster = await getRosterByInvitationId(ctx, args.invitationId)
    if (roster !== null) {
      await setRosterStatus(ctx, roster._id, 'revoked')
    }

    return null
  },
})

/** Issue a new **Pay token** for a roster student (invalidates the previous QR). */
export const rotatePayToken = mutation({
  args: {
    organizationId: v.string(),
    rosterStudentId: v.id('rosterStudents'),
  },
  returns: v.object({ payToken: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to rotate pay tokens.')
    }

    await requireTeacherForOrg(
      ctx,
      userId,
      args.organizationId,
      'members:updateRole'
    )

    const roster = await ctx.db.get('rosterStudents', args.rosterStudentId)
    if (roster === null || roster.organizationId !== args.organizationId) {
      throw new Error('Student not found on this roster.')
    }

    const payToken = generatePayToken()
    await ctx.db.patch('rosterStudents', args.rosterStudentId, { payToken })

    return { payToken }
  },
})

/** Public invitation preview for `/invite/:id` (no auth required). */
export const getInvitePreview = query({
  args: { invitationId: v.string() },
  returns: v.union(
    v.object({
      invitationId: v.string(),
      organizationName: v.string(),
      inviteeIdentifier: v.string(),
      role: v.string(),
      status: v.union(
        v.literal('pending'),
        v.literal('accepted'),
        v.literal('cancelled'),
        v.literal('expired')
      ),
      isExpired: v.boolean(),
      expiresAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(
      components.tenants.invitations.getInvitation,
      { invitationId: args.invitationId }
    )

    if (invitation === null) {
      return null
    }

    return {
      invitationId: invitation._id,
      organizationName: invitation.organizationName,
      inviteeIdentifier: invitation.inviteeIdentifier,
      role: invitation.role,
      status: invitation.status,
      isExpired: invitation.isExpired,
      expiresAt: invitation.expiresAt,
    }
  },
})

/** Signed-in viewer email for invite accept UI. */
export const viewerEmail = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }

    const user = await ctx.db.get('users', userId)
    return user?.email ?? null
  },
})

const acceptResultValidator = v.object({
  role: v.string(),
  redirectPath: v.string(),
})

/**
 * Accept a classroom invitation after Google sign-in.
 * Enforces invitee email match and invitation state (`@ofy.org` is already
 * guaranteed by Google Workspace internal OAuth on sign-in).
 */
export const acceptClassroomInvitation = mutation({
  args: { invitationId: v.string() },
  returns: acceptResultValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to accept an invitation.')
    }

    const user = await ctx.db.get('users', userId)
    const userEmail = user?.email

    if (userEmail === undefined) {
      throw new Error(
        'Your account must have an email address to accept invitations.'
      )
    }

    const invitation = await ctx.runQuery(
      components.tenants.invitations.getInvitation,
      { invitationId: args.invitationId }
    )

    if (invitation === null) {
      throw new Error('This invitation link is invalid.')
    }

    if (invitation.status === 'cancelled') {
      throw new Error('This invitation was revoked.')
    }

    if (invitation.status === 'accepted') {
      return postAcceptRedirect(invitation.role)
    }

    if (invitation.isExpired || invitation.status === 'expired') {
      throw new Error(
        'This invitation has expired. Ask your teacher to resend it.'
      )
    }

    if (!emailsMatch(invitation.inviteeIdentifier, userEmail)) {
      throw new Error(
        `Sign in with ${normalizeInviteEmail(invitation.inviteeIdentifier)} to accept this invitation.`
      )
    }

    await ctx.runMutation(api.features.tenants.acceptInvitation, {
      invitationId: args.invitationId,
    })

    return postAcceptRedirect(invitation.role)
  },
})

/** Classroom roster for **Teacher admin** — active students + pending invitations. */
export const listClassroomRoster = query({
  args: { organizationId: v.string() },
  returns: v.array(rosterRowValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('You must be signed in to view the roster.')
    }

    await requireTeacherForOrg(ctx, userId, args.organizationId, 'members:list')

    const rosterRows = await ctx.db
      .query('rosterStudents')
      .withIndex('by_organizationId', q =>
        q.eq('organizationId', args.organizationId)
      )
      .collect()

    const tenantInvitations = await ctx.runQuery(
      components.tenants.invitations.listInvitations,
      { organizationId: args.organizationId }
    )

    const invitationById = new Map(
      tenantInvitations.map(inv => [inv._id, inv] as const)
    )

    const rows = []

    for (const roster of rosterRows) {
      const tenantInvitation = invitationById.get(roster.invitationId)
      if (tenantInvitation === undefined) {
        continue
      }

      rows.push({
        rosterStudentId: roster._id,
        email: roster.email,
        externalStudentId: roster.externalStudentId,
        grade: roster.grade,
        status: roster.status,
        payToken: roster.payToken,
        invitationId: roster.invitationId,
        invitationStatus: tenantInvitation.status,
        invitationExpiresAt: tenantInvitation.expiresAt,
        invitationIsExpired: tenantInvitation.isExpired,
        userId: roster.userId,
      })
    }

    rows.sort((a, b) => a.email.localeCompare(b.email))

    return rows
  },
})

async function requireTeacherForOrg(
  ctx: Parameters<typeof authz.require>[0],
  userId: string,
  organizationId: string,
  permission: string
): Promise<void> {
  await authz.require(ctx, userId, permission, orgScope(organizationId))
}
async function getInviterName(
  ctx: MutationCtx,
  userId: Id<'users'>
): Promise<string | undefined> {
  const user = await ctx.db.get('users', userId)
  return user?.name ?? user?.email ?? undefined
}
function postAcceptRedirect(role: string): {
  role: string
  redirectPath: string
} {
  if (isTeacherMemberRole(role)) {
    return { role, redirectPath: '/admin/' }
  }

  return { role, redirectPath: '/kibble/' }
}
