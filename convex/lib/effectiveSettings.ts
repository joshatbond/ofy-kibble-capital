import { mergeSettingsLayers } from './effectiveSettingsMerge'
import { settingsValuesValidator } from './settingsValues'

import type { SettingsValues } from './settingsValues'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

export { mergeSettingsLayers, settingsValuesValidator }

export async function getClassroomByOrganizationId(
  ctx: QueryCtx,
  organizationId: string
) {
  return await ctx.db
    .query('classrooms')
    .withIndex('by_organizationId', q => q.eq('organizationId', organizationId))
    .unique()
}

export async function loadSettingsStackForClassroom(
  ctx: QueryCtx,
  classroom: Doc<'classrooms'>
) {
  const site = await ctx.db
    .query('schoolSites')
    .withIndex('by_siteSlug', q => q.eq('siteSlug', classroom.siteSlug))
    .unique()
  if (!site) {
    throw new Error(`Unknown school site slug "${classroom.siteSlug}".`)
  }

  const region = await ctx.db.get('regions', site.regionId)
  if (!region) {
    throw new Error(`Region missing for site "${classroom.siteSlug}".`)
  }

  const regionSettings = await ctx.db
    .query('regionSettings')
    .withIndex('by_regionId', q => q.eq('regionId', region._id))
    .unique()
  if (!regionSettings) {
    throw new Error(`Region settings missing for "${region.slug}".`)
  }

  const siteSettings = await ctx.db
    .query('schoolSiteSettings')
    .withIndex('by_schoolSiteId', q => q.eq('schoolSiteId', site._id))
    .unique()
  if (!siteSettings) {
    throw new Error(`School site settings missing for "${site.siteSlug}".`)
  }

  const classSettings = await ctx.db
    .query('classSettings')
    .withIndex('by_organizationId', q =>
      q.eq('organizationId', classroom.organizationId)
    )
    .unique()

  return {
    region,
    site,
    regionSettings,
    siteSettings,
    classSettings,
  }
}

export async function resolveEffectiveSettings(
  ctx: QueryCtx,
  organizationId: string
): Promise<SettingsValues> {
  const classroom = await getClassroomByOrganizationId(ctx, organizationId)
  if (!classroom) {
    throw new Error(`No classroom for organization "${organizationId}".`)
  }

  const stack = await loadSettingsStackForClassroom(ctx, classroom)

  if (stack.classSettings) {
    return stack.classSettings
  }

  return mergeSettingsLayers(stack.regionSettings, stack.siteSettings, {})
}

export async function ensureClassSettingsSnapshot(
  ctx: MutationCtx,
  args: {
    organizationId: string
    classroomId: Id<'classrooms'>
    siteSlug: string
  }
): Promise<Id<'classSettings'>> {
  const existing = await ctx.db
    .query('classSettings')
    .withIndex('by_organizationId', q =>
      q.eq('organizationId', args.organizationId)
    )
    .unique()

  if (existing) {
    return existing._id
  }

  const classroom = await ctx.db.get('classrooms', args.classroomId)
  if (!classroom) {
    throw new Error('Classroom not found.')
  }

  const stack = await loadSettingsStackForClassroom(ctx, classroom)
  const snapshot = mergeSettingsLayers(
    stack.regionSettings,
    stack.siteSettings,
    {}
  )

  return await ctx.db.insert('classSettings', {
    organizationId: args.organizationId,
    classroomId: args.classroomId,
    ...snapshot,
  })
}
