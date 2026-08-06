import {
  V1_BASE_SETTINGS,
  V1_REGION_SETTINGS,
  V1_SCHOOL_SITE_SETTINGS,
} from '../features/settings/defaults'
import {
  assertPaySchedule,
  assertPaydayNoticeLeadDays,
  pickSettingsValues,
} from '../features/settings/values'

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

  const regionValues = pickSettingsValues(regionSettings)
  const sitePartial = V1_SCHOOL_SITE_SETTINGS[siteSlug] ?? {}
  const values: SettingsValues = { ...regionValues, ...sitePartial }
  assertCatalogSettings(values)

  return await ctx.db.insert('schoolSiteSettings', {
    schoolSiteId,
    ...values,
  })
}

/**
 * Repair catalog/classroom pay schedules that cannot produce a payday
 * (e.g. biweekly weekday ≠ firstPayDate weekday from older seeds).
 */
export async function repairInconsistentPaySchedules(
  ctx: MutationCtx
): Promise<{ patched: number }> {
  const canonical = V1_BASE_SETTINGS.paySchedule
  let patched = 0

  const regionRows = await ctx.db.query('regionSettings').collect()
  for (const row of regionRows) {
    if (!isInconsistentPaySchedule(row.paySchedule)) {
      continue
    }
    await ctx.db.patch('regionSettings', row._id, { paySchedule: canonical })
    patched += 1
  }

  const siteRows = await ctx.db.query('schoolSiteSettings').collect()
  for (const row of siteRows) {
    if (!isInconsistentPaySchedule(row.paySchedule)) {
      continue
    }
    await ctx.db.patch('schoolSiteSettings', row._id, {
      paySchedule: canonical,
    })
    patched += 1
  }

  const classRows = await ctx.db.query('classSettings').collect()
  for (const row of classRows) {
    if (!isInconsistentPaySchedule(row.paySchedule)) {
      continue
    }
    await ctx.db.patch('classSettings', row._id, { paySchedule: canonical })
    patched += 1
  }

  return { patched }
}

/** Product constraints for settings rows written during catalog seed. */
function assertCatalogSettings(values: SettingsValues): void {
  assertPaydayNoticeLeadDays(values.paydayNoticeLeadDays)
  assertPaySchedule(values.paySchedule)
  if (values.vaultCap < 1) {
    throw new Error('Vault cap must be at least 1.')
  }
}

function isInconsistentPaySchedule(
  schedule: SettingsValues['paySchedule']
): boolean {
  try {
    assertPaySchedule(schedule)
    return false
  } catch {
    return true
  }
}
