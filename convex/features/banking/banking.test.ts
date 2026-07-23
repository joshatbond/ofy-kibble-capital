import { describe, expect, test } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { requireBankAccountForStudent } from './accounts'
import { postLedgerEntry } from './ledger'
import { transferDirectionMeta } from './transfers'

import type { ConvexTest } from '../../test.setup'
import type { Id } from '../../_generated/dataModel'

const paginationOpts = { numItems: 20, cursor: null }

describe('transferDirectionMeta', () => {
  test('maps directions to account kinds and labels', () => {
    expect(transferDirectionMeta('savings_to_checking')).toMatchObject({
      fromKind: 'savings',
      toKind: 'checking',
      label: 'Transfer to Checking',
    })
    expect(transferDirectionMeta('checking_to_savings')).toMatchObject({
      fromKind: 'checking',
      toKind: 'savings',
      label: 'Transfer to Savings',
    })
  })
})

describe('getMyBalances', () => {
  test('requires auth and returns null without an active roster', async () => {
    const t = initConvexTest()

    await expect(
      t.query(api.features.banking.getMyBalances, {})
    ).rejects.toThrow(/Not authenticated/)

    const stranger = await asAuthedUser(t, { email: 'stranger@ofy.org' })
    expect(
      await stranger.client.query(api.features.banking.getMyBalances, {})
    ).toBeNull()
  })

  test('returns zero balances and class currency settings for an active student', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    expect(
      await student.client.query(api.features.banking.getMyBalances, {})
    ).toEqual({
      checkingCents: 0,
      savingsUnallocatedCents: 0,
      vaultsTotalCents: 0,
      savingsCents: 0,
      currencyLabel: 'Bark Bucks',
      savingsApyPercent: 3.3,
    })
  })
})

describe('transferBetweenAccounts', () => {
  test('moves funds both directions and rejects invalid or insufficient amounts', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    await creditAccount(t, rosterStudentId, 'checking', 1000)

    await expect(
      t.mutation(api.features.banking.transferBetweenAccounts, {
        direction: 'checking_to_savings',
        amountCents: 100,
      })
    ).rejects.toThrow(/Not authenticated/)

    await expect(
      student.client.mutation(api.features.banking.transferBetweenAccounts, {
        direction: 'checking_to_savings',
        amountCents: 0,
      })
    ).rejects.toThrow(/positive integer/)

    await expect(
      student.client.mutation(api.features.banking.transferBetweenAccounts, {
        direction: 'checking_to_savings',
        amountCents: 1.5,
      })
    ).rejects.toThrow(/positive integer/)

    await expect(
      student.client.mutation(api.features.banking.transferBetweenAccounts, {
        direction: 'checking_to_savings',
        amountCents: 1001,
      })
    ).rejects.toThrow(/Insufficient checking balance/)

    expect(
      await student.client.mutation(
        api.features.banking.transferBetweenAccounts,
        {
          direction: 'checking_to_savings',
          amountCents: 400,
        }
      )
    ).toEqual({
      checkingCents: 600,
      savingsUnallocatedCents: 400,
      vaultsTotalCents: 0,
      savingsCents: 400,
    })

    expect(
      await student.client.mutation(
        api.features.banking.transferBetweenAccounts,
        {
          direction: 'savings_to_checking',
          amountCents: 150,
        }
      )
    ).toEqual({
      checkingCents: 750,
      savingsUnallocatedCents: 250,
      vaultsTotalCents: 0,
      savingsCents: 250,
    })

    await expect(
      student.client.mutation(api.features.banking.transferBetweenAccounts, {
        direction: 'savings_to_checking',
        amountCents: 251,
      })
    ).rejects.toThrow(/Insufficient unallocated savings/)
  })

  test('requires an active student account', async () => {
    const t = initConvexTest()
    const { teacher } = await setupDevTeacherClassroom(t, {
      email: 'teacher-only@ofy.org',
    })

    await expect(
      teacher.client.mutation(api.features.banking.transferBetweenAccounts, {
        direction: 'checking_to_savings',
        amountCents: 100,
      })
    ).rejects.toThrow(/Active student account required/)
  })
})

describe('activity history', () => {
  test('lists own activity, filters by account, and hides other students entries', async () => {
    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const first = await inviteAndAcceptStudent(t, classroom, {
      email: 'kid1@ofy.org',
      externalStudentId: 8001,
      displayName: 'Kid One',
    })
    const second = await inviteAndAcceptStudent(t, classroom, {
      email: 'kid2@ofy.org',
      externalStudentId: 8002,
      displayName: 'Kid Two',
    })

    await creditAccount(t, first.rosterStudentId, 'checking', 500)
    await first.student.client.mutation(
      api.features.banking.transferBetweenAccounts,
      {
        direction: 'checking_to_savings',
        amountCents: 200,
      }
    )
    await creditAccount(t, second.rosterStudentId, 'checking', 300)

    const history = await first.student.client.query(
      api.features.banking.listMyActivityHistory,
      { paginationOpts }
    )
    expect(history.page.length).toBeGreaterThanOrEqual(3)

    const checkingOnly = await first.student.client.query(
      api.features.banking.listMyActivityHistory,
      {
        accountKind: 'checking',
        paginationOpts,
      }
    )
    expect(
      checkingOnly.page.every(row => row.accountKind === 'checking')
    ).toBe(true)

    const savingsCredit = history.page.find(
      row =>
        row.entryType === 'internal_transfer' &&
        row.accountKind === 'savings' &&
        row.direction === 'credit'
    )
    expect(savingsCredit).toMatchObject({
      amountCents: 200,
      label: 'Transfer to Savings',
    })

    expect(
      await first.student.client.query(api.features.banking.getMyLedgerEntry, {
        entryId: savingsCredit!.entryId,
      })
    ).toMatchObject({
      entryId: savingsCredit!.entryId,
      amountCents: 200,
      accountKind: 'savings',
      direction: 'credit',
    })

    const otherHistory = await second.student.client.query(
      api.features.banking.listMyActivityHistory,
      { paginationOpts }
    )
    const otherEntry = otherHistory.page[0]
    expect(otherEntry).toBeDefined()
    expect(
      await first.student.client.query(api.features.banking.getMyLedgerEntry, {
        entryId: otherEntry!.entryId,
      })
    ).toBeNull()
  })

  test('listClassroomActivityHistory is teacher-only and includes student labels', async () => {
    const t = initConvexTest()
    const { teacher, organizationId, student, rosterStudentId } =
      await setupActiveStudent(t, {
        email: 'kid@ofy.org',
        displayName: 'Kid Display',
        externalStudentId: 8101,
      })

    await creditAccount(t, rosterStudentId, 'savings', 500)
    await student.client.mutation(api.features.banking.transferBetweenAccounts, {
      direction: 'savings_to_checking',
      amountCents: 125,
    })

    await expect(
      student.client.query(api.features.banking.listClassroomActivityHistory, {
        organizationId,
        paginationOpts,
      })
    ).rejects.toThrow(/Teacher access required/)

    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })
    await expect(
      stranger.client.query(api.features.banking.listClassroomActivityHistory, {
        organizationId,
        paginationOpts,
      })
    ).rejects.toThrow(/Teacher access required/)

    const classroomHistory = await teacher.client.query(
      api.features.banking.listClassroomActivityHistory,
      {
        organizationId,
        paginationOpts,
      }
    )

    expect(classroomHistory.page).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rosterStudentId,
          studentDisplayName: 'Kid Display',
          amountCents: 125,
          entryType: 'internal_transfer',
          label: 'Transfer to Checking',
        }),
      ])
    )
  })
})

describe('sweepToChecking', () => {
  test('moves savings into checking and rejects bad amounts', async () => {
    const t = initConvexTest()
    const { rosterStudentId } = await setupActiveStudent(t)

    await creditAccount(t, rosterStudentId, 'savings', 800)

    await expect(
      t.mutation(internal.features.banking.sweepToChecking, {
        rosterStudentId,
        amountCents: 0,
      })
    ).rejects.toThrow(/positive integer/)

    expect(
      await t.mutation(internal.features.banking.sweepToChecking, {
        rosterStudentId,
        amountCents: 300,
      })
    ).toEqual({
      checkingCents: 300,
      savingsUnallocatedCents: 500,
      vaultsTotalCents: 0,
      savingsCents: 500,
    })

    await expect(
      t.mutation(internal.features.banking.sweepToChecking, {
        rosterStudentId,
        amountCents: 501,
      })
    ).rejects.toThrow(/Insufficient unallocated savings/)

    const history = await t.run(async ctx => {
      return await ctx.db
        .query('ledgerEntries')
        .withIndex('by_rosterStudent_createdAt', q =>
          q.eq('rosterStudentId', rosterStudentId)
        )
        .collect()
    })
    expect(
      history.some(
        entry =>
          entry.entryType === 'sweep_to_checking' && entry.amountCents === 300
      )
    ).toBe(true)
  })

  test('rejects inactive roster students', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)
    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'pending@ofy.org',
        externalStudentId: 8301,
        grade: 7,
      }
    )

    const rosterStudentId = await t.run(async ctx => {
      const roster = await ctx.db
        .query('rosterStudents')
        .withIndex('by_invitationId', q =>
          q.eq('invitationId', invited.invitationId)
        )
        .unique()
      return roster!._id
    })

    await expect(
      t.mutation(internal.features.banking.sweepToChecking, {
        rosterStudentId,
        amountCents: 100,
      })
    ).rejects.toThrow(/Active student account required/)
  })
})

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
  const email = options.email ?? 'kid@ofy.org'
  const displayName = options.displayName ?? 'Kid'

  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email,
      displayName,
      externalStudentId: options.externalStudentId ?? 9001,
      grade: 7,
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
    organizationId: classroom.organizationId,
    rosterStudentId,
  }
}

async function creditAccount(
  t: ConvexTest,
  rosterStudentId: Id<'rosterStudents'>,
  kind: 'checking' | 'savings',
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
      kind
    )

    await postLedgerEntry(ctx, {
      organizationId: roster.organizationId,
      rosterStudentId,
      bankAccountId: account._id,
      accountKind: kind,
      direction: 'credit',
      amountCents,
      entryType: 'internal_transfer',
      label: `Test credit ${kind}`,
      createdAt: Date.now(),
    })
  })
}
