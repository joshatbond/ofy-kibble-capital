import { afterEach, describe, expect, test, vi } from 'vitest'

import { api, internal } from '../../_generated/api'
import {
  asAuthedUser,
  initConvexTest,
  setupDevTeacherClassroom,
} from '../../test.setup'

import { incrementUnviewedPaystubCount } from './studentPaystubs'

import type { Id } from '../../_generated/dataModel'
import type { ConvexTest } from '../../test.setup'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('student paystub APIs', () => {
  test('rejects unauthenticated list, count, get, and mark', async () => {
    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'auth-check@ofy.org',
      externalStudentId: 4400,
    })
    const paystubId = await postOnePaystub(t, ctx)

    await expect(
      t.query(api.features.payroll.listMyPaystubs, {
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).rejects.toThrow(/Sign in to continue/)

    await expect(
      t.query(api.features.payroll.countMyUnviewedPaystubs, {})
    ).rejects.toThrow(/Sign in to continue/)

    await expect(
      t.query(api.features.payroll.getMyPaystub, { paystubId })
    ).rejects.toThrow(/Sign in to continue/)

    await expect(
      t.mutation(api.features.payroll.markMyPaystubViewed, { paystubId })
    ).rejects.toThrow(/Sign in to continue/)
  })

  test('no-active-roster get and mark return null; list and count empty', async () => {
    const t = initConvexTest()
    const stranger = await asAuthedUser(t, {
      email: 'no-roster@ofy.org',
      studentApp: 'kibble',
    })

    expect(
      await stranger.client.query(api.features.payroll.listMyPaystubs, {
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).toEqual({ page: [], isDone: true, continueCursor: '' })

    expect(
      await stranger.client.query(api.features.payroll.countMyUnviewedPaystubs, {})
    ).toBe(0)

    expect(
      await stranger.client.query(api.features.payroll.getMyPaystub, {
        paystubId: 'not-a-real-paystub-id',
      })
    ).toBeNull()

    expect(
      await stranger.client.mutation(api.features.payroll.markMyPaystubViewed, {
        paystubId: 'not-a-real-paystub-id',
      })
    ).toBeNull()
  })

  test('revoked roster get and mark return null', async () => {
    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'revoked-student@ofy.org',
      externalStudentId: 4402,
    })
    const paystubId = await postOnePaystub(t, ctx)

    await t.run(async db => {
      await db.db.patch('rosterStudents', ctx.rosterStudentId, {
        status: 'revoked',
      })
    })

    expect(
      await ctx.student.client.query(api.features.payroll.getMyPaystub, {
        paystubId,
      })
    ).toBeNull()

    expect(
      await ctx.student.client.mutation(api.features.payroll.markMyPaystubViewed, {
        paystubId,
      })
    ).toBeNull()

    expect(
      await ctx.student.client.query(api.features.payroll.listMyPaystubs, {
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).toEqual({ page: [], isDone: true, continueCursor: '' })

    expect(
      await ctx.student.client.query(
        api.features.payroll.countMyUnviewedPaystubs,
        {}
      )
    ).toBe(0)
  })

  test('malformed, deleted, and cross-student IDs all return null', async () => {
    const t = initConvexTest()
    const owner = await setupActiveStudent(t, {
      email: 'owner@ofy.org',
      externalStudentId: 4410,
    })
    const other = await setupActiveStudent(t, {
      email: 'other@ofy.org',
      externalStudentId: 4411,
      organizationId: owner.organizationId,
      teacher: owner.teacher,
    })
    const paystubId = await postOnePaystub(t, owner)
    const deletedId = await createThenDeletePaystub(t, owner)

    for (const id of ['not-a-real-paystub-id', '!!!', deletedId]) {
      expect(
        await owner.student.client.query(api.features.payroll.getMyPaystub, {
          paystubId: id,
        })
      ).toBeNull()
      expect(
        await owner.student.client.mutation(
          api.features.payroll.markMyPaystubViewed,
          { paystubId: id }
        )
      ).toBeNull()
    }

    expect(
      await other.student.client.query(api.features.payroll.getMyPaystub, {
        paystubId,
      })
    ).toBeNull()
    expect(
      await other.student.client.mutation(
        api.features.payroll.markMyPaystubViewed,
        { paystubId }
      )
    ).toBeNull()

    expect(await unreadCountOnRoster(t, owner.rosterStudentId)).toBe(1)
  })

  test('throws when a paystub references a missing pay period', async () => {
    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'orphan-period@ofy.org',
      externalStudentId: 4413,
    })
    const paystubId = await postOnePaystub(t, ctx)

    await t.run(async dbCtx => {
      const stub = await dbCtx.db.get('paystubs', paystubId)
      expect(stub).not.toBeNull()
      await dbCtx.db.delete('payPeriods', stub!.payPeriodId)
    })

    await expect(
      ctx.student.client.query(api.features.payroll.getMyPaystub, { paystubId })
    ).rejects.toThrow(/Could not load paystub/)

    await expect(
      ctx.student.client.query(api.features.payroll.listMyPaystubs, {
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).rejects.toThrow(/Could not load paystubs/)
  })

  test('mark-viewed is idempotent, preserves viewedAt, and decrements once', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 6, 14, 16, 0, 0))

    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'viewed@ofy.org',
      externalStudentId: 4414,
    })
    const paystubId = await postOnePaystub(t, ctx)

    expect(
      await ctx.student.client.query(
        api.features.payroll.countMyUnviewedPaystubs,
        {}
      )
    ).toBe(1)

    const first = await ctx.student.client.mutation(
      api.features.payroll.markMyPaystubViewed,
      { paystubId }
    )
    expect(first?.isNew).toBe(false)
    expect(
      await ctx.student.client.query(
        api.features.payroll.countMyUnviewedPaystubs,
        {}
      )
    ).toBe(0)

    const viewedAtAfterFirst = await t.run(async dbCtx => {
      const stub = await dbCtx.db.get('paystubs', paystubId)
      return stub?.viewedAt
    })
    expect(viewedAtAfterFirst).toBe(Date.UTC(2026, 6, 14, 16, 0, 0))

    vi.setSystemTime(Date.UTC(2026, 6, 14, 18, 0, 0))

    const second = await ctx.student.client.mutation(
      api.features.payroll.markMyPaystubViewed,
      { paystubId }
    )
    expect(second?.isNew).toBe(false)

    const viewedAtAfterSecond = await t.run(async dbCtx => {
      const stub = await dbCtx.db.get('paystubs', paystubId)
      return stub?.viewedAt
    })
    expect(viewedAtAfterSecond).toBe(viewedAtAfterFirst)
    expect(
      await ctx.student.client.query(
        api.features.payroll.countMyUnviewedPaystubs,
        {}
      )
    ).toBe(0)
  })

  test('lists newest first with cursor pagination', async () => {
    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'paged@ofy.org',
      externalStudentId: 4415,
    })
    await postOnePaystub(t, ctx)
    await seedExtraPaystubs(t, ctx.rosterStudentId, 11)

    const page1 = await ctx.student.client.query(
      api.features.payroll.listMyPaystubs,
      { paginationOpts: { numItems: 10, cursor: null } }
    )
    expect(page1.page).toHaveLength(10)
    expect(page1.isDone).toBe(false)

    for (let i = 1; i < page1.page.length; i++) {
      const newer = page1.page[i - 1]
      const older = page1.page[i]
      expect(newer.createdAt).toBeGreaterThanOrEqual(older.createdAt)
    }

    const page2 = await ctx.student.client.query(
      api.features.payroll.listMyPaystubs,
      {
        paginationOpts: {
          numItems: 10,
          cursor: page1.continueCursor,
        },
      }
    )
    expect(page2.page).toHaveLength(2)
    expect(page2.isDone).toBe(true)

    const ids = new Set([
      ...page1.page.map(s => s._id),
      ...page2.page.map(s => s._id),
    ])
    expect(ids.size).toBe(12)
  })

  test('unread counter starts at 0 and tracks create, multi-create, and mark-viewed', async () => {
    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'counter@ofy.org',
      externalStudentId: 4416,
    })

    expect(await unreadCountOnRoster(t, ctx.rosterStudentId)).toBe(0)
    expect(
      await ctx.student.client.query(
        api.features.payroll.countMyUnviewedPaystubs,
        {}
      )
    ).toBe(0)

    const paystubId = await postOnePaystub(t, ctx)
    expect(await unreadCountOnRoster(t, ctx.rosterStudentId)).toBe(1)

    await seedExtraPaystubs(t, ctx.rosterStudentId, 2)
    expect(await unreadCountOnRoster(t, ctx.rosterStudentId)).toBe(3)

    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 6, 14, 16, 0, 0))
    await ctx.student.client.mutation(api.features.payroll.markMyPaystubViewed, {
      paystubId,
    })
    expect(await unreadCountOnRoster(t, ctx.rosterStudentId)).toBe(2)

    await ctx.student.client.mutation(api.features.payroll.markMyPaystubViewed, {
      paystubId,
    })
    expect(await unreadCountOnRoster(t, ctx.rosterStudentId)).toBe(2)
  })

  test('detail includes all withholding lines', async () => {
    const t = initConvexTest()
    const ctx = await setupActiveStudent(t, {
      email: 'withholding@ofy.org',
      externalStudentId: 4417,
    })
    const paystubId = await postOnePaystub(t, ctx)

    const detail = await ctx.student.client.query(
      api.features.payroll.getMyPaystub,
      { paystubId }
    )
    expect(detail).toMatchObject({
      federalIncomeTaxCents: expect.any(Number),
      californiaIncomeTaxCents: expect.any(Number),
      socialSecurityCents: expect.any(Number),
      medicareCents: expect.any(Number),
      caSdiCents: expect.any(Number),
    })
    expect(detail!.federalIncomeTaxCents).toBeGreaterThan(0)
    expect(detail!.isNew).toBe(true)
  })
})

async function unreadCountOnRoster(
  t: ConvexTest,
  rosterStudentId: Id<'rosterStudents'>
): Promise<number> {
  return await t.run(async ctx => {
    const roster = await ctx.db.get('rosterStudents', rosterStudentId)
    if (roster === null) {
      throw new Error('roster missing')
    }
    return roster.unviewedPaystubCount
  })
}

async function setupActiveStudent(
  t: ConvexTest,
  options: {
    email: string
    externalStudentId: number
    organizationId?: string
    teacher?: Awaited<ReturnType<typeof setupDevTeacherClassroom>>['teacher']
  }
): Promise<ActiveStudentContext> {
  vi.stubEnv('SITE_URL', 'https://app.example.com')
  vi.stubEnv('DEV_PASSWORD_AUTH', '1')
  vi.stubEnv('INVITE_DEV_RELAXED', '1')

  const classroom =
    options.organizationId !== undefined && options.teacher !== undefined
      ? {
          teacher: options.teacher,
          organizationId: options.organizationId,
        }
      : await setupDevTeacherClassroom(t, {
          email: `teacher-for-${options.email}`,
        })

  const invited = await classroom.teacher.client.mutation(
    api.features.invitations.inviteStudent,
    {
      organizationId: classroom.organizationId,
      email: options.email,
      externalStudentId: options.externalStudentId,
      grade: 7,
      displayName: options.email,
    }
  )

  const student = await asAuthedUser(t, {
    email: options.email,
    name: options.email,
    studentApp: 'kibble',
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
    return roster!._id
  })

  return {
    teacher: classroom.teacher,
    student,
    organizationId: classroom.organizationId,
    rosterStudentId,
  }
}

async function postOnePaystub(
  t: ConvexTest,
  ctx: ActiveStudentContext
): Promise<Id<'paystubs'>> {
  const period = await t.mutation(
    internal.features.payrollTesting.ensureCurrentPayPeriod,
    {
      organizationId: ctx.organizationId,
      nowMs: Date.UTC(2026, 6, 14, 15, 0, 0),
    }
  )

  await t.mutation(internal.features.payrollTesting.runPayPeriod, {
    organizationId: ctx.organizationId,
    payPeriodId: period._id,
    nowMs: Date.UTC(2026, 6, 14, 15, 30, 0),
  })

  return await t.run(async dbCtx => {
    const stub = await dbCtx.db
      .query('paystubs')
      .withIndex('by_rosterStudent_createdAt', q =>
        q.eq('rosterStudentId', ctx.rosterStudentId)
      )
      .order('desc')
      .first()
    if (stub === null) {
      throw new Error('expected paystub after pay run')
    }
    return stub._id
  })
}

async function createThenDeletePaystub(
  t: ConvexTest,
  ctx: ActiveStudentContext
): Promise<Id<'paystubs'>> {
  return await t.run(async db => {
    const existing = await db.db
      .query('paystubs')
      .withIndex('by_rosterStudentId', q =>
        q.eq('rosterStudentId', ctx.rosterStudentId)
      )
      .first()
    if (existing === null) {
      throw new Error('expected an existing stub to clone')
    }
    const {
      _id: _id,
      _creationTime: _creationTime,
      viewedAt: _viewedAt,
      ...fields
    } = existing
    const stubId = await db.db.insert('paystubs', {
      ...fields,
      createdAt: existing.createdAt - 1,
    })
    await db.db.delete('paystubs', stubId)
    return stubId
  })
}

async function seedExtraPaystubs(
  t: ConvexTest,
  rosterStudentId: Id<'rosterStudents'>,
  count: number
) {
  await t.run(async ctx => {
    const existing = await ctx.db
      .query('paystubs')
      .withIndex('by_rosterStudent_createdAt', q =>
        q.eq('rosterStudentId', rosterStudentId)
      )
      .order('desc')
      .first()
    if (existing === null) {
      throw new Error('expected a seed stub')
    }

    for (let i = 1; i <= count; i++) {
      const {
        _id: _id,
        _creationTime: _creationTime,
        viewedAt: _viewedAt,
        ...fields
      } = existing
      await ctx.db.insert('paystubs', {
        ...fields,
        createdAt: existing.createdAt - i * 60_000,
      })
      await incrementUnviewedPaystubCount(ctx, rosterStudentId)
    }
  })
}

type ActiveStudentContext = {
  teacher: Awaited<ReturnType<typeof setupDevTeacherClassroom>>['teacher']
  student: Awaited<ReturnType<typeof asAuthedUser>>
  organizationId: string
  rosterStudentId: Id<'rosterStudents'>
}
