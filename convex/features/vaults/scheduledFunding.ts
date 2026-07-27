import { insertTransferSkippedNotification } from '../notifications/helpers'
import { requireBankAccountForStudent } from '../banking/accounts'
import { postLedgerEntry } from '../banking/ledger'
import { nextRunAtForCadence } from './helpers'

import type { Doc } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'

const DUE_BATCH_SIZE = 100

export type ScheduledFundingResult = {
  funded: number
  skipped: number
  examined: number
}

/**
 * Funds due active scheduled vaults from unallocated savings.
 * Insufficient funds → transfer_skipped notification (no partial debit).
 * Successful runs advance nextRunAt by cadence.
 */
export async function processDueScheduledVaults(
  ctx: MutationCtx,
  args: { nowMs: number }
): Promise<ScheduledFundingResult> {
  const due = await ctx.db
    .query('vaults')
    .withIndex('by_nextRunAt', q => q.lte('nextRunAt', args.nowMs))
    .take(DUE_BATCH_SIZE)

  let funded = 0
  let skipped = 0
  let examined = 0

  for (const vault of due) {
    if (vault.status !== 'active' || vault.fundingMode !== 'scheduled') {
      continue
    }
    if (
      vault.scheduledAmountCents === undefined ||
      vault.scheduleCadence === undefined
    ) {
      continue
    }

    examined += 1

    const roster = await ctx.db.get('rosterStudents', vault.rosterStudentId)
    if (roster === null || roster.status !== 'active') {
      continue
    }

    const outcome = await fundScheduledVault(ctx, {
      roster,
      vault,
      nowMs: args.nowMs,
    })

    if (outcome === 'funded') {
      funded += 1
    } else if (outcome === 'skipped') {
      skipped += 1
    }
  }

  return { funded, skipped, examined }
}

async function fundScheduledVault(
  ctx: MutationCtx,
  args: {
    roster: Doc<'rosterStudents'>
    vault: Doc<'vaults'>
    nowMs: number
  }
): Promise<'funded' | 'skipped' | 'ignored'> {
  const amountCents = args.vault.scheduledAmountCents
  const cadence = args.vault.scheduleCadence
  if (amountCents === undefined || cadence === undefined) {
    return 'ignored'
  }

  const savings = await requireBankAccountForStudent(
    ctx,
    args.roster._id,
    'savings'
  )

  if (savings.balanceCents < amountCents) {
    await insertTransferSkippedNotification(ctx, {
      roster: args.roster,
      vault: args.vault,
      amountCents,
      nowMs: args.nowMs,
    })
    return 'skipped'
  }

  await postLedgerEntry(ctx, {
    organizationId: args.roster.organizationId,
    rosterStudentId: args.roster._id,
    bankAccountId: savings._id,
    accountKind: 'savings',
    direction: 'debit',
    amountCents,
    entryType: 'vault_scheduled',
    label: `Scheduled transfer to ${args.vault.name}`,
    createdAt: args.nowMs,
    vaultId: args.vault._id,
  })

  const nextBalance = args.vault.balanceCents + amountCents
  const reachedGoal =
    args.vault.goalCents !== undefined && nextBalance >= args.vault.goalCents

  if (reachedGoal) {
    await ctx.db.patch('vaults', args.vault._id, {
      balanceCents: nextBalance,
      updatedAt: args.nowMs,
      status: 'complete',
      nextRunAt: undefined,
    })
  } else {
    await ctx.db.patch('vaults', args.vault._id, {
      balanceCents: nextBalance,
      updatedAt: args.nowMs,
      nextRunAt: nextRunAtForCadence(cadence, args.nowMs),
    })
  }

  return 'funded'
}
