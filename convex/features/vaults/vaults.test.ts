import { describe, expect, test } from 'vitest'

import { api } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
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
