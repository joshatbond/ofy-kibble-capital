import { describe, expect, test } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { requireBankAccountForStudent } from '../banking/accounts'
import { postLedgerEntry } from '../banking/ledger'
import { nextRunAtForCadence } from './helpers'

import type { ConvexTest } from '../../test.setup'
import type { Id } from '../../_generated/dataModel'

describe('processScheduledVaultFunding', () => {
  test('funds due scheduled vaults from unallocated savings and advances nextRunAt', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId, userId } = await setupActiveStudent(t)
    const nowMs = Date.UTC(2026, 6, 27, 12, 0, 0)

    await creditSavings(t, rosterStudentId, 5_000)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Trip',
      icon: '✈️',
      fundingMode: 'scheduled',
      scheduledAmountCents: 1_000,
      scheduleCadence: 'weekly',
    })

    await setVaultNextRunAt(t, vault._id, nowMs - 1)

    expect(
      await t.mutation(internal.features.vaultsCron.processScheduledVaultFunding, {
        nowMs,
      })
    ).toEqual({ funded: 1, skipped: 0, examined: 1 })

    const updated = await student.client.query(api.features.vaults.getMyVault, {
      vaultId: vault._id,
    })
    expect(updated).toMatchObject({
      balanceCents: 1_000,
      status: 'active',
    })
    expect(updated?.nextRunAt).toBe(nextRunAtForCadence('weekly', nowMs))

    expect(
      await student.client.query(api.features.banking.getMyBalances, {})
    ).toMatchObject({
      savingsUnallocatedCents: 4_000,
      vaultsTotalCents: 1_000,
    })

    const history = await t.run(async ctx => {
      return await ctx.db
        .query('ledgerEntries')
        .withIndex('by_vaultId_createdAt', q => q.eq('vaultId', vault._id))
        .collect()
    })
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryType: 'vault_scheduled',
          direction: 'debit',
          accountKind: 'savings',
          amountCents: 1_000,
        }),
      ])
    )

    // No notification on success
    const notifications = await t.run(async ctx => {
      return await ctx.db
        .query('notifications')
        .withIndex('by_user_createdAt', q => q.eq('userId', userId))
        .collect()
    })
    expect(notifications).toHaveLength(0)
  })

  test('skips when unallocated savings are insufficient and creates transfer_skipped', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId, userId } = await setupActiveStudent(t, {
      email: 'skip-cron@ofy.org',
      externalStudentId: 9202,
    })
    const nowMs = Date.UTC(2026, 6, 27, 12, 0, 0)

    await creditSavings(t, rosterStudentId, 200)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Laptop',
      icon: '💻',
      fundingMode: 'scheduled',
      scheduledAmountCents: 500,
      scheduleCadence: 'weekly',
    })

    const nextRunBefore = nowMs - 1
    await setVaultNextRunAt(t, vault._id, nextRunBefore)

    expect(
      await t.mutation(internal.features.vaultsCron.processScheduledVaultFunding, {
        nowMs,
      })
    ).toEqual({ funded: 0, skipped: 1, examined: 1 })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({
      balanceCents: 0,
      nextRunAt: nextRunBefore,
    })

    const notifications = await t.run(async ctx => {
      return await ctx.db
        .query('notifications')
        .withIndex('by_user_createdAt', q => q.eq('userId', userId))
        .collect()
    })
    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toMatchObject({
      kind: 'transfer_skipped',
      title: 'Transfer skipped',
      vaultId: vault._id,
      rosterStudentId,
    })
    expect(notifications[0]?.readAt).toBeUndefined()
  })

  test('does not fund complete vaults even when nextRunAt is due', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t, {
      email: 'complete-cron@ofy.org',
      externalStudentId: 9203,
    })
    const nowMs = Date.UTC(2026, 6, 27, 12, 0, 0)

    await creditSavings(t, rosterStudentId, 5_000)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Done',
      icon: '✅',
      goalCents: 100,
      fundingMode: 'scheduled',
      scheduledAmountCents: 100,
      scheduleCadence: 'weekly',
    })

    // Manually complete with funds already at goal, leave a stale nextRunAt.
    await t.run(async ctx => {
      await ctx.db.patch('vaults', vault._id, {
        balanceCents: 100,
        status: 'complete',
        nextRunAt: nowMs - 1,
        updatedAt: nowMs,
      })
    })

    expect(
      await t.mutation(internal.features.vaultsCron.processScheduledVaultFunding, {
        nowMs,
      })
    ).toEqual({ funded: 0, skipped: 0, examined: 0 })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({ balanceCents: 100, status: 'complete' })

    expect(
      await student.client.query(api.features.banking.getMyBalances, {})
    ).toMatchObject({ savingsUnallocatedCents: 5_000 })
  })

  test('marks vault complete when scheduled funding hits the goal', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t, {
      email: 'goal-cron@ofy.org',
      externalStudentId: 9204,
    })
    const nowMs = Date.UTC(2026, 6, 27, 12, 0, 0)

    await creditSavings(t, rosterStudentId, 2_000)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Goal',
      icon: '🎯',
      goalCents: 800,
      fundingMode: 'scheduled',
      scheduledAmountCents: 800,
      scheduleCadence: 'monthly',
    })
    await setVaultNextRunAt(t, vault._id, nowMs - 1)

    await t.mutation(internal.features.vaultsCron.processScheduledVaultFunding, {
      nowMs,
    })

    const completed = await student.client.query(api.features.vaults.getMyVault, {
      vaultId: vault._id,
    })
    expect(completed).toMatchObject({
      balanceCents: 800,
      status: 'complete',
    })
    expect(completed?.nextRunAt).toBeUndefined()
  })
})

async function setVaultNextRunAt(
  t: ConvexTest,
  vaultId: Id<'vaults'>,
  nextRunAt: number
) {
  await t.run(async ctx => {
    await ctx.db.patch('vaults', vaultId, { nextRunAt })
  })
}

async function creditSavings(
  t: ConvexTest,
  rosterStudentId: Id<'rosterStudents'>,
  amountCents: number
) {
  await t.run(async ctx => {
    const roster = await ctx.db.get('rosterStudents', rosterStudentId)
    if (roster === null) {
      throw new Error('Roster student missing')
    }
    const account = await requireBankAccountForStudent(
      ctx,
      rosterStudentId,
      'savings'
    )
    await postLedgerEntry(ctx, {
      organizationId: roster.organizationId,
      rosterStudentId,
      bankAccountId: account._id,
      accountKind: 'savings',
      direction: 'credit',
      amountCents,
      entryType: 'internal_transfer',
      label: 'Test credit savings',
      createdAt: Date.now(),
    })
  })
}

async function setupActiveStudent(
  t: ConvexTest,
  options: {
    email?: string
    displayName?: string
    externalStudentId?: number
  } = {}
) {
  const classroom = await setupDevTeacherClassroom(t)
  const email = options.email ?? 'cron-student@ofy.org'
  const displayName = options.displayName ?? 'Cron Kid'
  const externalStudentId = options.externalStudentId ?? 9201

  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email,
      externalStudentId,
      grade: 7,
      displayName,
    }
  )

  const student = await asAuthedUser(t, {
    email,
    name: displayName,
  })

  await student.client.mutation(
    api.features.invitations.acceptClassroomInvitation,
    { invitationId: invited.invitationId }
  )

  const rosterStudentId = await t.run(async ctx => {
    const roster = await ctx.db
      .query('rosterStudents')
      .withIndex('by_invitationId', q =>
        q.eq('invitationId', invited.invitationId)
      )
      .unique()
    return roster!._id as Id<'rosterStudents'>
  })

  return {
    teacher: classroom.teacher,
    student,
    userId: student.userId,
    organizationId: classroom.organizationId,
    rosterStudentId,
  }
}
