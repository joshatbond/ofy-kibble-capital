import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import { getActiveRosterStudentForUser } from './banking/student'
import {
  ledgerEntryTypeValidator,
  vaultFundingModeValidator,
  vaultOnDepositRuleValidator,
  vaultScheduleCadenceValidator,
  vaultStatusValidator,
} from '../schema/schemaFields'
import {
  closeEmptyVaultForStudent,
  createVaultForStudent,
  getVaultOwnedByStudent,
  listOpenVaultsForStudent,
  listTransferAccountsForStudent,
  manualVaultTransferForStudent,
  toVaultPublic,
  transferFundsBetweenEndpoints,
  updateVaultForStudent,
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

export const closeVault = mutation({
  args: { vaultId: v.id('vaults') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      throw new Error('Active student account required.')
    }

    await closeEmptyVaultForStudent(ctx, {
      vaultId: args.vaultId,
      rosterStudentId: roster._id,
      nowMs: Date.now(),
    })

    return null
  },
})

const manualVaultTransferDirectionValidator = v.union(
  v.literal('to_vault'),
  v.literal('from_vault')
)

export const manualVaultTransfer = mutation({
  args: {
    vaultId: v.id('vaults'),
    direction: manualVaultTransferDirectionValidator,
    amountCents: v.number(),
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

    const vault = await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: args.vaultId,
      direction: args.direction,
      amountCents: args.amountCents,
      nowMs: Date.now(),
    })

    return toVaultPublic(vault)
  },
})

export const updateVault = mutation({
  args: {
    vaultId: v.id('vaults'),
    name: v.string(),
    icon: v.string(),
    goalCents: v.union(v.number(), v.null()),
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

    const vault = await updateVaultForStudent(ctx, {
      vaultId: args.vaultId,
      rosterStudentId: roster._id,
      name: args.name,
      icon: args.icon,
      goalCents: args.goalCents,
      nowMs: Date.now(),
    })

    return toVaultPublic(vault)
  },
})

const transferEndpointValidator = v.union(
  v.object({ type: v.literal('checking') }),
  v.object({ type: v.literal('savings') }),
  v.object({ type: v.literal('vault'), vaultId: v.id('vaults') })
)

const transferAccountValidator = v.object({
  type: v.union(
    v.literal('checking'),
    v.literal('savings'),
    v.literal('vault')
  ),
  vaultId: v.optional(v.id('vaults')),
  label: v.string(),
  icon: v.optional(v.string()),
  balanceCents: v.number(),
})

export const listMyTransferAccounts = query({
  args: {},
  returns: v.array(transferAccountValidator),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return []
    }

    return await listTransferAccountsForStudent(ctx, roster._id)
  },
})

export const transferFunds = mutation({
  args: {
    from: transferEndpointValidator,
    to: transferEndpointValidator,
    amountCents: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      throw new Error('Active student account required.')
    }

    await transferFundsBetweenEndpoints(ctx, {
      roster,
      from: args.from,
      to: args.to,
      amountCents: args.amountCents,
      nowMs: Date.now(),
    })

    return null
  },
})

const vaultActivityRowValidator = v.object({
  entryId: v.id('ledgerEntries'),
  direction: v.union(v.literal('credit'), v.literal('debit')),
  amountCents: v.number(),
  entryType: ledgerEntryTypeValidator,
  label: v.string(),
  createdAt: v.number(),
})

export const listMyVaultActivity = query({
  args: {
    vaultId: v.id('vaults'),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(vaultActivityRowValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return { page: [], isDone: true, continueCursor: '' }
    }

    const vault = await getVaultOwnedByStudent(ctx, {
      vaultId: args.vaultId,
      rosterStudentId: roster._id,
    })
    if (vault === null) {
      return { page: [], isDone: true, continueCursor: '' }
    }

    const results = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_vaultId_createdAt', q => q.eq('vaultId', args.vaultId))
      .order('desc')
      .paginate(args.paginationOpts)

    return {
      page: results.page.map(entry => ({
        entryId: entry._id,
        // Ledger rows live on the bank account; flip vault_manual so the vault
        // detail feed shows money in/out from the vault's point of view.
        direction: vaultFacingDirection(entry),
        amountCents: entry.amountCents,
        entryType: entry.entryType,
        label: entry.label,
        createdAt: entry.createdAt,
      })),
      isDone: results.isDone,
      continueCursor: results.continueCursor,
    }
  },
})

function vaultFacingDirection(entry: {
  entryType: string
  direction: 'credit' | 'debit'
  label: string
}): 'credit' | 'debit' {
  if (entry.entryType === 'vault_manual') {
    if (entry.label.startsWith('Transfer to ')) {
      return 'credit'
    }
    if (entry.label.startsWith('Transfer from ')) {
      return 'debit'
    }
  }
  return entry.direction
}
