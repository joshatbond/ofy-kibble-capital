import { v } from 'convex/values'

import { requireBankAccountForStudent } from './accounts'
import { postLedgerEntry } from './ledger'

import type { Doc } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'
import type {
  bankAccountKindValidator,
  ledgerEntryTypeValidator,
} from '../../schema/schemaFields'
import type { Infer } from 'convex/values'

export const transferDirectionValidator = v.union(
  v.literal('savings_to_checking'),
  v.literal('checking_to_savings')
)
export function transferDirectionMeta(direction: TransferDirection): {
  fromKind: BankAccountKind
  toKind: BankAccountKind
  label: string
  insufficientFundsMessage: string
} {
  if (direction === 'savings_to_checking') {
    return {
      fromKind: 'savings',
      toKind: 'checking',
      label: 'Transfer to Checking',
      insufficientFundsMessage: 'Insufficient unallocated savings.',
    }
  }

  return {
    fromKind: 'checking',
    toKind: 'savings',
    label: 'Transfer to Savings',
    insufficientFundsMessage: 'Insufficient checking balance.',
  }
}
export async function moveBetweenStudentAccounts(
  ctx: MutationCtx,
  args: {
    roster: Doc<'rosterStudents'>
    fromKind: BankAccountKind
    toKind: BankAccountKind
    amountCents: number
    entryType: LedgerEntryType
    label: string
    createdAt: number
    insufficientFundsMessage: string
  }
): Promise<void> {
  const fromAccount = await requireBankAccountForStudent(
    ctx,
    args.roster._id,
    args.fromKind
  )
  const toAccount = await requireBankAccountForStudent(
    ctx,
    args.roster._id,
    args.toKind
  )

  if (fromAccount.balanceCents < args.amountCents) {
    throw new Error(args.insufficientFundsMessage)
  }

  await postLedgerEntry(ctx, {
    organizationId: args.roster.organizationId,
    rosterStudentId: args.roster._id,
    bankAccountId: fromAccount._id,
    accountKind: args.fromKind,
    direction: 'debit',
    amountCents: args.amountCents,
    entryType: args.entryType,
    label: args.label,
    createdAt: args.createdAt,
  })

  await postLedgerEntry(ctx, {
    organizationId: args.roster.organizationId,
    rosterStudentId: args.roster._id,
    bankAccountId: toAccount._id,
    accountKind: args.toKind,
    direction: 'credit',
    amountCents: args.amountCents,
    entryType: args.entryType,
    label: args.label,
    createdAt: args.createdAt,
  })
}
export type TransferDirection = Infer<typeof transferDirectionValidator>
type BankAccountKind = Infer<typeof bankAccountKindValidator>
type LedgerEntryType = Infer<typeof ledgerEntryTypeValidator>
