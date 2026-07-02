import { Link } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  Banknote,
  ShoppingBag,
  Utensils,
  Wallet,
} from 'lucide-react'

import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import type { api } from '~/convex/_generated/api'
import { cn } from '~/lib/class-name-merge'
import { formatCents } from '~/lib/format-money'

import type { FunctionReturnType } from 'convex/server'
import type { LucideIcon } from 'lucide-react'

export function PawketActivityFeed(props: {
  rows: Array<ActivityRow>
  variant?: 'dashboard' | 'list'
  detailBasePath?: '/pawket/checking' | '/pawket/savings'
  emptyMessage?: string
  onLoadMore?: () => void
  canLoadMore?: boolean
}) {
  const variant = props.variant ?? 'list'

  return (
    <SwitchOn>
      <Case predicate={props.rows.length === 0}>
        <p className="text-muted-foreground border-ink bg-muted rounded-xl border-2 p-6 text-sm">
          {props.emptyMessage ??
            'No transactions yet. Pay runs, store purchases, and transfers will appear here.'}
        </p>
      </Case>

      <Case>
        <div
          className={cn(
            variant === 'dashboard' &&
              'border-ink bg-card shadow-brutal divide-ink divide-y-2 overflow-hidden rounded-xl border-2',
            variant === 'list' && 'grid gap-3'
          )}
        >
          <For data={props.rows} getKey={row => row.entryId}>
            {row => (
              <ActivityRowItem
                row={row}
                variant={variant}
                detailBasePath={
                  props.detailBasePath ??
                  (row.accountKind === 'checking'
                    ? '/pawket/checking'
                    : '/pawket/savings')
                }
              />
            )}
          </For>
        </div>

        {props.canLoadMore ? (
          <Button
            type="button"
            variant="brutal-outline"
            className="mt-4"
            onClick={props.onLoadMore}
          >
            Load more
          </Button>
        ) : null}
      </Case>
    </SwitchOn>
  )
}
export function activityIconForLabel(label: string): LucideIcon {
  const lower = label.toLowerCase()
  if (lower.includes('lunch') || lower.includes('food')) {
    return Utensils
  }

  if (lower.includes('store') || lower.includes('shop')) {
    return ShoppingBag
  }

  return Wallet
}

export function ActivityLabelIcon(props: {
  label: string
  className?: string
}) {
  const Icon = activityIconForLabel(props.label)

  return <Icon className={props.className} aria-hidden />
}
export type ActivityRow = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyLedgerEntry>
>
function ActivityRowItem(props: {
  row: ActivityRow
  variant: 'dashboard' | 'list'
  detailBasePath: '/pawket/checking' | '/pawket/savings'
}) {
  const { row } = props
  const icon = activityIcon(row.entryType)
  const isDebit = row.direction === 'debit'
  const amountClass = isDebit ? 'text-destructive' : 'text-secondary'
  const Icon = icon.icon

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'border-ink flex shrink-0 items-center justify-center border-2',
            props.variant === 'dashboard'
              ? 'size-12 rounded-lg'
              : 'size-10 rounded-lg',
            icon.chipClass
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{row.label}</p>

          <p className="text-muted-foreground text-xs">
            {formatActivityWhen(row.createdAt)}
          </p>
        </div>
      </div>

      <p className={cn('shrink-0 text-sm font-bold', amountClass)}>
        {isDebit ? '−' : '+'}

        {formatCents(row.amountCents)}
      </p>
    </>
  )

  if (props.variant === 'dashboard') {
    return (
      <Link
        to={`${props.detailBasePath}/$transactionId`}
        params={{ transactionId: row.entryId }}
        className="hover:bg-muted/50 flex items-center justify-between gap-4 p-4 transition-colors"
      >
        {content}
      </Link>
    )
  }

  return (
    <Link
      to={`${props.detailBasePath}/$transactionId`}
      params={{ transactionId: row.entryId }}
      className="border-ink bg-muted/40 shadow-brutal hover:bg-muted flex items-center justify-between gap-4 rounded-xl border-2 p-3 transition-colors"
    >
      {content}
    </Link>
  )
}
function activityIcon(entryType: ActivityRow['entryType']): {
  icon: LucideIcon
  chipClass: string
} {
  switch (entryType) {
    case 'sweep_to_checking':
      return {
        icon: ArrowLeftRight,
        chipClass: 'bg-primary/15 text-primary',
      }
    case 'internal_transfer':
      return {
        icon: Banknote,
        chipClass: 'bg-secondary/30 text-secondary',
      }
    default:
      return {
        icon: Wallet,
        chipClass: 'bg-accent text-accent-foreground',
      }
  }
}
function formatActivityWhen(createdAt: number): string {
  const date = new Date(createdAt)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return `Today, ${date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (isYesterday) {
    return 'Yesterday'
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
