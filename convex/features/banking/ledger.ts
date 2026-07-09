import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import type {
  bankAccountKindValidator,
  ledgerEntryTypeValidator,
} from '../../schema/schemaFields'
import type { Infer } from 'convex/values'

export async function postLedgerEntry(
  ctx: MutationCtx,
  args: {
    organizationId: string
    rosterStudentId: Id<'rosterStudents'>
    bankAccountId: Id<'bankAccounts'>
    accountKind: BankAccountKind
    direction: LedgerDirection
    amountCents: number
    entryType: LedgerEntryType
    label: string
    createdAt: number
  }
): Promise<Id<'ledgerEntries'>> {
  if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error('Amount must be a positive integer number of cents.')
  }

  const account = await ctx.db.get('bankAccounts', args.bankAccountId)

  if (account === null) {
    throw new Error('Bank account not found.')
  }

  if (account.rosterStudentId !== args.rosterStudentId) {
    throw new Error('Bank account does not belong to this student.')
  }

  const nextBalance =
    args.direction === 'credit'
      ? account.balanceCents + args.amountCents
      : account.balanceCents - args.amountCents

  if (nextBalance < 0) {
    throw new Error('Insufficient funds.')
  }

  await ctx.db.patch('bankAccounts', args.bankAccountId, {
    balanceCents: nextBalance,
  })

  return await ctx.db.insert('ledgerEntries', {
    organizationId: args.organizationId,
    rosterStudentId: args.rosterStudentId,
    bankAccountId: args.bankAccountId,
    accountKind: args.accountKind,
    direction: args.direction,
    amountCents: args.amountCents,
    entryType: args.entryType,
    label: args.label,
    createdAt: args.createdAt,
  })
}
export async function getStudentBalances(
  ctx: QueryCtx | MutationCtx,
  rosterStudent: Doc<'rosterStudents'>
): Promise<{ checkingCents: number; savingsCents: number }> {
  const checking = await ctx.db
    .query('bankAccounts')
    .withIndex('by_rosterStudent_kind', q =>
      q.eq('rosterStudentId', rosterStudent._id).eq('kind', 'checking')
    )
    .unique()
  const savings = await ctx.db
    .query('bankAccounts')
    .withIndex('by_rosterStudent_kind', q =>
      q.eq('rosterStudentId', rosterStudent._id).eq('kind', 'savings')
    )
    .unique()

  return {
    checkingCents: checking?.balanceCents ?? 0,
    savingsCents: savings?.balanceCents ?? 0,
  }
}
type BankAccountKind = Infer<typeof bankAccountKindValidator>
type LedgerEntryType = Infer<typeof ledgerEntryTypeValidator>
type LedgerDirection = 'credit' | 'debit'
