import { describe, expect, test } from 'vitest'

import { api } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { requireBankAccountForStudent } from '../banking/accounts'
import { postLedgerEntry } from '../banking/ledger'
import { V1_BASE_SETTINGS } from '../settings/defaults'

import type { ConvexTest } from '../../test.setup'
import type { Id } from '../../_generated/dataModel'

describe('createVault / listMyVaults / getMyVault', () => {
  test('creates a manual vault and returns it from list and get', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    const created = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'New phone',
        icon: '📱',
        fundingMode: 'manual',
      }
    )

    expect(created).toMatchObject({
      name: 'New phone',
      icon: '📱',
      balanceCents: 0,
      fundingMode: 'manual',
      status: 'active',
    })
    expect(created.goalCents).toBeUndefined()
    expect(typeof created._id).toBe('string')

    expect(
      await student.client.query(api.features.vaults.listMyVaults, {})
    ).toEqual([created])

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: created._id,
      })
    ).toEqual(created)
  })

  test('requires auth and an active student to create', async () => {
    const t = initConvexTest()

    await expect(
      t.mutation(api.features.vaults.createVault, {
        name: 'Phone',
        icon: '📱',
        fundingMode: 'manual',
      })
    ).rejects.toThrow(/Not authenticated/)

    const { teacher } = await setupDevTeacherClassroom(t, {
      email: 'teacher-only@ofy.org',
    })
    await expect(
      teacher.client.mutation(api.features.vaults.createVault, {
        name: 'Phone',
        icon: '📱',
        fundingMode: 'manual',
      })
    ).rejects.toThrow(/Active student account required/)
  })

  test('list returns empty and get returns null without a roster', async () => {
    const t = initConvexTest()
    const stranger = await asAuthedUser(t, { email: 'stranger@ofy.org' })

    expect(
      await stranger.client.query(api.features.vaults.listMyVaults, {})
    ).toEqual([])

    const { student } = await setupActiveStudent(t)
    const created = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Phone',
        icon: '📱',
        fundingMode: 'manual',
      }
    )

    expect(
      await stranger.client.query(api.features.vaults.getMyVault, {
        vaultId: created._id,
      })
    ).toBeNull()
  })

  test('creates on-deposit and scheduled vaults with funding fields', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    const onDeposit = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Emergency',
        icon: '🛟',
        goalCents: 50_000,
        fundingMode: 'on_deposit',
        onDepositRule: { kind: 'percent', percent: 20 },
      }
    )
    expect(onDeposit).toMatchObject({
      name: 'Emergency',
      goalCents: 50_000,
      fundingMode: 'on_deposit',
      onDepositRule: { kind: 'percent', percent: 20 },
      status: 'active',
    })

    const scheduled = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Trip',
        icon: '✈️',
        fundingMode: 'scheduled',
        scheduledAmountCents: 500,
        scheduleCadence: 'weekly',
      }
    )
    expect(scheduled).toMatchObject({
      fundingMode: 'scheduled',
      scheduledAmountCents: 500,
      scheduleCadence: 'weekly',
    })
    expect(typeof scheduled.nextRunAt).toBe('number')
  })

  test('rejects when classroom vaultCap is reached', async () => {
    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const { student, teacher, organizationId } = await inviteAndAcceptStudent(
      t,
      classroom
    )

    await teacher.client.mutation(
      api.features.settings.updateClassSettingsForOrganization,
      {
        organizationId,
        settings: { ...V1_BASE_SETTINGS, vaultCap: 1 },
      }
    )

    await student.client.mutation(api.features.vaults.createVault, {
      name: 'First',
      icon: '1️⃣',
      fundingMode: 'manual',
    })

    await expect(
      student.client.mutation(api.features.vaults.createVault, {
        name: 'Second',
        icon: '2️⃣',
        fundingMode: 'manual',
      })
    ).rejects.toThrow(/Vault limit reached \(1\)/)
  })

  test('rejects on-deposit percent sum over 100%', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    await student.client.mutation(api.features.vaults.createVault, {
      name: 'A',
      icon: '🅰️',
      fundingMode: 'on_deposit',
      onDepositRule: { kind: 'percent', percent: 60 },
    })

    await expect(
      student.client.mutation(api.features.vaults.createVault, {
        name: 'B',
        icon: '🅱️',
        fundingMode: 'on_deposit',
        onDepositRule: { kind: 'percent', percent: 50 },
      })
    ).rejects.toThrow(/cannot exceed 100%/)
  })

  test('students cannot see each other vaults', async () => {
    const t = initConvexTest()
    const classroom = await setupDevTeacherClassroom(t)
    const first = await inviteAndAcceptStudent(t, classroom, {
      email: 'kid-a@ofy.org',
      displayName: 'Kid A',
      externalStudentId: 9001,
    })
    const second = await inviteAndAcceptStudent(t, classroom, {
      email: 'kid-b@ofy.org',
      displayName: 'Kid B',
      externalStudentId: 9002,
    })

    const vault = await first.student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Private',
        icon: '🔒',
        fundingMode: 'manual',
      }
    )

    expect(
      await second.student.client.query(api.features.vaults.listMyVaults, {})
    ).toEqual([])
    expect(
      await second.student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toBeNull()
  })

  test('rejects blank names and funding-mode field mismatches', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    await expect(
      student.client.mutation(api.features.vaults.createVault, {
        name: '   ',
        icon: '📱',
        fundingMode: 'manual',
      })
    ).rejects.toThrow(/Vault name is required/)

    await expect(
      student.client.mutation(api.features.vaults.createVault, {
        name: 'Phone',
        icon: '📱',
        fundingMode: 'on_deposit',
      })
    ).rejects.toThrow(/require an on-deposit rule/)

    await expect(
      student.client.mutation(api.features.vaults.createVault, {
        name: 'Phone',
        icon: '📱',
        fundingMode: 'manual',
        onDepositRule: { kind: 'percent', percent: 10 },
      })
    ).rejects.toThrow(/cannot include funding rule fields/)
  })
})

describe('closeVault', () => {
  test('closes an empty vault and removes it from list/get', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    const created = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Empty',
        icon: '🗑️',
        fundingMode: 'manual',
      }
    )

    await student.client.mutation(api.features.vaults.closeVault, {
      vaultId: created._id,
    })

    expect(
      await student.client.query(api.features.vaults.listMyVaults, {})
    ).toEqual([])
    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: created._id,
      })
    ).toBeNull()
  })

  test('rejects closing a vault that still has funds', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    const created = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Funded',
        icon: '💰',
        fundingMode: 'manual',
      }
    )

    await t.run(async ctx => {
      await ctx.db.patch('vaults', created._id, { balanceCents: 250 })
    })

    await expect(
      student.client.mutation(api.features.vaults.closeVault, {
        vaultId: created._id,
      })
    ).rejects.toThrow(/Move all funds out/)

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: created._id,
      })
    ).toMatchObject({ balanceCents: 250, status: 'active' })
  })
})

describe('manualVaultTransfer', () => {
  test('adds funds from unallocated savings into any open vault', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    await creditSavings(t, rosterStudentId, 1000)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Phone',
      icon: '📱',
      goalCents: 500,
      fundingMode: 'on_deposit',
      onDepositRule: { kind: 'percent', percent: 10 },
    })

    const result = await student.client.mutation(
      api.features.vaults.manualVaultTransfer,
      {
        vaultId: vault._id,
        direction: 'to_vault',
        amountCents: 500,
      }
    )

    expect(result).toMatchObject({
      balanceCents: 500,
      status: 'complete',
    })

    expect(
      await student.client.query(api.features.banking.getMyBalances, {})
    ).toMatchObject({
      savingsUnallocatedCents: 500,
      vaultsTotalCents: 500,
      savingsCents: 1000,
    })
  })

  test('rejects insufficient unallocated savings and closed vaults', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    await creditSavings(t, rosterStudentId, 100)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Trip',
      icon: '✈️',
      fundingMode: 'scheduled',
      scheduledAmountCents: 50,
      scheduleCadence: 'weekly',
    })

    await expect(
      student.client.mutation(api.features.vaults.manualVaultTransfer, {
        vaultId: vault._id,
        direction: 'to_vault',
        amountCents: 101,
      })
    ).rejects.toThrow(/Insufficient unallocated savings/)

    await student.client.mutation(api.features.vaults.closeVault, {
      vaultId: vault._id,
    })

    await expect(
      student.client.mutation(api.features.vaults.manualVaultTransfer, {
        vaultId: vault._id,
        direction: 'to_vault',
        amountCents: 50,
      })
    ).rejects.toThrow(/Vault not found/)
  })
})

describe('updateVault', () => {
  test('updates name, icon, and goal without changing funding mode', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    const created = await student.client.mutation(
      api.features.vaults.createVault,
      {
        name: 'Phone',
        icon: '📱',
        fundingMode: 'on_deposit',
        onDepositRule: { kind: 'percent', percent: 15 },
      }
    )

    const updated = await student.client.mutation(
      api.features.vaults.updateVault,
      {
        vaultId: created._id,
        name: 'New phone',
        icon: '☎️',
        goalCents: 20_000,
      }
    )

    expect(updated).toMatchObject({
      name: 'New phone',
      icon: '☎️',
      goalCents: 20_000,
      fundingMode: 'on_deposit',
      onDepositRule: { kind: 'percent', percent: 15 },
    })
  })
})

describe('transferFunds / listMyTransferAccounts', () => {
  test('lists checking, savings, and open vaults with balances', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    await creditAccount(t, rosterStudentId, 'checking', 400)
    await creditSavings(t, rosterStudentId, 600)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Car',
      icon: '🚗',
      fundingMode: 'manual',
    })

    await student.client.mutation(api.features.vaults.manualVaultTransfer, {
      vaultId: vault._id,
      direction: 'to_vault',
      amountCents: 100,
    })

    const accounts = await student.client.query(
      api.features.vaults.listMyTransferAccounts,
      {}
    )

    expect(accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'checking',
          label: 'Checking',
          balanceCents: 400,
        }),
        expect.objectContaining({
          type: 'savings',
          label: 'Savings',
          balanceCents: 500,
        }),
        expect.objectContaining({
          type: 'vault',
          vaultId: vault._id,
          label: 'Car',
          icon: '🚗',
          balanceCents: 100,
        }),
      ])
    )
  })

  test('transfers between checking, savings, and vaults', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    await creditAccount(t, rosterStudentId, 'checking', 1000)
    await creditSavings(t, rosterStudentId, 500)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Car',
      icon: '🚗',
      fundingMode: 'manual',
    })

    await student.client.mutation(api.features.vaults.transferFunds, {
      from: { type: 'checking' },
      to: { type: 'vault', vaultId: vault._id },
      amountCents: 200,
    })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({ balanceCents: 200 })

    expect(
      await student.client.query(api.features.banking.getMyBalances, {})
    ).toMatchObject({
      checkingCents: 800,
      savingsUnallocatedCents: 500,
      vaultsTotalCents: 200,
    })

    await student.client.mutation(api.features.vaults.transferFunds, {
      from: { type: 'vault', vaultId: vault._id },
      to: { type: 'savings' },
      amountCents: 50,
    })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({ balanceCents: 150 })
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

async function creditSavings(
  t: ConvexTest,
  rosterStudentId: Id<'rosterStudents'>,
  amountCents: number
) {
  await creditAccount(t, rosterStudentId, 'savings', amountCents)
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
