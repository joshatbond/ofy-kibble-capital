import { describe, expect, test } from 'vitest'

import { api, internal } from '../_generated/api'
import { regionSlugFromSiteSlug } from '../features/catalog/siteSlug'
import {
  asAuthedUser,
  initConvexTest,
  seedV1Catalog,
} from '../test.setup'

import {
  OPERATOR_EMAIL,
  V1_DEV_CLASSROOM,
  V1_REGION,
  V1_SCHOOL_SITES,
} from './catalogData'

describe('regionSlugFromSiteSlug', () => {
  test('returns the region prefix before the first dash', () => {
    expect(regionSlugFromSiteSlug('ofysb-mv')).toBe('ofysb')
    expect(regionSlugFromSiteSlug('ofysb-sb1')).toBe('ofysb')
  })

  test('rejects slugs without a region-site dash', () => {
    expect(() => regionSlugFromSiteSlug('ofysb')).toThrow(
      /expected format \{region\}-\{site\}/
    )
    expect(() => regionSlugFromSiteSlug('-mv')).toThrow(
      /expected format \{region\}-\{site\}/
    )
    expect(() => regionSlugFromSiteSlug('')).toThrow(
      /expected format \{region\}-\{site\}/
    )
  })
})

describe('seedV1Catalog', () => {
  test('bootstraps operator, region, sites, settings, and dev classroom', async () => {
    const t = initConvexTest()
    const result = await seedV1Catalog(t)

    expect(result.classroom).toMatchObject({
      organizationId: expect.any(String),
      classroomId: expect.any(String),
    })

    const operator = await t.run(async ctx => {
      return await ctx.db.get('users', result.operatorUserId)
    })
    expect(operator).toMatchObject({
      email: OPERATOR_EMAIL,
      canCreateOrganization: true,
    })

    const region = await t.run(async ctx => {
      return await ctx.db.get('regions', result.regionId)
    })
    expect(region).toMatchObject({
      slug: V1_REGION.slug,
      name: V1_REGION.name,
    })

    for (const site of V1_SCHOOL_SITES) {
      expect(result.schoolSiteIds[site.siteSlug]).toBeDefined()

      const schoolSite = await t.run(async ctx => {
        return await ctx.db.get(
          'schoolSites',
          result.schoolSiteIds[site.siteSlug]!
        )
      })
      expect(schoolSite).toMatchObject({
        siteSlug: site.siteSlug,
        name: site.name,
        regionId: result.regionId,
      })

      const siteSettings = await t.run(async ctx => {
        return await ctx.db
          .query('schoolSiteSettings')
          .withIndex('by_schoolSiteId', q =>
            q.eq('schoolSiteId', result.schoolSiteIds[site.siteSlug]!)
          )
          .unique()
      })
      expect(siteSettings).toMatchObject({
        vaultCap: 5,
        currencyLabel: 'Bark Bucks',
        savingsApyPercent: 3.3,
      })
    }

    const classroom = await t.run(async ctx => {
      return await ctx.db.get('classrooms', result.classroom.classroomId)
    })
    expect(classroom).toMatchObject({
      organizationId: result.classroom.organizationId,
      siteSlug: V1_DEV_CLASSROOM.siteSlug,
      orgSlug: V1_DEV_CLASSROOM.orgSlug,
      name: V1_DEV_CLASSROOM.name,
    })

    const classSettings = await t.run(async ctx => {
      return await ctx.db
        .query('classSettings')
        .withIndex('by_organizationId', q =>
          q.eq('organizationId', result.classroom.organizationId)
        )
        .unique()
    })
    expect(classSettings).toMatchObject({
      classroomId: result.classroom.classroomId,
      vaultCap: 5,
    })

    const regionSettings = await t.run(async ctx => {
      return await ctx.db
        .query('regionSettings')
        .withIndex('by_regionId', q => q.eq('regionId', result.regionId))
        .unique()
    })
    expect(regionSettings).toMatchObject({
      regionId: result.regionId,
      vaultCap: 5,
    })
  })

  test('is idempotent across repeated runs', async () => {
    const t = initConvexTest()
    const first = await seedV1Catalog(t)
    const second = await seedV1Catalog(t)

    expect(second).toEqual(first)

    const regionCount = await t.run(async ctx => {
      return (await ctx.db.query('regions').collect()).length
    })
    const siteCount = await t.run(async ctx => {
      return (await ctx.db.query('schoolSites').collect()).length
    })
    const classroomCount = await t.run(async ctx => {
      return (await ctx.db.query('classrooms').collect()).length
    })

    expect(regionCount).toBe(1)
    expect(siteCount).toBe(V1_SCHOOL_SITES.length)
    expect(classroomCount).toBe(1)
  })
})

describe('linkDevTeacherByEmail', () => {
  test('requires the catalog classroom and an existing user row', async () => {
    const t = initConvexTest()

    await expect(
      t.mutation(internal.seed.index.linkDevTeacherByEmail, {
        email: 'teacher@ofy.org',
      })
    ).rejects.toThrow(/Dev classroom is missing/)

    await seedV1Catalog(t)

    await expect(
      t.mutation(internal.seed.index.linkDevTeacherByEmail, {
        email: 'teacher@ofy.org',
      })
    ).rejects.toThrow(/No users row for "teacher@ofy.org"/)
  })

  test('links an existing user into the dev classroom with the requested role', async () => {
    const t = initConvexTest()
    const seeded = await seedV1Catalog(t)
    const teacher = await asAuthedUser(t, {
      email: 'teacher@ofy.org',
      name: 'Dev Teacher',
    })

    const linked = await t.mutation(internal.seed.index.linkDevTeacherByEmail, {
      email: 'teacher@ofy.org',
      role: 'teacher',
    })

    expect(linked).toMatchObject({
      organizationId: seeded.classroom.organizationId,
      userId: teacher.userId,
      role: 'teacher',
    })

    const member = await teacher.client.query(
      api.features.tenants.getCurrentMember,
      { organizationId: seeded.classroom.organizationId }
    )
    expect(member).toMatchObject({
      userId: teacher.userId,
      role: 'teacher',
    })

    const again = await t.mutation(internal.seed.index.linkDevTeacherByEmail, {
      email: 'teacher@ofy.org',
      role: 'teacher',
    })
    expect(again).toMatchObject({
      organizationId: seeded.classroom.organizationId,
      userId: teacher.userId,
      role: 'teacher',
    })
  })
})
