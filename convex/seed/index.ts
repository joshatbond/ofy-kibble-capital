import { orgScope } from '@djpanda/convex-tenants'
import { v } from 'convex/values'

import { components, internal } from '../_generated/api'
import { internalMutation } from '../_generated/server'
import { authz } from '../features/auth/authz'

import { applyV1Catalog, ensureOperatorUser } from './catalog'
import { V1_DEV_CLASSROOM } from './catalogData'
import {
  PAY_SCHEDULE_REPAIR_BATCH_SIZE,
  repairInconsistentPaySchedules,
  repairInconsistentPaySchedulesBatch,
} from './catalogSettings'

const seedResultValidator = v.object({
  operatorUserId: v.id('users'),
  regionId: v.id('regions'),
  schoolSiteIds: v.record(v.string(), v.id('schoolSites')),
  classroom: v.object({
    organizationId: v.string(),
    classroomId: v.id('classrooms'),
  }),
  payScheduleRepair: v.object({
    patched: v.number(),
    done: v.boolean(),
  }),
})
const devTeacherRoleValidator = v.union(
  v.literal('owner'),
  v.literal('admin'),
  v.literal('teacher')
)
const repairTableValidator = v.union(
  v.literal('regionSettings'),
  v.literal('schoolSiteSettings'),
  v.literal('classSettings')
)
const repairCursorValidator = v.object({
  table: repairTableValidator,
  tableCursor: v.union(v.string(), v.null()),
})
const repairBatchResultValidator = v.object({
  patched: v.number(),
  examined: v.number(),
  done: v.boolean(),
  continueCursor: v.union(repairCursorValidator, v.null()),
})

/**
 * Bootstrap v1 catalog, then repair legacy biweekly schedule mismatches so
 * existing rows are not left broken until someone discovers repairPaySchedules.
 */
export const seedV1Catalog = internalMutation({
  args: {},
  returns: seedResultValidator,
  handler: async ctx => {
    const catalog = await applyV1Catalog(ctx)
    // Prefer a single-transaction sync repair for typical catalog size; if the
    // bounded take truncates, continue via the paginated internal mutation.
    const repair = await repairInconsistentPaySchedules(ctx)
    if (!repair.done) {
      await ctx.scheduler.runAfter(0, internal.seed.index.repairPaySchedules, {
        cursor: repair.continueCursor,
        patchedSoFar: repair.patched,
      })
    }
    return {
      ...catalog,
      payScheduleRepair: {
        patched: repair.patched,
        done: repair.done,
      },
    }
  },
})

/**
 * Explicit migration entry: repair legacy biweekly mismatches in bounded
 * batches, scheduling internal continuation when more rows remain.
 */
export const repairPaySchedules = internalMutation({
  args: {
    cursor: v.optional(v.union(repairCursorValidator, v.null())),
    patchedSoFar: v.optional(v.number()),
    batchSize: v.optional(v.number()),
  },
  returns: repairBatchResultValidator,
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? PAY_SCHEDULE_REPAIR_BATCH_SIZE
    const result = await repairInconsistentPaySchedulesBatch(ctx, {
      cursor: args.cursor ?? null,
      batchSize,
    })
    const patched = (args.patchedSoFar ?? 0) + result.patched

    if (!result.done && result.continueCursor !== null) {
      await ctx.scheduler.runAfter(0, internal.seed.index.repairPaySchedules, {
        cursor: result.continueCursor,
        patchedSoFar: patched,
        batchSize,
      })
    }

    return {
      patched,
      examined: result.examined,
      done: result.done,
      continueCursor: result.continueCursor,
    }
  },
})

export const linkDevTeacherByEmail = internalMutation({
  args: {
    email: v.string(),
    role: v.optional(devTeacherRoleValidator),
  },
  returns: v.object({
    organizationId: v.string(),
    userId: v.id('users'),
    role: devTeacherRoleValidator,
  }),
  handler: async (ctx, args) => {
    const classroom = await ctx.db
      .query('classrooms')
      .withIndex('by_orgSlug', q => q.eq('orgSlug', V1_DEV_CLASSROOM.orgSlug))
      .unique()

    if (!classroom) {
      throw new Error(
        'Dev classroom is missing — run `bunx convex run seed/index:seedV1Catalog` first.'
      )
    }

    const user = await ctx.db
      .query('users')
      .withIndex('email', q => q.eq('email', args.email))
      .unique()

    if (!user) {
      throw new Error(
        `No users row for "${args.email}". Sign in once at /admin/landing, then rerun.`
      )
    }

    const operatorUserId = await ensureOperatorUser(ctx)
    const organizationId = classroom.organizationId
    const role = args.role ?? 'owner'

    const existing = await ctx.runQuery(components.tenants.members.getMember, {
      organizationId,
      userId: user._id,
    })

    if (!existing) {
      await ctx.runMutation(components.tenants.members.addMember, {
        userId: operatorUserId,
        organizationId,
        memberUserId: user._id,
        role,
      })

      await authz.assignRole(
        ctx,
        user._id,
        role,
        orgScope(organizationId),
        undefined,
        operatorUserId
      )

      return { organizationId, userId: user._id, role }
    }

    return {
      organizationId,
      userId: user._id,
      role: existing.role as typeof role,
    }
  },
})
