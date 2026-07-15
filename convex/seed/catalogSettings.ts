import {
  V1_REGION_SETTINGS,
  V1_SCHOOL_SITE_SETTINGS,
} from '../features/settings/defaults'
import { assertPaydayNoticeLeadDays } from '../features/settings/values'

import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { SettingsValues } from '../features/settings/values'

/**
 * Insert region-level default settings if missing (v1 product defaults).
 * Idempotent — returns the existing `regionSettings` row when present.
 */
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
  assertCatalogSettings(values)

  return await ctx.db.insert('regionSettings', {
    regionId,
    ...values,
  })
}

/**
 * Insert school-site settings if missing, merging region defaults with any
 * per-site overrides from {@link V1_SCHOOL_SITE_SETTINGS}.
 * Idempotent — returns the existing row when present.
 */
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

  if (existing) return existing._id

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
  assertCatalogSettings(values)

  return await ctx.db.insert('schoolSiteSettings', {
    schoolSiteId,
    ...values,
  })
}

/** Product constraints for settings rows written during catalog seed. */
function assertCatalogSettings(values: SettingsValues): void {
  assertPaydayNoticeLeadDays(values.paydayNoticeLeadDays)
  if (values.vaultCap < 1) {
    throw new Error('Vault cap must be at least 1.')
  }
}
