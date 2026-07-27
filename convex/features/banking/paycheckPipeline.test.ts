import { describe, expect, test } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { planPaycheckAllocation } from './paycheckPipeline'

import type { ConvexTest } from '../../test.setup'
import type { Id } from '../../_generated/dataModel'

describe('planPaycheckAllocation', () => {
  const vaultA = 'vault_a' as Id<'vaults'>
  const vaultB = 'vault_b' as Id<'vaults'>
  const vaultC = 'vault_c' as Id<'vaults'>

  test('with no vaults and unset split, all net pay goes to checking', () => {
    expect(
      planPaycheckAllocation({
        netPayCents: 10_000,
        onDepositVaults: [],
        savingsPercent: 0,
      })
    ).toEqual({
      vaultCuts: [],
      vaultCutsTotalCents: 0,
      checkingCents: 10_000,
      savingsCents: 0,
    })
  })

  test('applies pay split on full net when there are no on-deposit vaults', () => {
    expect(
      planPaycheckAllocation({
        netPayCents: 10_000,
        onDepositVaults: [],
        savingsPercent: 40,
      })
    ).toEqual({
      vaultCuts: [],
      vaultCutsTotalCents: 0,
      checkingCents: 6_000,
      savingsCents: 4_000,
    })
  })

  test('on-deposit percent takes first cut from full net before pay split', () => {
    // 20% of 10_000 = 2_000 to vault; remainder 8_000 → 50% savings = 4_000
    expect(
      planPaycheckAllocation({
        netPayCents: 10_000,
        onDepositVaults: [
          { vaultId: vaultA, rule: { kind: 'percent', percent: 20 } },
        ],
        savingsPercent: 50,
      })
    ).toEqual({
      vaultCuts: [{ vaultId: vaultA, amountCents: 2_000 }],
      vaultCutsTotalCents: 2_000,
      checkingCents: 4_000,
      savingsCents: 4_000,
    })
  })

  test('applies multiple on-deposit vaults in order and caps fixed by remaining', () => {
    // 50% = 5_000; fixed wants 6_000 but only 5_000 left; remainder 0
    expect(
      planPaycheckAllocation({
        netPayCents: 10_000,
        onDepositVaults: [
          { vaultId: vaultA, rule: { kind: 'percent', percent: 50 } },
          { vaultId: vaultB, rule: { kind: 'fixed', amountCents: 6_000 } },
          { vaultId: vaultC, rule: { kind: 'percent', percent: 10 } },
        ],
        savingsPercent: 30,
      })
    ).toEqual({
      vaultCuts: [
        { vaultId: vaultA, amountCents: 5_000 },
        { vaultId: vaultB, amountCents: 5_000 },
      ],
      vaultCutsTotalCents: 10_000,
      checkingCents: 0,
      savingsCents: 0,
    })
  })

  test('floors percent and pay-split cents', () => {
    // 33% of 100 = 33; remainder 67; 33% savings of 67 = 22; checking 45
    expect(
      planPaycheckAllocation({
        netPayCents: 100,
        onDepositVaults: [
          { vaultId: vaultA, rule: { kind: 'percent', percent: 33 } },
        ],
        savingsPercent: 33,
      })
    ).toEqual({
      vaultCuts: [{ vaultId: vaultA, amountCents: 33 }],
      vaultCutsTotalCents: 33,
      checkingCents: 45,
      savingsCents: 22,
    })
  })

  test('rejects non-positive net pay', () => {
    expect(() =>
      planPaycheckAllocation({
        netPayCents: 0,
        onDepositVaults: [],
        savingsPercent: 0,
      })
    ).toThrow(/positive integer/)
  })
})

describe('creditNetPay', () => {
  test('credits net pay to checking when pay split is unset', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    expect(
      await t.mutation(internal.features.banking.creditNetPay, {
        rosterStudentId,
        netPayCents: 5_000,
      })
    ).toEqual({
      checkingCents: 5_000,
      savingsUnallocatedCents: 0,
      vaultsTotalCents: 0,
      savingsCents: 0,
    })

    expect(
      await student.client.query(api.features.banking.getMyBalances, {})
    ).toMatchObject({
      checkingCents: 5_000,
      savingsUnallocatedCents: 0,
      vaultsTotalCents: 0,
    })

    const history = await ledgerForStudent(t, rosterStudentId)
    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryType: 'net_pay',
          direction: 'credit',
          accountKind: 'checking',
          amountCents: 5_000,
        }),
      ])
    )
  })

  test('applies on-deposit first cut then pay split on remainder', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    await student.client.mutation(api.features.paySplit.setMyPaySplit, {
      savingsPercent: 40,
    })

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Emergency',
      icon: '🛟',
      goalCents: 50_000,
      fundingMode: 'on_deposit',
      onDepositRule: { kind: 'percent', percent: 20 },
    })

    // 10_000 net → vault 2_000; remainder 8_000 → savings 3_200, checking 4_800
    expect(
      await t.mutation(internal.features.banking.creditNetPay, {
        rosterStudentId,
        netPayCents: 10_000,
      })
    ).toEqual({
      checkingCents: 4_800,
      savingsUnallocatedCents: 3_200,
      vaultsTotalCents: 2_000,
      savingsCents: 5_200,
    })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({ balanceCents: 2_000, status: 'active' })

    const history = await ledgerForStudent(t, rosterStudentId)
    expect(
      history.filter(entry => entry.entryType === 'net_pay')
    ).toHaveLength(1)
    expect(
      history.some(
        entry =>
          entry.entryType === 'vault_on_deposit' &&
          entry.vaultId === vault._id &&
          entry.direction === 'debit' &&
          entry.accountKind === 'savings' &&
          entry.amountCents === 2_000
      )
    ).toBe(true)
    expect(
      history.some(
        entry =>
          entry.entryType === 'pay_split' &&
          entry.direction === 'credit' &&
          entry.accountKind === 'savings' &&
          entry.amountCents === 3_200
      )
    ).toBe(true)
  })

  test('skips complete on-deposit vaults and marks goal complete', async () => {
    const t = initConvexTest()
    const { student, rosterStudentId } = await setupActiveStudent(t)

    const vault = await student.client.mutation(api.features.vaults.createVault, {
      name: 'Bike',
      icon: '🚲',
      goalCents: 1_500,
      fundingMode: 'on_deposit',
      onDepositRule: { kind: 'fixed', amountCents: 1_000 },
    })

    await t.mutation(internal.features.banking.creditNetPay, {
      rosterStudentId,
      netPayCents: 2_000,
    })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({ balanceCents: 1_000, status: 'active' })

    // Second deposit hits goal → complete; third should skip on-deposit
    await t.mutation(internal.features.banking.creditNetPay, {
      rosterStudentId,
      netPayCents: 1_000,
    })

    expect(
      await student.client.query(api.features.vaults.getMyVault, {
        vaultId: vault._id,
      })
    ).toMatchObject({ balanceCents: 2_000, status: 'complete' })

    expect(
      await t.mutation(internal.features.banking.creditNetPay, {
        rosterStudentId,
        netPayCents: 500,
      })
    ).toMatchObject({
      checkingCents: 1_500, // 1000 + 0 + 500 (no vault cut, unset split)
      vaultsTotalCents: 2_000,
      savingsUnallocatedCents: 0,
    })
  })

  test('rejects invalid amounts and inactive roster students', async () => {
    const t = initConvexTest()
    const { rosterStudentId } = await setupActiveStudent(t)

    await expect(
      t.mutation(internal.features.banking.creditNetPay, {
        rosterStudentId,
        netPayCents: 0,
      })
    ).rejects.toThrow(/positive integer/)

    const { teacher, organizationId } = await setupDevTeacherClassroom(t, {
      email: 'teacher-pipeline@ofy.org',
    })
    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'pending-pipeline@ofy.org',
        externalStudentId: 9401,
        grade: 7,
      }
    )
    const pendingId = await t.run(async ctx => {
      const roster = await ctx.db
        .query('rosterStudents')
        .withIndex('by_invitationId', q =>
          q.eq('invitationId', invited.invitationId)
        )
        .unique()
      return roster!._id
    })

    await expect(
      t.mutation(internal.features.banking.creditNetPay, {
        rosterStudentId: pendingId,
        netPayCents: 100,
      })
    ).rejects.toThrow(/Active student account required/)
  })
})

async function ledgerForStudent(
  t: ConvexTest,
  rosterStudentId: Id<'rosterStudents'>
) {
  return await t.run(async ctx => {
    return await ctx.db
      .query('ledgerEntries')
      .withIndex('by_rosterStudent_createdAt', q =>
        q.eq('rosterStudentId', rosterStudentId)
      )
      .collect()
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
  const email = options.email ?? 'pipeline-student@ofy.org'
  const displayName = options.displayName ?? 'Pipeline Kid'
  const externalStudentId = options.externalStudentId ?? 9101

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
    organizationId: classroom.organizationId,
    rosterStudentId,
  }
}
