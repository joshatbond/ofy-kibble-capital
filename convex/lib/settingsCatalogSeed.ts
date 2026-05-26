import { V1_REGION_SETTINGS, V1_SCHOOL_SITE_SETTINGS } from './settingsDefaults'
import { assertPaydayNoticeLeadDays } from './settingsValues'

import type { SettingsValues } from './settingsValues'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

function validateSettings(values: SettingsValues): void {
  assertPaydayNoticeLeadDays(values.paydayNoticeLeadDays)
  if (values.vaultCap < 1) {
    throw new Error('Vault cap must be at least 1.')
  }
}

export async function ensureRegionSettings(
  ctx: MutationCtx,
  regionId: Id<'regions'>
): Promise<Id<'regionSettings'>> {
  const existing = await ctx.db
    .query('regionSettings')
    .withIndex('by_regionId', q => q.eq('regionId', regionId))
    .unique()

  if (existing) {
    return existing._id
  }

  const values = { ...V1_REGION_SETTINGS }
  validateSettings(values)

  return await ctx.db.insert('regionSettings', {
    regionId,
    ...values,
  })
}

export async function ensureSchoolSiteSettings(
  ctx: MutationCtx,
  schoolSiteId: Id<'schoolSites'>,
  siteSlug: string,
  regionId: Id<'regions'>
): Promise<Id<'schoolSiteSettings'>> {
  const existing = await ctx.db
    .query('schoolSiteSettings')
    .withIndex('by_schoolSiteId', q => q.eq('schoolSiteId', schoolSiteId))
    .unique()

  if (existing) {
    return existing._id
  }

  const regionSettings = await ctx.db
    .query('regionSettings')
    .withIndex('by_regionId', q => q.eq('regionId', regionId))
    .unique()

  if (!regionSettings) {
    throw new Error('Region settings must exist before school site settings.')
  }

  const regionValues = regionSettings
  const sitePartial = V1_SCHOOL_SITE_SETTINGS[siteSlug] ?? {}
  const values: SettingsValues = { ...regionValues, ...sitePartial }
  validateSettings(values)

  return await ctx.db.insert('schoolSiteSettings', {
    schoolSiteId,
    ...values,
  })
}
