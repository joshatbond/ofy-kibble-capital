import { orgScope } from '@djpanda/convex-tenants'

import { components } from '../_generated/api'
import { authz } from '../authz'

import {
  SEED_OPERATOR_EMAIL,
  V1_DEV_CLASSROOM,
  V1_REGION,
  V1_SCHOOL_SITES,
} from './catalogSeedData'
import { ensureClassSettingsSnapshot } from './effectiveSettings'
import {
  ensureRegionSettings,
  ensureSchoolSiteSettings,
} from './settingsCatalogSeed'
import { regionSlugFromSiteSlug } from './siteSlug'

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

export async function ensureSeedOperatorUser(
  ctx: MutationCtx
): Promise<Id<'users'>> {
  const existing = await ctx.db
    .query('users')
    .withIndex('email', q => q.eq('email', SEED_OPERATOR_EMAIL))
    .unique()

  if (existing) {
    return existing._id
  }

  return await ctx.db.insert('users', {
    email: SEED_OPERATOR_EMAIL,
    name: 'Seed operator',
    canCreateOrganization: true,
  })
}

export async function ensureRegion(
  ctx: MutationCtx,
  slug: string,
  name: string
): Promise<Id<'regions'>> {
  const existing = await ctx.db
    .query('regions')
    .withIndex('by_slug', q => q.eq('slug', slug))
    .unique()

  if (existing) {
    return existing._id
  }

  return await ctx.db.insert('regions', { slug, name })
}

export async function ensureSchoolSite(
  ctx: MutationCtx,
  siteSlug: string,
  name: string,
  regionId: Id<'regions'>
): Promise<Id<'schoolSites'>> {
  const existing = await ctx.db
    .query('schoolSites')
    .withIndex('by_siteSlug', q => q.eq('siteSlug', siteSlug))
    .unique()

  if (existing) {
    return existing._id
  }

  return await ctx.db.insert('schoolSites', { siteSlug, name, regionId })
}

export async function ensureDevClassroom(
  ctx: MutationCtx,
  operatorUserId: Id<'users'>
): Promise<{ organizationId: string; classroomId: Id<'classrooms'> }> {
  const existing = await ctx.db
    .query('classrooms')
    .withIndex('by_orgSlug', q => q.eq('orgSlug', V1_DEV_CLASSROOM.orgSlug))
    .unique()

  if (existing) {
    await ensureClassSettingsSnapshot(ctx, {
      organizationId: existing.organizationId,
      classroomId: existing._id,
      siteSlug: existing.siteSlug,
    })
    return {
      organizationId: existing.organizationId,
      classroomId: existing._id,
    }
  }

  const site = await ctx.db
    .query('schoolSites')
    .withIndex('by_siteSlug', q => q.eq('siteSlug', V1_DEV_CLASSROOM.siteSlug))
    .unique()

  if (!site) {
    throw new Error(
      `School site "${V1_DEV_CLASSROOM.siteSlug}" is missing — run catalog seed first.`
    )
  }

  const organizationId = await ctx.runMutation(
    components.tenants.organizations.createOrganization,
    {
      userId: operatorUserId,
      name: V1_DEV_CLASSROOM.name,
      slug: V1_DEV_CLASSROOM.orgSlug,
      metadata: {
        siteSlug: V1_DEV_CLASSROOM.siteSlug,
        kind: 'classroom',
      },
    }
  )

  await authz.assignRole(
    ctx,
    operatorUserId,
    'owner',
    orgScope(organizationId),
    undefined,
    operatorUserId
  )

  const classroomId = await ctx.db.insert('classrooms', {
    organizationId,
    siteSlug: V1_DEV_CLASSROOM.siteSlug,
    name: V1_DEV_CLASSROOM.name,
    orgSlug: V1_DEV_CLASSROOM.orgSlug,
  })

  await ensureClassSettingsSnapshot(ctx, {
    organizationId,
    classroomId,
    siteSlug: V1_DEV_CLASSROOM.siteSlug,
  })

  return { organizationId, classroomId }
}

export async function seedV1CatalogData(ctx: MutationCtx) {
  const operatorUserId = await ensureSeedOperatorUser(ctx)

  const regionId = await ensureRegion(ctx, V1_REGION.slug, V1_REGION.name)
  await ensureRegionSettings(ctx, regionId)

  const schoolSiteIds: Record<string, Id<'schoolSites'>> = {}
  for (const site of V1_SCHOOL_SITES) {
    const expectedRegion = regionSlugFromSiteSlug(site.siteSlug)
    if (expectedRegion !== V1_REGION.slug) {
      throw new Error(
        `Site slug "${site.siteSlug}" does not belong to region "${V1_REGION.slug}".`
      )
    }
    const schoolSiteId = await ensureSchoolSite(
      ctx,
      site.siteSlug,
      site.name,
      regionId
    )
    schoolSiteIds[site.siteSlug] = schoolSiteId
    await ensureSchoolSiteSettings(ctx, schoolSiteId, site.siteSlug, regionId)
  }

  const classroom = await ensureDevClassroom(ctx, operatorUserId)

  return {
    operatorUserId,
    regionId,
    schoolSiteIds,
    classroom,
  }
}
