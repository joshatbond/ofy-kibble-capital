import { ArrowLeftRight, Wallet } from 'lucide-react'

import { Case, SwitchOn } from '~/components/switch-on'
import { MoneyAmount } from '~/components/money-amount'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import type { api } from '~/convex/_generated/api'
import { cn } from '~/lib/class-name-merge'

import type { FunctionReturnType } from 'convex/server'
import type { LucideIcon } from 'lucide-react'

export function AdminClassroomActivityFeed(props: {
  rows: Array<ClassroomActivityRow>
  emptyMessage?: string
  onLoadMore?: () => void
  canLoadMore?: boolean
}) {
  return (
    <SwitchOn>
      <Case predicate={props.rows.length === 0}>
        <p className="text-muted-foreground border-ink bg-muted rounded-xl border-2 p-6 text-sm">
          {props.emptyMessage ?? 'No classroom banking activity yet.'}
        </p>
      </Case>

      <Case>
        <div className="grid gap-3">
          <For data={props.rows} getKey={row => row.entryId}>
            {row => <AdminClassroomActivityRowItem row={row} />}
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

function AdminClassroomActivityRowItem(props: { row: ClassroomActivityRow }) {
  const { row } = props
  const icon = activityIcon(row.entryType)
  const isDebit = row.direction === 'debit'
  const Icon = icon.icon

  return (
    <article className="border-ink bg-card shadow-brutal grid gap-3 rounded-xl border-2 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              'border-ink flex size-10 shrink-0 items-center justify-center rounded-lg border-2',
              icon.chipClass
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>

          <div className="grid min-w-0 gap-1">
            <p className="truncate text-sm font-bold">{row.label}</p>

            <p className="text-muted-foreground text-xs">
              {`${row.studentDisplayName} · ${row.accountKind} · ${formatActivityWhen(row.createdAt)}`}
            </p>
          </div>
        </div>

        <MoneyAmount
          cents={row.amountCents}
          sign={isDebit ? 'minus' : 'plus'}
          className={cn(
            'shrink-0 text-sm font-bold',
            isDebit ? 'text-destructive' : 'text-secondary-30'
          )}
        />
      </div>
    </article>
  )
}

function activityIcon(entryType: ClassroomActivityRow['entryType']): {
  icon: LucideIcon
  chipClass: string
} {
  switch (entryType) {
    case 'sweep_to_checking':
      return {
        icon: Wallet,
        chipClass: 'bg-muted text-muted-foreground',
      }
    case 'internal_transfer':
      return {
        icon: ArrowLeftRight,
        chipClass: 'bg-primary/15 text-primary',
      }
    default:
      return {
        icon: Wallet,
        chipClass: 'bg-accent text-accent-foreground',
      }
  }
}

function formatActivityWhen(createdAt: number): string {
  return new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

type ClassroomActivityRow = FunctionReturnType<
  typeof api.features.banking.listClassroomActivityHistory
>['page'][number]
