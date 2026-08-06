import { assertBiweeklyFirstPayDateMatchesWeekday } from '../features/payroll/dates'
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

import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { SettingsValues } from '../features/settings/values'

/**
 * Bound for in-transaction full scans (seed / small deploys). Avoids `.paginate()`
 * so multiple tables can be read in one mutation.
 */
const SYNC_TABLE_TAKE_LIMIT = 500

const REPAIR_TABLES = [
  'regionSettings',
  'schoolSiteSettings',
  'classSettings',
] as const

/** Max settings rows examined (and optionally patched) per repair transaction. */
export const PAY_SCHEDULE_REPAIR_BATCH_SIZE = 50

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
 * Repair legacy biweekly firstPayDate/weekday mismatches in a single
 * paginated page of one settings table. Convex allows only one `.paginate()`
 * per mutation — schedule again when `done` is false.
 */
export async function repairInconsistentPaySchedulesBatch(
  ctx: MutationCtx,
  args: {
    cursor?: PayScheduleRepairCursor | null
    batchSize?: number
  } = {}
): Promise<PayScheduleRepairBatchResult> {
  const batchSize = args.batchSize ?? PAY_SCHEDULE_REPAIR_BATCH_SIZE
  const canonical = V1_BASE_SETTINGS.paySchedule
  const cursor: PayScheduleRepairCursor = args.cursor ?? {
    table: 'regionSettings',
    tableCursor: null,
  }

  const page = await paginateSettingsTable(ctx, cursor, batchSize)
  let patched = 0

  for (const row of page.page) {
    if (!isLegacyBiweeklyWeekdayMismatch(row.paySchedule)) {
      continue
    }
    await patchPaySchedule(ctx, cursor.table, row._id, canonical)
    patched += 1
  }

  if (!page.isDone) {
    return {
      patched,
      examined: page.page.length,
      done: false,
      continueCursor: {
        table: cursor.table,
        tableCursor: page.continueCursor,
      },
    }
  }

  const nextTable = nextRepairTable(cursor.table)
  if (nextTable === null) {
    return {
      patched,
      examined: page.page.length,
      done: true,
      continueCursor: null,
    }
  }

  return {
    patched,
    examined: page.page.length,
    done: false,
    continueCursor: {
      table: nextTable,
      tableCursor: null,
    },
  }
}

/**
 * Repair all legacy mismatches that fit in one transaction via bounded
 * `.take()` (no `.paginate()`). For large deployments use the scheduled
 * paginated mutation instead.
 */
export async function repairInconsistentPaySchedules(
  ctx: MutationCtx
): Promise<{
  patched: number
  done: boolean
  continueCursor: PayScheduleRepairCursor | null
}> {
  const canonical = V1_BASE_SETTINGS.paySchedule
  let patched = 0
  let truncated = false

  for (const table of REPAIR_TABLES) {
    const rows = await takeSettingsTable(ctx, table, SYNC_TABLE_TAKE_LIMIT)
    if (rows.length >= SYNC_TABLE_TAKE_LIMIT) {
      truncated = true
    }
    for (const row of rows) {
      if (!isLegacyBiweeklyWeekdayMismatch(row.paySchedule)) {
        continue
      }
      await patchPaySchedule(ctx, table, row._id, canonical)
      patched += 1
    }
  }

  if (!truncated) {
    return { patched, done: true, continueCursor: null }
  }

  return {
    patched,
    done: false,
    continueCursor: {
      table: 'regionSettings',
      tableCursor: null,
    },
  }
}

/**
 * Documented legacy inconsistency: biweekly `firstPayDate` weekday ≠ `weekday`.
 * Other invalid shapes are left alone (fail loud at payday / settings write).
 */
export function isLegacyBiweeklyWeekdayMismatch(
  schedule: SettingsValues['paySchedule']
): boolean {
  if (schedule.type !== 'biweekly') {
    return false
  }
  try {
    assertBiweeklyFirstPayDateMatchesWeekday(
      schedule.firstPayDate,
      schedule.weekday
    )
    return false
  } catch {
    return true
  }
}

export type PayScheduleRepairTable =
  | 'regionSettings'
  | 'schoolSiteSettings'
  | 'classSettings'

export type PayScheduleRepairCursor = {
  table: PayScheduleRepairTable
  /** Opaque Convex pagination cursor within `table`, or null to start that table. */
  tableCursor: string | null
}

export type PayScheduleRepairBatchResult = {
  patched: number
  examined: number
  done: boolean
  /** Present when more rows remain; pass to the next batch / scheduled continuation. */
  continueCursor: PayScheduleRepairCursor | null
}

/** Product constraints for settings rows written during catalog seed. */
function assertCatalogSettings(values: SettingsValues): void {
  assertPaydayNoticeLeadDays(values.paydayNoticeLeadDays)
  assertPaySchedule(values.paySchedule)
  if (values.vaultCap < 1) {
    throw new Error('Vault cap must be at least 1.')
  }
}

function nextRepairTable(
  table: PayScheduleRepairTable
): PayScheduleRepairTable | null {
  switch (table) {
    case 'regionSettings':
      return 'schoolSiteSettings'
    case 'schoolSiteSettings':
      return 'classSettings'
    case 'classSettings':
      return null
  }
}

async function takeSettingsTable(
  ctx: MutationCtx,
  table: PayScheduleRepairTable,
  numItems: number
): Promise<
  Array<Doc<'regionSettings'> | Doc<'schoolSiteSettings'> | Doc<'classSettings'>>
> {
  switch (table) {
    case 'regionSettings':
      return await ctx.db.query('regionSettings').take(numItems)
    case 'schoolSiteSettings':
      return await ctx.db.query('schoolSiteSettings').take(numItems)
    case 'classSettings':
      return await ctx.db.query('classSettings').take(numItems)
  }
}

async function paginateSettingsTable(
  ctx: MutationCtx,
  cursor: PayScheduleRepairCursor,
  numItems: number
): Promise<{
  page: Array<
    Doc<'regionSettings'> | Doc<'schoolSiteSettings'> | Doc<'classSettings'>
  >
  isDone: boolean
  continueCursor: string
}> {
  switch (cursor.table) {
    case 'regionSettings':
      return await ctx.db
        .query('regionSettings')
        .paginate({ numItems, cursor: cursor.tableCursor })
    case 'schoolSiteSettings':
      return await ctx.db
        .query('schoolSiteSettings')
        .paginate({ numItems, cursor: cursor.tableCursor })
    case 'classSettings':
      return await ctx.db
        .query('classSettings')
        .paginate({ numItems, cursor: cursor.tableCursor })
  }
}

async function patchPaySchedule(
  ctx: MutationCtx,
  table: PayScheduleRepairTable,
  id: Id<'regionSettings'> | Id<'schoolSiteSettings'> | Id<'classSettings'>,
  paySchedule: SettingsValues['paySchedule']
): Promise<void> {
  switch (table) {
    case 'regionSettings':
      await ctx.db.patch('regionSettings', id as Id<'regionSettings'>, {
        paySchedule,
      })
      return
    case 'schoolSiteSettings':
      await ctx.db.patch(
        'schoolSiteSettings',
        id as Id<'schoolSiteSettings'>,
        { paySchedule }
      )
      return
    case 'classSettings':
      await ctx.db.patch('classSettings', id as Id<'classSettings'>, {
        paySchedule,
      })
      return
  }
}
