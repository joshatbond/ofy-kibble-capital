import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { getActiveRosterStudentForUser } from './banking/student'
import {
  vaultFundingModeValidator,
  vaultOnDepositRuleValidator,
  vaultScheduleCadenceValidator,
  vaultStatusValidator,
} from '../schema/schemaFields'
import {
  createVaultForStudent,
  getVaultOwnedByStudent,
  listOpenVaultsForStudent,
  toVaultPublic,
} from './vaults/helpers'

const vaultPublicValidator = v.object({
  _id: v.id('vaults'),
  name: v.string(),
  icon: v.string(),
  goalCents: v.optional(v.number()),
  balanceCents: v.number(),
  fundingMode: vaultFundingModeValidator,
  onDepositRule: v.optional(vaultOnDepositRuleValidator),
  scheduledAmountCents: v.optional(v.number()),
  scheduleCadence: v.optional(vaultScheduleCadenceValidator),
  nextRunAt: v.optional(v.number()),
  status: vaultStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const listMyVaults = query({
  args: {},
  returns: v.array(vaultPublicValidator),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return []
    }

    const vaults = await listOpenVaultsForStudent(ctx, roster._id)
    return vaults.map(toVaultPublic)
  },
})

export const getMyVault = query({
  args: { vaultId: v.id('vaults') },
  returns: v.union(vaultPublicValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return null
    }

    const vault = await getVaultOwnedByStudent(ctx, {
      vaultId: args.vaultId,
      rosterStudentId: roster._id,
    })
    return vault === null ? null : toVaultPublic(vault)
  },
})

export const createVault = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    goalCents: v.optional(v.number()),
    fundingMode: vaultFundingModeValidator,
    onDepositRule: v.optional(vaultOnDepositRuleValidator),
    scheduledAmountCents: v.optional(v.number()),
    scheduleCadence: v.optional(vaultScheduleCadenceValidator),
  },
  returns: vaultPublicValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      throw new Error('Active student account required.')
    }

    const vault = await createVaultForStudent(ctx, {
      rosterStudentId: roster._id,
      organizationId: roster.organizationId,
      name: args.name,
      icon: args.icon,
      goalCents: args.goalCents,
      fundingMode: args.fundingMode,
      onDepositRule: args.onDepositRule,
      scheduledAmountCents: args.scheduledAmountCents,
      scheduleCadence: args.scheduleCadence,
      nowMs: Date.now(),
    })

    return toVaultPublic(vault)
  },
})
