import { describe, expect, test } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { requireBankAccountForStudent } from '../banking/accounts'
import { postLedgerEntry } from '../banking/ledger'

import type { ConvexTest } from '../../test.setup'
import type { Id } from '../../_generated/dataModel'

describe('notifications', () => {
  test('requires auth and lists unread only', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)
    const nowMs = Date.UTC(2026, 6, 27, 12, 0, 0)

    await expect(
      t.query(api.features.notifications.listMyUnreadNotifications, {})
    ).rejects.toThrow(/Not authenticated/)

    await seedSkippedNotification(t, {
      student,
      rosterStudentId,
      nowMs,
      vaultName: 'Trip',
    })

    const unread = await student.client.query(
      api.features.notifications.listMyUnreadNotifications,
      {}
    )
    expect(unread).toHaveLength(1)
    expect(unread[0]).toMatchObject({
      kind: 'transfer_skipped',
      title: 'Transfer skipped',
    })
    expect(unread[0]?.readAt).toBeUndefined()
    expect(
      await student.client.query(
        api.features.notifications.unreadNotificationCount,
        {}
      )
    ).toBe(1)
  })

  test('marks one notification read and isolates students', async () => {
    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const owner = await inviteAndAcceptStudent(t, classroom, {
      email: 'notify-owner@ofy.org',
      externalStudentId: 9401,
    })
    const other = await inviteAndAcceptStudent(t, classroom, {
      email: 'notify-other@ofy.org',
      externalStudentId: 9402,
    })
    const nowMs = Date.UTC(2026, 6, 27, 13, 0, 0)

    await seedSkippedNotification(t, {
      student: owner.student,
      rosterStudentId: owner.rosterStudentId,
      nowMs,
      vaultName: 'Laptop',
    })

    const unread = await owner.student.client.query(
      api.features.notifications.listMyUnreadNotifications,
      {}
    )
    expect(unread).toHaveLength(1)
    const notificationId = unread[0]!._id

    expect(
      await other.student.client.mutation(
        api.features.notifications.markNotificationRead,
        { notificationId }
      )
    ).toBeNull()
    expect(
      await other.student.client.query(
        api.features.notifications.listMyUnreadNotifications,
        {}
      )
    ).toEqual([])

    const marked = await owner.student.client.mutation(
      api.features.notifications.markNotificationRead,
      { notificationId }
    )
    expect(marked?.readAt).toEqual(expect.any(Number))

    expect(
      await owner.student.client.query(
        api.features.notifications.listMyUnreadNotifications,
        {}
      )
    ).toEqual([])
    expect(
      await owner.student.client.query(
        api.features.notifications.unreadNotificationCount,
        {}
      )
    ).toBe(0)
  })

  test('markAllNotificationsRead clears unread for the current user only', async () => {
    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const first = await inviteAndAcceptStudent(t, classroom, {
      email: 'mark-all-a@ofy.org',
      externalStudentId: 9403,
    })
    const second = await inviteAndAcceptStudent(t, classroom, {
      email: 'mark-all-b@ofy.org',
      externalStudentId: 9404,
    })
    const nowMs = Date.UTC(2026, 6, 27, 14, 0, 0)

    await seedSkippedNotification(t, {
      student: first.student,
      rosterStudentId: first.rosterStudentId,
      nowMs,
      vaultName: 'A',
    })
    await seedSkippedNotification(t, {
      student: second.student,
      rosterStudentId: second.rosterStudentId,
      nowMs,
      vaultName: 'B',
    })

    expect(
      await first.student.client.mutation(
        api.features.notifications.markAllNotificationsRead,
        {}
      )
    ).toEqual({ markedCount: 1 })

    expect(
      await first.student.client.query(
        api.features.notifications.listMyUnreadNotifications,
        {}
      )
    ).toEqual([])
    expect(
      await second.student.client.query(
        api.features.notifications.listMyUnreadNotifications,
        {}
      )
    ).toHaveLength(1)
  })
})

async function seedSkippedNotification(
  t: ConvexTest,
  args: {
    student: Awaited<ReturnType<typeof asAuthedUser>>
    rosterStudentId: Id<'rosterStudents'>
    nowMs: number
    vaultName: string
  }
) {
  await creditSavings(t, args.rosterStudentId, 10)
  const vault = await args.student.client.mutation(
    api.features.vaults.createVault,
    {
      name: args.vaultName,
      icon: '⏭️',
      fundingMode: 'scheduled',
      scheduledAmountCents: 500,
      scheduleCadence: 'weekly',
    }
  )
  await t.run(async ctx => {
    await ctx.db.patch('vaults', vault._id, { nextRunAt: args.nowMs - 1 })
  })
  await t.mutation(internal.features.vaultsCron.processScheduledVaultFunding, {
    nowMs: args.nowMs,
  })
  // Keep this vault from re-firing on later cron calls in the same test.
  await t.run(async ctx => {
    await ctx.db.patch('vaults', vault._id, {
      nextRunAt: args.nowMs + 7 * 24 * 60 * 60 * 1000,
    })
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
  return await inviteAndAcceptStudent(t, classroom, options)
}

async function inviteAndAcceptStudent(
  t: ConvexTest,
  classroom: Awaited<ReturnType<typeof setupDevTeacherClassroom>>,
  options: {
    email?: string
    displayName?: string
    externalStudentId?: number
  } = {}
) {
  const email = options.email ?? 'notify-student@ofy.org'
  const displayName = options.displayName ?? 'Notify Kid'
  const externalStudentId = options.externalStudentId ?? 9400

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
