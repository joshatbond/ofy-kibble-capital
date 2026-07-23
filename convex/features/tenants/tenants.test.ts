import { afterEach, describe, expect, test, vi } from 'vitest'

import { api } from '../../_generated/api'
import { asAuthedUser, initConvexTest } from '../../test.setup'
import { requireTeacherForOrg } from '../auth/teacher'

import { isTeacherMemberRole } from './roles'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('tenants roles', () => {
  test('isTeacherMemberRole recognizes owner/admin/teacher only', () => {
    expect(isTeacherMemberRole('owner')).toBe(true)
    expect(isTeacherMemberRole('admin')).toBe(true)
    expect(isTeacherMemberRole('teacher')).toBe(true)
    expect(isTeacherMemberRole('student')).toBe(false)
    expect(isTeacherMemberRole('member')).toBe(false)
  })
})

describe('organizations.createOrganization', () => {
  test('requires sign-in and canCreateOrganization', async () => {
    const t = initConvexTest()

    await expect(
      t.mutation(api.features.organizations.createOrganization, {
        name: 'Room A',
        slug: 'room-a',
      })
    ).rejects.toThrow(/must be signed in/)

    const teacher = await asAuthedUser(t, {
      email: 'teacher@ofy.org',
      name: 'Teacher',
    })

    await expect(
      teacher.client.mutation(api.features.organizations.createOrganization, {
        name: 'Room A',
        slug: 'room-a',
      })
    ).rejects.toThrow(/do not have permission to create organizations/)
  })

  test('operator can create an org and becomes owner with permissions', async () => {
    const t = initConvexTest()
    const operator = await asAuthedUser(t, {
      email: 'operator@ofy.org',
      name: 'Operator',
      canCreateOrganization: true,
    })

    const organizationId = await operator.client.mutation(
      api.features.organizations.createOrganization,
      {
        name: 'Room A',
        slug: 'room-a',
      }
    )

    const orgs = await operator.client.query(
      api.features.tenants.listOrganizations,
      {}
    )
    expect(orgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: organizationId,
          name: 'Room A',
          slug: 'room-a',
          role: 'owner',
        }),
      ])
    )

    const member = await operator.client.query(
      api.features.tenants.getCurrentMember,
      { organizationId }
    )
    expect(member).toMatchObject({
      userId: operator.userId,
      role: 'owner',
    })

    const permission = await operator.client.query(
      api.features.tenants.checkPermission,
      {
        organizationId,
        permission: 'invitations:create',
      }
    )
    expect(permission.allowed).toBe(true)

    await t.run(async ctx => {
      await requireTeacherForOrg(
        ctx,
        operator.userId,
        organizationId,
        'invitations:create'
      )
    })
  })
})

describe('tenants invitation policy hooks', () => {
  test('inviteMember rejects non-@ofy.org emails outside local/dev relaxed mode', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { organizationId, operator } = await createOperatorOrg(t)

    await expect(
      operator.client.mutation(api.features.tenants.inviteMember, {
        organizationId,
        inviteeIdentifier: 'student@gmail.com',
        role: 'student',
      })
    ).rejects.toThrow(/@ofy\.org/)
  })

  test('invite + accept succeeds for matching @ofy.org email', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { organizationId, operator } = await createOperatorOrg(t)

    const invited = await operator.client.mutation(
      api.features.tenants.inviteMember,
      {
        organizationId,
        inviteeIdentifier: 'kid@ofy.org',
        role: 'student',
      }
    )

    const student = await asAuthedUser(t, {
      email: 'kid@ofy.org',
      name: 'Kid',
    })

    await student.client.mutation(api.features.tenants.acceptInvitation, {
      invitationId: invited.invitationId,
    })

    const member = await student.client.query(
      api.features.tenants.getCurrentMember,
      { organizationId }
    )
    expect(member).toMatchObject({
      userId: student.userId,
      role: 'student',
    })

    const permission = await student.client.query(
      api.features.tenants.checkPermission,
      {
        organizationId,
        permission: 'invitations:create',
      }
    )
    expect(permission.allowed).toBe(false)
  })

  test('acceptInvitation rejects email mismatch', async () => {
    vi.stubEnv('SITE_URL', 'https://app.example.com')
    vi.stubEnv('DEV_PASSWORD_AUTH', '')
    vi.stubEnv('INVITE_DEV_RELAXED', '')

    const t = initConvexTest()
    const { organizationId, operator } = await createOperatorOrg(t)

    const invited = await operator.client.mutation(
      api.features.tenants.inviteMember,
      {
        organizationId,
        inviteeIdentifier: 'kid@ofy.org',
        role: 'teacher',
      }
    )

    const wrongUser = await asAuthedUser(t, {
      email: 'other@ofy.org',
      name: 'Other',
    })

    await expect(
      wrongUser.client.mutation(api.features.tenants.acceptInvitation, {
        invitationId: invited.invitationId,
      })
    ).rejects.toThrow(/Sign in with kid@ofy\.org/)
  })
})

describe('tenants last-owner protection', () => {
  test('cannot demote the last owner', async () => {
    const t = initConvexTest()
    const { organizationId, operator } = await createOperatorOrg(t)

    await expect(
      operator.client.mutation(api.features.tenants.updateMemberRole, {
        organizationId,
        memberUserId: operator.userId,
        role: 'teacher',
      })
    ).rejects.toThrow(/Cannot remove the last owner/)
  })
})

describe('tenants membership isolation', () => {
  test('non-members are denied org permissions', async () => {
    const t = initConvexTest()
    const { organizationId } = await createOperatorOrg(t)
    const stranger = await asAuthedUser(t, {
      email: 'stranger@ofy.org',
      name: 'Stranger',
    })

    const permission = await stranger.client.query(
      api.features.tenants.checkPermission,
      {
        organizationId,
        permission: 'organizations:read',
      }
    )
    expect(permission.allowed).toBe(false)

    await expect(
      t.run(async ctx => {
        await requireTeacherForOrg(
          ctx,
          stranger.userId,
          organizationId,
          'invitations:create'
        )
      })
    ).rejects.toThrow(/Teacher access required/)
  })
})

async function createOperatorOrg(t: ReturnType<typeof initConvexTest>) {
  const operator = await asAuthedUser(t, {
    email: 'operator@ofy.org',
    name: 'Operator',
    canCreateOrganization: true,
  })

  const organizationId = await operator.client.mutation(
    api.features.organizations.createOrganization,
    {
      name: 'Room A',
      slug: `room-${Math.random().toString(36).slice(2, 8)}`,
    }
  )

  return { operator, organizationId }
}
