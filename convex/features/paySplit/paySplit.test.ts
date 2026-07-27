import { describe, expect, test } from 'vitest'

import { api } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

import type { ConvexTest } from '../../test.setup'
import type { Id } from '../../_generated/dataModel'

describe('getMyPaySplit', () => {
  test('requires auth and returns null without an active roster', async () => {
    const t = initConvexTest()

    await expect(
      t.query(api.features.paySplit.getMyPaySplit, {})
    ).rejects.toThrow(/Not authenticated/)

    const stranger = await asAuthedUser(t, { email: 'stranger@ofy.org' })
    expect(
      await stranger.client.query(api.features.paySplit.getMyPaySplit, {})
    ).toBeNull()
  })

  test('returns unset defaults (100% checking) until configured', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    expect(
      await student.client.query(api.features.paySplit.getMyPaySplit, {})
    ).toEqual({
      savingsPercent: 0,
      checkingPercent: 100,
      isConfigured: false,
      updatedAt: null,
    })
  })
})

describe('setMyPaySplit', () => {
  test('requires auth and an active student', async () => {
    const t = initConvexTest()

    await expect(
      t.mutation(api.features.paySplit.setMyPaySplit, { savingsPercent: 40 })
    ).rejects.toThrow(/Not authenticated/)

    const { teacher } = await setupDevTeacherClassroom(t, {
      email: 'teacher-only@ofy.org',
    })
    await expect(
      teacher.client.mutation(api.features.paySplit.setMyPaySplit, {
        savingsPercent: 40,
      })
    ).rejects.toThrow(/Active student account required/)
  })

  test('rejects non-integer or out-of-range savings percents', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    await expect(
      student.client.mutation(api.features.paySplit.setMyPaySplit, {
        savingsPercent: 40.5,
      })
    ).rejects.toThrow(/integer from 0 to 100/)

    await expect(
      student.client.mutation(api.features.paySplit.setMyPaySplit, {
        savingsPercent: -1,
      })
    ).rejects.toThrow(/integer from 0 to 100/)

    await expect(
      student.client.mutation(api.features.paySplit.setMyPaySplit, {
        savingsPercent: 101,
      })
    ).rejects.toThrow(/integer from 0 to 100/)
  })

  test('sets and updates the student pay split', async () => {
    const t = initConvexTest()
    const { student } = await setupActiveStudent(t)

    const created = await student.client.mutation(
      api.features.paySplit.setMyPaySplit,
      { savingsPercent: 30 }
    )
    expect(created).toMatchObject({
      savingsPercent: 30,
      checkingPercent: 70,
      isConfigured: true,
    })
    expect(typeof created.updatedAt).toBe('number')

    expect(
      await student.client.query(api.features.paySplit.getMyPaySplit, {})
    ).toMatchObject({
      savingsPercent: 30,
      checkingPercent: 70,
      isConfigured: true,
    })

    const updated = await student.client.mutation(
      api.features.paySplit.setMyPaySplit,
      { savingsPercent: 0 }
    )
    expect(updated).toMatchObject({
      savingsPercent: 0,
      checkingPercent: 100,
      isConfigured: true,
    })

    const allInSavings = await student.client.mutation(
      api.features.paySplit.setMyPaySplit,
      { savingsPercent: 100 }
    )
    expect(allInSavings).toMatchObject({
      savingsPercent: 100,
      checkingPercent: 0,
      isConfigured: true,
    })
  })
})

describe('listClassroomPaySplits', () => {
  test('is teacher-only and lists effective splits for the classroom', async () => {
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

    await first.student.client.mutation(api.features.paySplit.setMyPaySplit, {
      savingsPercent: 25,
    })

    await expect(
      first.student.client.query(api.features.paySplit.listClassroomPaySplits, {
        organizationId: classroom.organizationId,
      })
    ).rejects.toThrow(/Teacher access required/)

    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })
    await expect(
      stranger.client.query(api.features.paySplit.listClassroomPaySplits, {
        organizationId: classroom.organizationId,
      })
    ).rejects.toThrow(/Teacher access required/)

    const rows = await classroom.teacher.client.query(
      api.features.paySplit.listClassroomPaySplits,
      { organizationId: classroom.organizationId }
    )

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rosterStudentId: first.rosterStudentId,
          studentDisplayName: 'Kid One',
          savingsPercent: 25,
          checkingPercent: 75,
          isConfigured: true,
        }),
        expect.objectContaining({
          rosterStudentId: second.rosterStudentId,
          studentDisplayName: 'Kid Two',
          savingsPercent: 0,
          checkingPercent: 100,
          isConfigured: false,
        }),
      ])
    )
  })

  test('requires auth', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)

    await expect(
      t.query(api.features.paySplit.listClassroomPaySplits, {
        organizationId,
      })
    ).rejects.toThrow(/Not authenticated/)
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
