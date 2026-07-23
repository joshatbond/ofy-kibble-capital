import { describe, expect, test } from 'vitest'

import { api } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { V1_DEV_CLASSROOM } from '../../seed/catalogData'

describe('listTeacherClassrooms', () => {
  test('requires authentication', async () => {
    const t = initConvexTest()

    await expect(
      t.query(api.features.admin.context.listTeacherClassrooms, {})
    ).rejects.toThrow(/Not authenticated/)
  })

  test('returns empty for signed-in users without teacher membership', async () => {
    const t = initConvexTest()
    await setupDevTeacherClassroom(t)
    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })

    expect(
      await stranger.client.query(
        api.features.admin.context.listTeacherClassrooms,
        {}
      )
    ).toEqual([])
  })

  test('returns classrooms where the viewer is a teacher-role member', async () => {
    const t = initConvexTest()
    const { teacher, organizationId, classroom } =
      await setupDevTeacherClassroom(t, {
        email: 'teacher@ofy.org',
        name: 'Dev Teacher',
      })

    const classrooms = await teacher.client.query(
      api.features.admin.context.listTeacherClassrooms,
      {}
    )

    expect(classrooms).toEqual([
      expect.objectContaining({
        organizationId,
        classroomId: classroom.classroomId,
        classroomName: V1_DEV_CLASSROOM.name,
        siteSlug: V1_DEV_CLASSROOM.siteSlug,
        orgSlug: V1_DEV_CLASSROOM.orgSlug,
        organizationName: expect.any(String),
      }),
    ])
  })
})

describe('getTeacherClassroomContext', () => {
  test('requires authentication', async () => {
    const t = initConvexTest()

    await expect(
      t.query(api.features.admin.context.getTeacherClassroomContext, {})
    ).rejects.toThrow(/Not authenticated/)
  })

  test('returns null when the viewer has no teacher classrooms', async () => {
    const t = initConvexTest()
    await setupDevTeacherClassroom(t)
    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })

    expect(
      await stranger.client.query(
        api.features.admin.context.getTeacherClassroomContext,
        {}
      )
    ).toBeNull()
  })

  test('returns null when the viewer has no email', async () => {
    const t = initConvexTest()
    const { teacher } = await setupDevTeacherClassroom(t)

    await t.run(async ctx => {
      await ctx.db.patch('users', teacher.userId, { email: undefined })
    })

    expect(
      await teacher.client.query(
        api.features.admin.context.getTeacherClassroomContext,
        {}
      )
    ).toBeNull()
  })

  test('defaults to the first classroom and can select by orgSlug', async () => {
    const t = initConvexTest()
    const { teacher, organizationId, classroom } =
      await setupDevTeacherClassroom(t, {
        email: 'teacher@ofy.org',
        name: 'Dev Teacher',
      })

    await t.run(async ctx => {
      await ctx.db.patch('users', teacher.userId, {
        image: 'https://example.com/teacher.png',
      })
    })

    const defaultContext = await teacher.client.query(
      api.features.admin.context.getTeacherClassroomContext,
      {}
    )
    expect(defaultContext).toMatchObject({
      organizationId,
      classroomId: classroom.classroomId,
      orgSlug: V1_DEV_CLASSROOM.orgSlug,
      siteSlug: V1_DEV_CLASSROOM.siteSlug,
      classroomName: V1_DEV_CLASSROOM.name,
      viewerEmail: 'teacher@ofy.org',
      viewerName: 'Dev Teacher',
      viewerImage: 'https://example.com/teacher.png',
    })

    const bySlug = await teacher.client.query(
      api.features.admin.context.getTeacherClassroomContext,
      { orgSlug: V1_DEV_CLASSROOM.orgSlug }
    )
    expect(bySlug).toMatchObject({
      organizationId,
      orgSlug: V1_DEV_CLASSROOM.orgSlug,
    })

    expect(
      await teacher.client.query(
        api.features.admin.context.getTeacherClassroomContext,
        { orgSlug: 'does-not-exist' }
      )
    ).toBeNull()
  })
})

describe('listClassroomTeachers', () => {
  test('requires a teacher-role member of the organization', async () => {
    const t = initConvexTest()
    const { organizationId, teacher } = await setupDevTeacherClassroom(t)

    await expect(
      t.query(api.features.admin.context.listClassroomTeachers, {
        organizationId,
      })
    ).rejects.toThrow(/Not authenticated/)

    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })
    await expect(
      stranger.client.query(api.features.admin.context.listClassroomTeachers, {
        organizationId,
      })
    ).rejects.toThrow(/Teacher access required/)

    // Student members are not teacher-role.
    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'kid@ofy.org',
        externalStudentId: 7001,
        grade: 7,
      }
    )
    const student = await asAuthedUser(t, {
      email: 'kid@ofy.org',
      name: 'Kid',
    })
    await student.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: invited.invitationId }
    )

    await expect(
      student.client.query(api.features.admin.context.listClassroomTeachers, {
        organizationId,
      })
    ).rejects.toThrow(/Teacher access required/)
  })

  test('lists teacher-role members sorted by email and excludes students', async () => {
    const t = initConvexTest()
    const { organizationId, teacher } = await setupDevTeacherClassroom(t, {
      email: 'zeta@ofy.org',
      name: 'Zeta Teacher',
      role: 'teacher',
    })

    const coInvite = await teacher.client.mutation(
      api.features.invitations.inviteCoTeacher,
      {
        organizationId,
        email: 'alpha@ofy.org',
      }
    )
    const coTeacher = await asAuthedUser(t, {
      email: 'alpha@ofy.org',
      name: 'Alpha Teacher',
    })
    await coTeacher.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: coInvite.invitationId }
    )

    const studentInvite = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'kid@ofy.org',
        externalStudentId: 7002,
        grade: 8,
      }
    )
    const student = await asAuthedUser(t, {
      email: 'kid@ofy.org',
      name: 'Kid',
    })
    await student.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: studentInvite.invitationId }
    )

    const teachers = await teacher.client.query(
      api.features.admin.context.listClassroomTeachers,
      { organizationId }
    )

    expect(teachers.map(row => row.email)).toEqual([
      'alpha@ofy.org',
      'seed-operator@internal.ofy.local',
      'zeta@ofy.org',
    ])
    expect(teachers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: coTeacher.userId,
          email: 'alpha@ofy.org',
          name: 'Alpha Teacher',
          role: 'teacher',
        }),
        expect.objectContaining({
          email: 'seed-operator@internal.ofy.local',
          role: 'owner',
        }),
        expect.objectContaining({
          userId: teacher.userId,
          email: 'zeta@ofy.org',
          name: 'Zeta Teacher',
          role: 'teacher',
        }),
      ])
    )
    expect(teachers.some(row => row.email === 'kid@ofy.org')).toBe(false)
  })
})
