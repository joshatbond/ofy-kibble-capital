import { getAuthUserId } from '@convex-dev/auth/server'
import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { v } from 'convex/values'

import { mutation, query } from '../_generated/server'
import {
  bankAccountKindValidator,
  ledgerEntryTypeValidator,
} from '../schema/schemaFields'

import { requireBankAccountForStudent } from './banking/accounts'
import { getStudentBalances, postLedgerEntry } from './banking/ledger'
import { getActiveRosterStudentForUser } from './banking/student'

const balancesValidator = v.object({
  checkingCents: v.number(),
  savingsCents: v.number(),
  currencyLabel: v.string(),
  savingsApyPercent: v.number(),
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
  args: { paginationOpts: paginationOptsValidator },
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

    const results = await ctx.db
      .query('ledgerEntries')
      .withIndex('by_rosterStudent_createdAt', q =>
        q.eq('rosterStudentId', roster._id)
      )
      .order('desc')
      .paginate(args.paginationOpts)

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

export const sweepToChecking = mutation({
  args: { amountCents: v.number() },
  returns: v.object({
    checkingCents: v.number(),
    savingsCents: v.number(),
  }),
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

    const savings = await requireBankAccountForStudent(
      ctx,
      roster._id,
      'savings'
    )
    const checking = await requireBankAccountForStudent(
      ctx,
      roster._id,
      'checking'
    )

    if (savings.balanceCents < args.amountCents) {
      throw new Error('Insufficient unallocated savings.')
    }

    const createdAt = Date.now()
    const label = 'Sweep to checking'

    await postLedgerEntry(ctx, {
      organizationId: roster.organizationId,
      rosterStudentId: roster._id,
      bankAccountId: savings._id,
      accountKind: 'savings',
      direction: 'debit',
      amountCents: args.amountCents,
      entryType: 'sweep_to_checking',
      label,
      createdAt,
    })

    await postLedgerEntry(ctx, {
      organizationId: roster.organizationId,
      rosterStudentId: roster._id,
      bankAccountId: checking._id,
      accountKind: 'checking',
      direction: 'credit',
      amountCents: args.amountCents,
      entryType: 'sweep_to_checking',
      label,
      createdAt,
    })

    return await getStudentBalances(ctx, roster)
  },
})
