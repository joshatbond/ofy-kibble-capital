import {
  vaultFundingModeValidator,
  vaultOnDepositRuleValidator,
  vaultScheduleCadenceValidator,
} from '../../schema/schemaFields'
import { requireBankAccountForStudent } from '../banking/accounts'
import { postLedgerEntry } from '../banking/ledger'
import { moveBetweenStudentAccounts } from '../banking/transfers'
import { resolveEffectiveSettings } from '../settings/effectiveSettings'

import type { Infer } from 'convex/values'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'

type FundingMode = Infer<typeof vaultFundingModeValidator>
type OnDepositRule = Infer<typeof vaultOnDepositRuleValidator>
type ScheduleCadence = Infer<typeof vaultScheduleCadenceValidator>

export type VaultPublic = {
  _id: Id<'vaults'>
  name: string
  icon: string
  goalCents?: number
  balanceCents: number
  fundingMode: FundingMode
  onDepositRule?: OnDepositRule
  scheduledAmountCents?: number
  scheduleCadence?: ScheduleCadence
  nextRunAt?: number
  status: Doc<'vaults'>['status']
  createdAt: number
  updatedAt: number
}

export function toVaultPublic(vault: Doc<'vaults'>): VaultPublic {
  return {
    _id: vault._id,
    name: vault.name,
    icon: vault.icon,
    goalCents: vault.goalCents,
    balanceCents: vault.balanceCents,
    fundingMode: vault.fundingMode,
    onDepositRule: vault.onDepositRule,
    scheduledAmountCents: vault.scheduledAmountCents,
    scheduleCadence: vault.scheduleCadence,
    nextRunAt: vault.nextRunAt,
    status: vault.status,
    createdAt: vault.createdAt,
    updatedAt: vault.updatedAt,
  }
}

export async function listOpenVaultsForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<Doc<'vaults'>[]> {
  const [active, complete] = await Promise.all([
    ctx.db
      .query('vaults')
      .withIndex('by_rosterStudent_status', q =>
        q.eq('rosterStudentId', rosterStudentId).eq('status', 'active')
      )
      .collect(),
    ctx.db
      .query('vaults')
      .withIndex('by_rosterStudent_status', q =>
        q.eq('rosterStudentId', rosterStudentId).eq('status', 'complete')
      )
      .collect(),
  ])

  return [...active, ...complete].sort((a, b) => a.createdAt - b.createdAt)
}

export async function getVaultOwnedByStudent(
  ctx: QueryCtx | MutationCtx,
  args: {
    vaultId: Id<'vaults'>
    rosterStudentId: Id<'rosterStudents'>
  }
): Promise<Doc<'vaults'> | null> {
  const vault = await ctx.db.get('vaults', args.vaultId)
  if (vault === null || vault.rosterStudentId !== args.rosterStudentId) {
    return null
  }
  if (vault.status === 'closed') {
    return null
  }
  return vault
}

export function assertValidVaultName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    throw new Error('Vault name is required.')
  }
  if (trimmed.length > 60) {
    throw new Error('Vault name must be 60 characters or fewer.')
  }
  return trimmed
}

export function assertValidVaultIcon(icon: string): string {
  const trimmed = icon.trim()
  if (trimmed.length === 0) {
    throw new Error('Vault icon is required.')
  }
  if (trimmed.length > 16) {
    throw new Error('Vault icon must be 16 characters or fewer.')
  }
  return trimmed
}

export function assertValidOptionalGoalCents(
  goalCents: number | undefined
): number | undefined {
  if (goalCents === undefined) {
    return undefined
  }
  if (!Number.isInteger(goalCents) || goalCents < 1) {
    throw new Error('Goal must be a positive integer number of cents.')
  }
  return goalCents
}

function assertValidOnDepositRule(rule: OnDepositRule): OnDepositRule {
  if (rule.kind === 'percent') {
    if (
      !Number.isInteger(rule.percent) ||
      rule.percent < 1 ||
      rule.percent > 100
    ) {
      throw new Error(
        'On-deposit percent must be an integer from 1 to 100.'
      )
    }
    return rule
  }

  if (!Number.isInteger(rule.amountCents) || rule.amountCents < 1) {
    throw new Error(
      'On-deposit fixed amount must be a positive integer number of cents.'
    )
  }
  return rule
}

function assertValidScheduledFields(args: {
  scheduledAmountCents: number
  scheduleCadence: ScheduleCadence
}): {
  scheduledAmountCents: number
  scheduleCadence: ScheduleCadence
} {
  if (
    !Number.isInteger(args.scheduledAmountCents) ||
    args.scheduledAmountCents < 1
  ) {
    throw new Error(
      'Scheduled amount must be a positive integer number of cents.'
    )
  }
  return args
}

/** First run due one cadence period from `nowMs`. */
export function nextRunAtForCadence(
  cadence: ScheduleCadence,
  nowMs: number
): number {
  const dayMs = 24 * 60 * 60 * 1000
  switch (cadence) {
    case 'weekly':
      return nowMs + 7 * dayMs
    case 'biweekly':
      return nowMs + 14 * dayMs
    case 'monthly': {
      const date = new Date(nowMs)
      date.setUTCMonth(date.getUTCMonth() + 1)
      return date.getTime()
    }
  }
}

export async function sumOnDepositPercentsForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<number> {
  const open = await listOpenVaultsForStudent(ctx, rosterStudentId)
  let sum = 0
  for (const vault of open) {
    if (
      vault.fundingMode === 'on_deposit' &&
      vault.onDepositRule?.kind === 'percent'
    ) {
      sum += vault.onDepositRule.percent
    }
  }
  return sum
}

export async function createVaultForStudent(
  ctx: MutationCtx,
  args: {
    rosterStudentId: Id<'rosterStudents'>
    organizationId: string
    name: string
    icon: string
    goalCents?: number
    fundingMode: FundingMode
    onDepositRule?: OnDepositRule
    scheduledAmountCents?: number
    scheduleCadence?: ScheduleCadence
    nowMs: number
  }
): Promise<Doc<'vaults'>> {
  const name = assertValidVaultName(args.name)
  const icon = assertValidVaultIcon(args.icon)
  const goalCents = assertValidOptionalGoalCents(args.goalCents)

  const openVaults = await listOpenVaultsForStudent(ctx, args.rosterStudentId)
  const settings = await resolveEffectiveSettings(ctx, args.organizationId)
  if (openVaults.length >= settings.vaultCap) {
    throw new Error(
      `Vault limit reached (${settings.vaultCap}). Close a vault to create another.`
    )
  }

  let onDepositRule: OnDepositRule | undefined
  let scheduledAmountCents: number | undefined
  let scheduleCadence: ScheduleCadence | undefined
  let nextRunAt: number | undefined

  if (args.fundingMode === 'on_deposit') {
    if (args.onDepositRule === undefined) {
      throw new Error('On-deposit vaults require an on-deposit rule.')
    }
    if (
      args.scheduledAmountCents !== undefined ||
      args.scheduleCadence !== undefined
    ) {
      throw new Error('On-deposit vaults cannot include schedule fields.')
    }
    onDepositRule = assertValidOnDepositRule(args.onDepositRule)

    if (onDepositRule.kind === 'percent') {
      const existingPercent = await sumOnDepositPercentsForStudent(
        ctx,
        args.rosterStudentId
      )
      if (existingPercent + onDepositRule.percent > 100) {
        throw new Error(
          `On-deposit vault percents cannot exceed 100% (currently ${existingPercent}%).`
        )
      }
    }
  } else if (args.fundingMode === 'scheduled') {
    if (
      args.scheduledAmountCents === undefined ||
      args.scheduleCadence === undefined
    ) {
      throw new Error(
        'Scheduled vaults require an amount and cadence.'
      )
    }
    if (args.onDepositRule !== undefined) {
      throw new Error('Scheduled vaults cannot include an on-deposit rule.')
    }
    const scheduled = assertValidScheduledFields({
      scheduledAmountCents: args.scheduledAmountCents,
      scheduleCadence: args.scheduleCadence,
    })
    scheduledAmountCents = scheduled.scheduledAmountCents
    scheduleCadence = scheduled.scheduleCadence
    nextRunAt = nextRunAtForCadence(scheduleCadence, args.nowMs)
  } else {
    if (
      args.onDepositRule !== undefined ||
      args.scheduledAmountCents !== undefined ||
      args.scheduleCadence !== undefined
    ) {
      throw new Error('Manual vaults cannot include funding rule fields.')
    }
  }

  const vaultId = await ctx.db.insert('vaults', {
    rosterStudentId: args.rosterStudentId,
    name,
    icon,
    goalCents,
    balanceCents: 0,
    fundingMode: args.fundingMode,
    onDepositRule,
    scheduledAmountCents,
    scheduleCadence,
    nextRunAt,
    status: 'active',
    createdAt: args.nowMs,
    updatedAt: args.nowMs,
  })

  const vault = await ctx.db.get('vaults', vaultId)
  if (vault === null) {
    throw new Error('Failed to create vault.')
  }
  return vault
}

/**
 * Archives an empty vault. Vaults with a balance must move funds out first
 * (liquidation on close comes with manual transfer work).
 */
export async function closeEmptyVaultForStudent(
  ctx: MutationCtx,
  args: {
    vaultId: Id<'vaults'>
    rosterStudentId: Id<'rosterStudents'>
    nowMs: number
  }
): Promise<void> {
  const vault = await getVaultOwnedByStudent(ctx, {
    vaultId: args.vaultId,
    rosterStudentId: args.rosterStudentId,
  })
  if (vault === null) {
    throw new Error('Vault not found.')
  }

  if (vault.balanceCents > 0) {
    throw new Error(
      'Move all funds out of this vault before closing it.'
    )
  }

  await ctx.db.patch('vaults', vault._id, {
    status: 'closed',
    closedAt: args.nowMs,
    updatedAt: args.nowMs,
    nextRunAt: undefined,
  })
}

export type ManualVaultTransferDirection = 'to_vault' | 'from_vault'

export async function manualVaultTransferForStudent(
  ctx: MutationCtx,
  args: {
    roster: Doc<'rosterStudents'>
    vaultId: Id<'vaults'>
    direction: ManualVaultTransferDirection
    amountCents: number
    nowMs: number
  }
): Promise<Doc<'vaults'>> {
  if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error('Amount must be a positive integer number of cents.')
  }

  const vault = await getVaultOwnedByStudent(ctx, {
    vaultId: args.vaultId,
    rosterStudentId: args.roster._id,
  })
  if (vault === null) {
    throw new Error('Vault not found.')
  }

  const savings = await requireBankAccountForStudent(
    ctx,
    args.roster._id,
    'savings'
  )

  if (args.direction === 'to_vault') {
    if (savings.balanceCents < args.amountCents) {
      throw new Error('Insufficient unallocated savings.')
    }

    await postLedgerEntry(ctx, {
      organizationId: args.roster.organizationId,
      rosterStudentId: args.roster._id,
      bankAccountId: savings._id,
      accountKind: 'savings',
      direction: 'debit',
      amountCents: args.amountCents,
      entryType: 'vault_manual',
      label: `Transfer to ${vault.name}`,
      createdAt: args.nowMs,
      vaultId: vault._id,
    })

    const nextBalance = vault.balanceCents + args.amountCents
    const reachedGoal =
      vault.goalCents !== undefined && nextBalance >= vault.goalCents

    await ctx.db.patch('vaults', vault._id, {
      balanceCents: nextBalance,
      updatedAt: args.nowMs,
      ...(reachedGoal && vault.status === 'active'
        ? { status: 'complete' as const }
        : {}),
    })
  } else {
    if (vault.balanceCents < args.amountCents) {
      throw new Error('Insufficient vault balance.')
    }

    await postLedgerEntry(ctx, {
      organizationId: args.roster.organizationId,
      rosterStudentId: args.roster._id,
      bankAccountId: savings._id,
      accountKind: 'savings',
      direction: 'credit',
      amountCents: args.amountCents,
      entryType: 'vault_manual',
      label: `Transfer from ${vault.name}`,
      createdAt: args.nowMs,
      vaultId: vault._id,
    })

    await ctx.db.patch('vaults', vault._id, {
      balanceCents: vault.balanceCents - args.amountCents,
      updatedAt: args.nowMs,
    })
  }

  const updated = await ctx.db.get('vaults', vault._id)
  if (updated === null) {
    throw new Error('Vault not found.')
  }
  return updated
}

export async function updateVaultForStudent(
  ctx: MutationCtx,
  args: {
    vaultId: Id<'vaults'>
    rosterStudentId: Id<'rosterStudents'>
    name: string
    icon: string
    goalCents: number | null
    nowMs: number
  }
): Promise<Doc<'vaults'>> {
  const vault = await getVaultOwnedByStudent(ctx, {
    vaultId: args.vaultId,
    rosterStudentId: args.rosterStudentId,
  })
  if (vault === null) {
    throw new Error('Vault not found.')
  }

  const name = assertValidVaultName(args.name)
  const icon = assertValidVaultIcon(args.icon)
  const goalCents =
    args.goalCents === null
      ? undefined
      : assertValidOptionalGoalCents(args.goalCents)

  const nextBalance = vault.balanceCents
  const reachedGoal =
    goalCents !== undefined && nextBalance >= goalCents
  const belowGoal =
    goalCents === undefined || nextBalance < goalCents

  await ctx.db.patch('vaults', vault._id, {
    name,
    icon,
    goalCents,
    updatedAt: args.nowMs,
    ...(reachedGoal && vault.status === 'active'
      ? { status: 'complete' as const }
      : {}),
    // Raising/clearing a goal can reopen a complete vault that no longer meets it.
    ...(belowGoal && vault.status === 'complete'
      ? { status: 'active' as const }
      : {}),
  })

  const updated = await ctx.db.get('vaults', vault._id)
  if (updated === null) {
    throw new Error('Vault not found.')
  }
  return updated
}

export type TransferEndpoint =
  | { type: 'checking' }
  | { type: 'savings' }
  | { type: 'vault'; vaultId: Id<'vaults'> }

export type TransferAccountPublic = {
  type: 'checking' | 'savings' | 'vault'
  vaultId?: Id<'vaults'>
  label: string
  icon?: string
  balanceCents: number
}

export async function listTransferAccountsForStudent(
  ctx: QueryCtx | MutationCtx,
  rosterStudentId: Id<'rosterStudents'>
): Promise<TransferAccountPublic[]> {
  const [checking, savings, vaults] = await Promise.all([
    requireBankAccountForStudent(ctx, rosterStudentId, 'checking'),
    requireBankAccountForStudent(ctx, rosterStudentId, 'savings'),
    listOpenVaultsForStudent(ctx, rosterStudentId),
  ])

  return [
    {
      type: 'checking',
      label: 'Checking',
      balanceCents: checking.balanceCents,
    },
    {
      type: 'savings',
      label: 'Savings',
      balanceCents: savings.balanceCents,
    },
    ...vaults.map(vault => ({
      type: 'vault' as const,
      vaultId: vault._id,
      label: vault.name,
      icon: vault.icon,
      balanceCents: vault.balanceCents,
    })),
  ]
}

function endpointKey(endpoint: TransferEndpoint): string {
  if (endpoint.type === 'vault') {
    return `vault:${endpoint.vaultId}`
  }
  return endpoint.type
}

export async function transferFundsBetweenEndpoints(
  ctx: MutationCtx,
  args: {
    roster: Doc<'rosterStudents'>
    from: TransferEndpoint
    to: TransferEndpoint
    amountCents: number
    nowMs: number
  }
): Promise<void> {
  if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error('Amount must be a positive integer number of cents.')
  }

  if (endpointKey(args.from) === endpointKey(args.to)) {
    throw new Error('Choose two different accounts.')
  }

  const { from, to, amountCents, nowMs, roster } = args

  if (from.type === 'checking' && to.type === 'savings') {
    await moveBetweenStudentAccounts(ctx, {
      roster,
      fromKind: 'checking',
      toKind: 'savings',
      amountCents,
      entryType: 'internal_transfer',
      label: 'Transfer to Savings',
      createdAt: nowMs,
      insufficientFundsMessage: 'Insufficient checking balance.',
    })
    return
  }

  if (from.type === 'savings' && to.type === 'checking') {
    await moveBetweenStudentAccounts(ctx, {
      roster,
      fromKind: 'savings',
      toKind: 'checking',
      amountCents,
      entryType: 'internal_transfer',
      label: 'Transfer to Checking',
      createdAt: nowMs,
      insufficientFundsMessage: 'Insufficient unallocated savings.',
    })
    return
  }

  if (from.type === 'savings' && to.type === 'vault') {
    await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: to.vaultId,
      direction: 'to_vault',
      amountCents,
      nowMs,
    })
    return
  }

  if (from.type === 'vault' && to.type === 'savings') {
    await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: from.vaultId,
      direction: 'from_vault',
      amountCents,
      nowMs,
    })
    return
  }

  if (from.type === 'checking' && to.type === 'vault') {
    await moveBetweenStudentAccounts(ctx, {
      roster,
      fromKind: 'checking',
      toKind: 'savings',
      amountCents,
      entryType: 'internal_transfer',
      label: 'Transfer to Savings',
      createdAt: nowMs,
      insufficientFundsMessage: 'Insufficient checking balance.',
    })
    await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: to.vaultId,
      direction: 'to_vault',
      amountCents,
      nowMs,
    })
    return
  }

  if (from.type === 'vault' && to.type === 'checking') {
    await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: from.vaultId,
      direction: 'from_vault',
      amountCents,
      nowMs,
    })
    await moveBetweenStudentAccounts(ctx, {
      roster,
      fromKind: 'savings',
      toKind: 'checking',
      amountCents,
      entryType: 'internal_transfer',
      label: 'Transfer to Checking',
      createdAt: nowMs,
      insufficientFundsMessage: 'Insufficient unallocated savings.',
    })
    return
  }

  if (from.type === 'vault' && to.type === 'vault') {
    await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: from.vaultId,
      direction: 'from_vault',
      amountCents,
      nowMs,
    })
    await manualVaultTransferForStudent(ctx, {
      roster,
      vaultId: to.vaultId,
      direction: 'to_vault',
      amountCents,
      nowMs,
    })
    return
  }

  throw new Error('Unsupported transfer.')
}
