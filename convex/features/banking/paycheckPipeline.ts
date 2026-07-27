import {
  effectivePaySplitPercents,
  getPaySplitForStudent,
} from '../paySplit/helpers'

import { requireBankAccountForStudent } from './accounts'
import { getStudentBalances, postLedgerEntry } from './ledger'
import { moveBetweenStudentAccounts } from './transfers'

import type { StudentBalances } from './ledger'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx } from '../../_generated/server'
import type { vaultOnDepositRuleValidator } from '../../schema/schemaFields'
import type { Infer } from 'convex/values'

export function planPaycheckAllocation(args: {
  netPayCents: number
  onDepositVaults: Array<OnDepositVaultPlanInput>
  savingsPercent: number
}): PaycheckAllocationPlan {
  if (!Number.isInteger(args.netPayCents) || args.netPayCents <= 0) {
    throw new Error('Net pay must be a positive integer number of cents.')
  }
  if (
    !Number.isInteger(args.savingsPercent) ||
    args.savingsPercent < 0 ||
    args.savingsPercent > 100
  ) {
    throw new Error('Savings percent must be an integer from 0 to 100.')
  }

  let remaining = args.netPayCents
  const vaultCuts: Array<VaultCutPlan> = []

  for (const vault of args.onDepositVaults) {
    if (remaining <= 0) {
      break
    }

    const wanted =
      vault.rule.kind === 'percent'
        ? Math.floor((args.netPayCents * vault.rule.percent) / 100)
        : vault.rule.amountCents

    const amountCents = Math.min(Math.max(wanted, 0), remaining)
    if (amountCents <= 0) {
      continue
    }

    vaultCuts.push({ vaultId: vault.vaultId, amountCents })
    remaining -= amountCents
  }

  const savingsCents = Math.floor((remaining * args.savingsPercent) / 100)
  const checkingCents = remaining - savingsCents

  return {
    vaultCuts,
    vaultCutsTotalCents: args.netPayCents - remaining,
    checkingCents,
    savingsCents,
  }
}
export async function applyPaycheckPipeline(
  ctx: MutationCtx,
  args: {
    roster: Doc<'rosterStudents'>
    netPayCents: number
    nowMs: number
  }
): Promise<StudentBalances> {
  if (!Number.isInteger(args.netPayCents) || args.netPayCents <= 0) {
    throw new Error('Net pay must be a positive integer number of cents.')
  }

  const checking = await requireBankAccountForStudent(
    ctx,
    args.roster._id,
    'checking'
  )
  const savings = await requireBankAccountForStudent(
    ctx,
    args.roster._id,
    'savings'
  )

  const activeVaults = await ctx.db
    .query('vaults')
    .withIndex('by_rosterStudent_status', q =>
      q.eq('rosterStudentId', args.roster._id).eq('status', 'active')
    )
    .collect()

  const onDepositVaults = activeVaults
    .filter(
      vault =>
        vault.fundingMode === 'on_deposit' && vault.onDepositRule !== undefined
    )
    .sort((a, b) => a.createdAt - b.createdAt)

  const paySplit = await getPaySplitForStudent(ctx, args.roster._id)
  const { savingsPercent } = effectivePaySplitPercents(paySplit)

  const plan = planPaycheckAllocation({
    netPayCents: args.netPayCents,
    onDepositVaults: onDepositVaults.map(vault => ({
      vaultId: vault._id,
      rule: vault.onDepositRule!,
    })),
    savingsPercent,
  })

  // 1. Credit full net pay into checking (deposit lands).
  await postLedgerEntry(ctx, {
    organizationId: args.roster.organizationId,
    rosterStudentId: args.roster._id,
    bankAccountId: checking._id,
    accountKind: 'checking',
    direction: 'credit',
    amountCents: args.netPayCents,
    entryType: 'net_pay',
    label: 'Net pay',
    createdAt: args.nowMs,
  })

  // 2. On-deposit first cuts: checking → savings → vault.
  const vaultById = new Map(onDepositVaults.map(vault => [vault._id, vault]))

  for (const cut of plan.vaultCuts) {
    const vault = vaultById.get(cut.vaultId)
    if (vault === undefined) {
      continue
    }

    await moveBetweenStudentAccounts(ctx, {
      roster: args.roster,
      fromKind: 'checking',
      toKind: 'savings',
      amountCents: cut.amountCents,
      entryType: 'vault_on_deposit',
      label: `On deposit to ${vault.name}`,
      createdAt: args.nowMs,
      insufficientFundsMessage: 'Insufficient checking balance.',
    })

    await postLedgerEntry(ctx, {
      organizationId: args.roster.organizationId,
      rosterStudentId: args.roster._id,
      bankAccountId: savings._id,
      accountKind: 'savings',
      direction: 'debit',
      amountCents: cut.amountCents,
      entryType: 'vault_on_deposit',
      label: `On deposit to ${vault.name}`,
      createdAt: args.nowMs,
      vaultId: vault._id,
    })

    // Re-read savings after moveBetween (balance changed); postLedgerEntry
    // also patches — use fresh vault balance for goal check.
    const nextBalance = vault.balanceCents + cut.amountCents
    const reachedGoal =
      vault.goalCents !== undefined && nextBalance >= vault.goalCents

    await ctx.db.patch('vaults', vault._id, {
      balanceCents: nextBalance,
      updatedAt: args.nowMs,
      ...(reachedGoal ? { status: 'complete' as const } : {}),
    })

    vaultById.set(vault._id, {
      ...vault,
      balanceCents: nextBalance,
      status: reachedGoal ? 'complete' : vault.status,
    })
  }

  // 3. Pay split remainder: move savings share out of checking.
  if (plan.savingsCents > 0) {
    await moveBetweenStudentAccounts(ctx, {
      roster: args.roster,
      fromKind: 'checking',
      toKind: 'savings',
      amountCents: plan.savingsCents,
      entryType: 'pay_split',
      label: 'Pay split to Savings',
      createdAt: args.nowMs,
      insufficientFundsMessage: 'Insufficient checking balance.',
    })
  }

  return await getStudentBalances(ctx, args.roster)
}
export type OnDepositVaultPlanInput = {
  vaultId: Id<'vaults'>
  rule: OnDepositRule
}
export type VaultCutPlan = {
  vaultId: Id<'vaults'>
  amountCents: number
}
export type PaycheckAllocationPlan = {
  vaultCuts: Array<VaultCutPlan>
  vaultCutsTotalCents: number
  checkingCents: number
  savingsCents: number
}
type OnDepositRule = Infer<typeof vaultOnDepositRuleValidator>
