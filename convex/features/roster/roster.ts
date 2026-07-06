import { getBankAccountForStudent } from '../banking/accounts'
import { generatePayToken } from '../invitations/payToken'

import type { RosterStatus } from './status'
import type { Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import type { grade } from '../../schema/schemaFields'
import type { Infer } from 'convex/values'

export async function getClassroomIdForOrganization(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
): Promise<Id<'classrooms'>> {
  const classroom = await ctx.db
    .query('classrooms')
    .withIndex('by_organizationId', q => q.eq('organizationId', organizationId))
    .unique()

  if (classroom === null) {
    throw new Error('Classroom not found for this organization.')
  }

  return classroom._id
}

export async function assertUniqueExternalStudentId(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  externalStudentId: number,
  excludeRosterId?: Id<'rosterStudents'>
): Promise<void> {
  const existing = await ctx.db
    .query('rosterStudents')
    .withIndex('by_org_externalStudentId', q =>
      q
        .eq('organizationId', organizationId)
        .eq('externalStudentId', externalStudentId)
    )
    .unique()

  if (existing !== null && existing._id !== excludeRosterId) {
    throw new Error(
      `A student with external ID ${externalStudentId} is already on this roster.`
    )
  }
}

export async function provisionStudentBankAccounts(
  ctx: MutationCtx,
  args: {
    organizationId: string
    rosterStudentId: Id<'rosterStudents'>
  }
): Promise<void> {
  for (const kind of ['checking', 'savings'] as const) {
    const existing = await ctx.db
      .query('bankAccounts')
      .withIndex('by_rosterStudent_kind', q =>
        q.eq('rosterStudentId', args.rosterStudentId).eq('kind', kind)
      )
      .unique()

    if (existing !== null) {
      continue
    }

    await ctx.db.insert('bankAccounts', {
      organizationId: args.organizationId,
      rosterStudentId: args.rosterStudentId,
      kind,
      balanceCents: 0,
    })
  }
}

export async function allocatePayTokenForOrganization(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  excludeRosterStudentId?: Id<'rosterStudents'>
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const payToken = generatePayToken()
    const existing = await ctx.db
      .query('rosterStudents')
      .withIndex('by_org_payToken', q =>
        q.eq('organizationId', organizationId).eq('payToken', payToken)
      )
      .unique()

    if (existing === null) {
      return payToken
    }

    if (existing._id === excludeRosterStudentId) {
      continue
    }
  }

  throw new Error('Could not generate a unique pay token.')
}

export async function insertPendingRosterStudent(
  ctx: MutationCtx,
  args: {
    organizationId: string
    classroomId: Id<'classrooms'>
    invitationId: string
    email: string
    displayName?: string
    externalStudentId: number
    grade: Infer<typeof grade>
    payToken: string
  }
): Promise<Id<'rosterStudents'>> {
  const rosterStudentId = await ctx.db.insert('rosterStudents', {
    ...args,
    status: 'pending',
  })

  await provisionStudentBankAccounts(ctx, {
    organizationId: args.organizationId,
    rosterStudentId,
  })

  return rosterStudentId
}

export async function getRosterByInvitationId(
  ctx: QueryCtx | MutationCtx,
  invitationId: string
) {
  return await ctx.db
    .query('rosterStudents')
    .withIndex('by_invitationId', q => q.eq('invitationId', invitationId))
    .unique()
}

export async function setRosterStatus(
  ctx: MutationCtx,
  rosterStudentId: Id<'rosterStudents'>,
  status: RosterStatus
): Promise<void> {
  await ctx.db.patch('rosterStudents', rosterStudentId, { status })
}

export async function activateRosterStudent(
  ctx: MutationCtx,
  rosterStudentId: Id<'rosterStudents'>,
  userId: Id<'users'>
): Promise<void> {
  await ctx.db.patch('rosterStudents', rosterStudentId, {
    status: 'active',
    userId,
  })
}

export async function deleteNeverActiveRosterStudent(
  ctx: MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<void> {
  const roster = await ctx.db.get('rosterStudents', rosterStudentId)
  if (roster === null) {
    return
  }

  if (roster.userId !== undefined) {
    throw new Error(
      'Cannot remove a student who has already joined the classroom.'
    )
  }

  if (roster.status === 'active') {
    throw new Error(
      'Cannot remove an active student. Revoke their access instead.'
    )
  }

  const ledgerActivity = await ctx.db
    .query('ledgerEntries')
    .withIndex('by_rosterStudent_createdAt', q =>
      q.eq('rosterStudentId', rosterStudentId)
    )
    .take(1)

  if (ledgerActivity.length > 0) {
    throw new Error('Cannot remove a student with banking activity.')
  }

  for (const kind of ['checking', 'savings'] as const) {
    const account = await getBankAccountForStudent(ctx, rosterStudentId, kind)

    if (account !== null) {
      if (account.balanceCents !== 0) {
        throw new Error(
          'Cannot remove a student with a non-zero account balance.'
        )
      }

      await ctx.db.delete('bankAccounts', account._id)
    }
  }

  await ctx.db.delete('rosterStudents', rosterStudentId)
}
