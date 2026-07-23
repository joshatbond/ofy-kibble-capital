import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'
import { getBankAccountForStudent } from '../banking/accounts'

import {
  assertOfyOrgEmail,
  emailsMatch,
  isOfyOrgEmail,
  normalizeInviteEmail,
} from './policy'
import { generatePayToken, isPayTokenFormat } from './payToken'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('invitation policy helpers', () => {
  test('normalizes and validates @ofy.org emails outside relaxed mode', () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    expect(normalizeInviteEmail('  Kid@OFY.ORG ')).toBe('kid@ofy.org')
    expect(isOfyOrgEmail('kid@ofy.org')).toBe(true)
    expect(isOfyOrgEmail('kid@gmail.com')).toBe(false)
    expect(assertOfyOrgEmail('  Kid@OFY.ORG ')).toBe('kid@ofy.org')
    expect(() => assertOfyOrgEmail('kid@gmail.com')).toThrow(/@ofy\.org/)
    expect(emailsMatch('Kid@ofy.org', 'kid@ofy.org')).toBe(true)
  })
})

describe('pay token helpers', () => {
  test('generates 16-char uppercase hex tokens', () => {
    const token = generatePayToken()
    expect(isPayTokenFormat(token)).toBe(true)
    expect(isPayTokenFormat('not-a-token')).toBe(false)
    expect(isPayTokenFormat('0123456789ABCDEF')).toBe(true)
  })
})

describe('inviteStudent', () => {
  test('requires a signed-in teacher for the organization', async () => {
    const t = initConvexTest()
    const { organizationId } = await setupDevTeacherClassroom(t)
    const stranger = await asAuthedUser(t, { email: 'stranger@ofy.org' })

    await expect(
      t.mutation(api.features.invitations.inviteStudent, {
        organizationId,
        email: 'kid@ofy.org',
        externalStudentId: 1001,
        grade: 7,
      })
    ).rejects.toThrow(/must be signed in/)

    await expect(
      stranger.client.mutation(api.features.invitations.inviteStudent, {
        organizationId,
        email: 'kid@ofy.org',
        externalStudentId: 1001,
        grade: 7,
      })
    ).rejects.toThrow()
  })

  test('creates a pending roster row with bank accounts and a pay token', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: '  Kid@OFY.ORG ',
        displayName: ' Kid One ',
        externalStudentId: 1001,
        grade: 7,
      }
    )

    expect(invited).toMatchObject({
      inviteeIdentifier: 'kid@ofy.org',
      invitationId: expect.any(String),
      expiresAt: expect.any(Number),
    })

    const preview = await t.query(api.features.invitations.getInvitePreview, {
      invitationId: invited.invitationId,
    })
    expect(preview).toMatchObject({
      inviteeIdentifier: 'kid@ofy.org',
      role: 'student',
      status: 'pending',
      isExpired: false,
    })

    const roster = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    expect(roster).toHaveLength(1)
    expect(roster[0]).toMatchObject({
      email: 'kid@ofy.org',
      displayName: 'Kid One',
      resolvedName: 'Kid One',
      externalStudentId: 1001,
      grade: 7,
      status: 'pending',
      invitationId: invited.invitationId,
      invitationStatus: 'pending',
    })
    expect(isPayTokenFormat(roster[0]!.payToken)).toBe(true)

    const accounts = await t.run(async ctx => {
      const checking = await getBankAccountForStudent(
        ctx,
        roster[0]!.rosterStudentId,
        'checking'
      )
      const savings = await getBankAccountForStudent(
        ctx,
        roster[0]!.rosterStudentId,
        'savings'
      )
      return { checking, savings }
    })
    expect(accounts.checking).toMatchObject({ balanceCents: 0 })
    expect(accounts.savings).toMatchObject({ balanceCents: 0 })
  })

  test('rejects duplicate external student ids and non-ofy emails', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    await teacher.client.mutation(api.features.invitations.inviteStudent, {
      organizationId,
      email: 'first@ofy.org',
      externalStudentId: 1001,
      grade: 7,
    })

    await expect(
      teacher.client.mutation(api.features.invitations.inviteStudent, {
        organizationId,
        email: 'second@ofy.org',
        externalStudentId: 1001,
        grade: 8,
      })
    ).rejects.toThrow(/external ID 1001/)

    await expect(
      teacher.client.mutation(api.features.invitations.inviteStudent, {
        organizationId,
        email: 'kid@gmail.com',
        externalStudentId: 1002,
        grade: 7,
      })
    ).rejects.toThrow(/@ofy\.org/)
  })
})

describe('inviteCoTeacher and acceptClassroomInvitation', () => {
  test('student accept activates roster and redirects to kibble', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'kid@ofy.org',
        displayName: 'Roster Label',
        externalStudentId: 2001,
        grade: 8,
      }
    )

    const student = await asAuthedUser(t, {
      email: 'kid@ofy.org',
      // empty name so onInvitationAccepted can copy roster displayName
      name: '',
    })

    // asAuthedUser always sets a name — clear it for this activation side effect
    await t.run(async ctx => {
      await ctx.db.patch('users', student.userId, { name: undefined })
    })

    const accepted = await student.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: invited.invitationId }
    )
    expect(accepted).toEqual({
      role: 'student',
      redirectPath: '/kibble/',
    })

    const roster = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    expect(roster[0]).toMatchObject({
      status: 'active',
      userId: student.userId,
      resolvedName: 'Roster Label',
      invitationStatus: 'accepted',
    })

    const user = await t.run(async ctx => {
      return await ctx.db.get('users', student.userId)
    })
    expect(user?.name).toBe('Roster Label')

    // Idempotent re-accept
    const again = await student.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: invited.invitationId }
    )
    expect(again).toEqual({
      role: 'student',
      redirectPath: '/kibble/',
    })
  })

  test('co-teacher accept redirects to admin', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const invited = await teacher.client.mutation(
      api.features.invitations.inviteCoTeacher,
      {
        organizationId,
        email: 'coteacher@ofy.org',
      }
    )

    const coTeacher = await asAuthedUser(t, {
      email: 'coteacher@ofy.org',
      name: 'Co Teacher',
    })

    const accepted = await coTeacher.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: invited.invitationId }
    )
    expect(accepted).toEqual({
      role: 'teacher',
      redirectPath: '/admin/',
    })

    const roster = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    expect(roster).toEqual([])
  })

  test('accept rejects mismatch, revoke, and missing auth', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'kid@ofy.org',
        externalStudentId: 3001,
        grade: 7,
      }
    )

    await expect(
      t.mutation(api.features.invitations.acceptClassroomInvitation, {
        invitationId: invited.invitationId,
      })
    ).rejects.toThrow(/must be signed in/)

    const wrong = await asAuthedUser(t, { email: 'other@ofy.org' })
    await expect(
      wrong.client.mutation(api.features.invitations.acceptClassroomInvitation, {
        invitationId: invited.invitationId,
      })
    ).rejects.toThrow(/Sign in with kid@ofy\.org/)

    await teacher.client.mutation(
      api.features.invitations.revokeClassroomInvitation,
      {
        organizationId,
        invitationId: invited.invitationId,
      }
    )

    const kid = await asAuthedUser(t, { email: 'kid@ofy.org' })
    await expect(
      kid.client.mutation(api.features.invitations.acceptClassroomInvitation, {
        invitationId: invited.invitationId,
      })
    ).rejects.toThrow(/revoked/)

    const roster = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    expect(roster).toEqual([])
  })
})

describe('roster maintenance', () => {
  test('rotatePayToken issues a new unique token', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    await teacher.client.mutation(api.features.invitations.inviteStudent, {
      organizationId,
      email: 'kid@ofy.org',
      externalStudentId: 4001,
      grade: 7,
    })

    const before = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    const previous = before[0]!.payToken

    const rotated = await teacher.client.mutation(
      api.features.invitations.rotatePayToken,
      {
        organizationId,
        rosterStudentId: before[0]!.rosterStudentId,
      }
    )

    expect(isPayTokenFormat(rotated.payToken)).toBe(true)
    expect(rotated.payToken).not.toBe(previous)

    const after = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    expect(after[0]!.payToken).toBe(rotated.payToken)
  })

  test('resendClassroomInvitation refreshes expiry metadata', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    const invited = await teacher.client.mutation(
      api.features.invitations.inviteStudent,
      {
        organizationId,
        email: 'kid@ofy.org',
        externalStudentId: 5001,
        grade: 7,
      }
    )

    const resent = await teacher.client.mutation(
      api.features.invitations.resendClassroomInvitation,
      {
        organizationId,
        invitationId: invited.invitationId,
      }
    )

    expect(resent).toMatchObject({
      invitationId: invited.invitationId,
      inviteeIdentifier: 'kid@ofy.org',
      expiresAt: expect.any(Number),
    })
    expect(resent.expiresAt).toBeGreaterThan(Date.now())
  })

  test('viewerEmail returns the signed-in user email', async () => {
    const t = initConvexTest()
    const user = await asAuthedUser(t, { email: 'viewer@ofy.org' })

    expect(await t.query(api.features.invitations.viewerEmail, {})).toBeNull()
    expect(
      await user.client.query(api.features.invitations.viewerEmail, {})
    ).toBe('viewer@ofy.org')
  })

  test('listClassroomRoster is teacher-only', async () => {
    const t = initConvexTest()
    const { teacher, organizationId } = await setupDevTeacherClassroom(t)

    await teacher.client.mutation(api.features.invitations.inviteStudent, {
      organizationId,
      email: 'kid@ofy.org',
      externalStudentId: 6001,
      grade: 7,
    })

    const stranger = await asAuthedUser(t, { email: 'stranger@ofy.org' })
    await expect(
      stranger.client.query(api.features.invitations.listClassroomRoster, {
        organizationId,
      })
    ).rejects.toThrow(/Teacher access required/)

    const invited = await teacher.client.query(
      api.features.invitations.listClassroomRoster,
      { organizationId }
    )
    expect(invited).toHaveLength(1)

    const studentUser = await asAuthedUser(t, { email: 'kid@ofy.org' })
    // Accept so they are an org member with student role, then confirm roster stays teacher-only.
    await studentUser.client.mutation(
      api.features.invitations.acceptClassroomInvitation,
      { invitationId: invited[0]!.invitationId }
    )

    await expect(
      studentUser.client.query(api.features.invitations.listClassroomRoster, {
        organizationId,
      })
    ).rejects.toThrow(/Teacher access required/)
  })
})
