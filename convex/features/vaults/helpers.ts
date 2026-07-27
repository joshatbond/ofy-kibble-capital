import {
  vaultFundingModeValidator,
  vaultOnDepositRuleValidator,
  vaultScheduleCadenceValidator,
} from '../../schema/schemaFields'
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
