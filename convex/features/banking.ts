import { getAuthUserId } from '@convex-dev/auth/server'
import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { v } from 'convex/values'

import { internalMutation, mutation, query } from '../_generated/server'
import {
  bankAccountKindValidator,
  ledgerEntryTypeValidator,
} from '../schema/schemaFields'

import { requireTeacherForOrg } from './auth/teacher'
import { getStudentBalances } from './banking/ledger'
import { getActiveRosterStudentForUser } from './banking/student'
import {
  moveBetweenStudentAccounts,
  transferDirectionMeta,
  transferDirectionValidator,
} from './banking/transfers'

const balancesValidator = v.object({
  checkingCents: v.number(),
  savingsUnallocatedCents: v.number(),
  vaultsTotalCents: v.number(),
  savingsCents: v.number(),
  currencyLabel: v.string(),
  savingsApyPercent: v.number(),
})

const balancesOnlyValidator = v.object({
  checkingCents: v.number(),
  savingsUnallocatedCents: v.number(),
  vaultsTotalCents: v.number(),
  savingsCents: v.number(),
})

const activityRowValidator = v.object({
  entryId: v.id('ledgerEntries'),
  accountKind: bankAccountKindValidator,
  direction: v.union(v.literal('credit'), v.literal('debit')),
  amountCents: v.number(),
  entryType: ledgerEntryTypeValidator,
  label: v.string(),
  createdAt: v.number(),
})

const classroomActivityRowValidator = v.object({
  entryId: v.id('ledgerEntries'),
  rosterStudentId: v.id('rosterStudents'),
  studentDisplayName: v.string(),
  accountKind: bankAccountKindValidator,
  direction: v.union(v.literal('credit'), v.literal('debit')),
  amountCents: v.number(),
  entryType: ledgerEntryTypeValidator,
  label: v.string(),
  createdAt: v.number(),
})

export const getMyBalances = query({
  args: {},
  returns: v.union(balancesValidator, v.null()),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return null
    }

    const balances = await getStudentBalances(ctx, roster)
    const classSettings = await ctx.db
      .query('classSettings')
      .withIndex('by_organizationId', q =>
        q.eq('organizationId', roster.organizationId)
      )
      .unique()

    return {
      ...balances,
      currencyLabel: classSettings?.currencyLabel ?? 'Kibbles',
      savingsApyPercent: classSettings?.savingsApyPercent ?? 0,
    }
  },
})

export const listMyActivityHistory = query({
  args: {
    accountKind: v.optional(bankAccountKindValidator),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(activityRowValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return { page: [], isDone: true, continueCursor: '' }
    }

    let results
    if (args.accountKind === undefined) {
      results = await ctx.db
        .query('ledgerEntries')
        .withIndex('by_rosterStudent_createdAt', q =>
          q.eq('rosterStudentId', roster._id)
        )
        .order('desc')
        .paginate(args.paginationOpts)
    } else {
      const accountKind = args.accountKind
      results = await ctx.db
        .query('ledgerEntries')
        .withIndex('by_rosterStudent_accountKind_createdAt', q =>
          q.eq('rosterStudentId', roster._id).eq('accountKind', accountKind)
        )
        .order('desc')
        .paginate(args.paginationOpts)
    }

    return {
      page: results.page.map(entry => ({
        entryId: entry._id,
        accountKind: entry.accountKind,
        direction: entry.direction,
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

export const listClassroomActivityHistory = query({
  args: {
    organizationId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(classroomActivityRowValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    await requireTeacherForOrg(ctx, userId, args.organizationId, 'members:list')

    const results = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_organizationId_createdAt', q =>
        q.eq('organizationId', args.organizationId)
      )
      .order('desc')
      .paginate(args.paginationOpts)

    const rosterStudentIds = [
      ...new Set(results.page.map(entry => entry.rosterStudentId)),
    ]
    const rosterStudents = await Promise.all(
      rosterStudentIds.map(rosterStudentId =>
        ctx.db.get('rosterStudents', rosterStudentId)
      )
    )
    const displayNameByRosterId = new Map(
      rosterStudents
        .filter(
          (roster): roster is NonNullable<typeof roster> => roster !== null
        )
        .map(roster => [roster._id, roster.displayName] as const)
    )

    return {
      page: results.page.map(entry => ({
        entryId: entry._id,
        rosterStudentId: entry.rosterStudentId,
        studentDisplayName:
          displayNameByRosterId.get(entry.rosterStudentId) ?? 'Student',
        accountKind: entry.accountKind,
        direction: entry.direction,
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

export const getMyLedgerEntry = query({
  args: { entryId: v.id('ledgerEntries') },
  returns: v.union(activityRowValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      return null
    }

    const entry = await ctx.db.get('ledgerEntries', args.entryId)
    if (entry === null || entry.rosterStudentId !== roster._id) {
      return null
    }

    return {
      entryId: entry._id,
      accountKind: entry.accountKind,
      direction: entry.direction,
      amountCents: entry.amountCents,
      entryType: entry.entryType,
      label: entry.label,
      createdAt: entry.createdAt,
    }
  },
})

export const transferBetweenAccounts = mutation({
  args: {
    direction: transferDirectionValidator,
    amountCents: v.number(),
  },
  returns: balancesOnlyValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error('Not authenticated')
    }

    const roster = await getActiveRosterStudentForUser(ctx, userId)
    if (roster === null) {
      throw new Error('Active student account required.')
    }

    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error('Amount must be a positive integer number of cents.')
    }

    const meta = transferDirectionMeta(args.direction)

    await moveBetweenStudentAccounts(ctx, {
      roster,
      fromKind: meta.fromKind,
      toKind: meta.toKind,
      amountCents: args.amountCents,
      entryType: 'internal_transfer',
      label: meta.label,
      createdAt: Date.now(),
      insufficientFundsMessage: meta.insufficientFundsMessage,
    })

    return await getStudentBalances(ctx, roster)
  },
})

/** POS / spend pipeline only — moves unallocated savings when checking is short. */
export const sweepToChecking = internalMutation({
  args: { amountCents: v.number(), rosterStudentId: v.id('rosterStudents') },
  returns: balancesOnlyValidator,
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error('Amount must be a positive integer number of cents.')
    }

    const roster = await ctx.db.get('rosterStudents', args.rosterStudentId)
    if (roster === null || roster.status !== 'active') {
      throw new Error('Active student account required.')
    }

    await moveBetweenStudentAccounts(ctx, {
      roster,
      fromKind: 'savings',
      toKind: 'checking',
      amountCents: args.amountCents,
      entryType: 'sweep_to_checking',
      label: 'Sweep to checking',
      createdAt: Date.now(),
      insufficientFundsMessage: 'Insufficient unallocated savings.',
    })

    return await getStudentBalances(ctx, roster)
  },
})
