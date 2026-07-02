import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowLeft, History } from 'lucide-react'

import { ActivityLabelIcon } from '~/components/pawket/activity-feed'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { cn } from '~/lib/class-name-merge'
import { formatCents } from '~/lib/format-money'

import type { FunctionReturnType } from 'convex/server'

export function PawketTransactionDetailPage(props: {
  entryId: Id<'ledgerEntries'>
  backTo: '/pawket/checking' | '/pawket/savings' | '/pawket'
  backLabel: string
}) {
  const entry = useQuery(api.features.banking.getMyLedgerEntry, {
    entryId: props.entryId,
  })

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <Link
        to={props.backTo}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />

        {props.backLabel}
      </Link>

      <SwitchOn>
        <Case predicate={entry === undefined}>
          <p className="text-muted-foreground text-sm">Loading transaction…</p>
        </Case>

        <Case predicate={entry === null}>
          <p className="text-muted-foreground text-sm">
            Transaction not found.
          </p>
        </Case>

        <Case predicate={entry != null}>
          <TransactionDetailContent entry={entry} backTo={props.backTo} />
        </Case>
      </SwitchOn>
    </main>
  )
}
function TransactionDetailContent(props: {
  entry: PawketLedgerEntry | null | undefined
  backTo: '/pawket/checking' | '/pawket/savings' | '/pawket'
}) {
  if (props.entry == null) {
    return null
  }

  const entry = props.entry

  return (
    <>
      <article className="border-ink bg-card shadow-brutal-lg overflow-hidden rounded-xl border-2">
        <header className="bg-primary text-primary-foreground border-ink border-b-2 p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <span className="border-ink bg-accent text-accent-foreground rounded-full border-2 px-3 py-1 text-xs font-bold shadow-[2px_2px_0_0_var(--ink)]">
              {entry.direction === 'debit' ? 'Debit' : 'Credit'}
            </span>

            <span className="text-primary-foreground/90 text-xs font-bold">
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="font-heading text-2xl font-extrabold">
            {entry.label}
          </h1>

          <p className="text-primary-foreground/90 mt-1 text-xs font-bold">
            Ref #{entry.entryId.slice(-8).toUpperCase()}
          </p>
        </header>

        <div className="grid gap-4 p-6">
          <DetailRow label="Category" value={entryTypeLabel(entry.entryType)} />

          <DetailRow
            label="Account"
            value={entry.accountKind === 'checking' ? 'Checking' : 'Savings'}
          />

          <DetailRow
            label="Date"
            value={new Date(entry.createdAt).toLocaleString()}
          />

          <div className="border-ink my-2 border-t-2 border-dashed" />

          <div className="flex items-center justify-between gap-4">
            <span className="font-heading text-lg font-bold">Total amount</span>

            <span
              className={cn(
                'font-heading text-2xl font-extrabold',
                entry.direction === 'debit'
                  ? 'text-destructive'
                  : 'text-secondary'
              )}
            >
              {entry.direction === 'debit' ? '−' : '+'}

              {formatCents(entry.amountCents)}
            </span>
          </div>
        </div>

        <div
          className="h-4 w-full bg-[radial-gradient(circle,transparent_8px,var(--ink)_8px)] bg-size-[24px_24px] bg-repeat-x"
          aria-hidden
        />
      </article>

      <Button
        asChild
        variant="brutal"
        className="h-auto w-full gap-2 py-4 text-sm font-bold"
      >
        <Link to={props.backTo}>
          Back to activity
          <History className="size-4" aria-hidden />
        </Link>
      </Button>

      <div className="border-ink bg-muted relative overflow-hidden rounded-xl border-2">
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="font-heading text-lg font-bold">
            {entry.direction === 'credit'
              ? 'Nice deposit! Keep building your pawsome wealth.'
              : 'Spending tracked — check your balances anytime.'}
          </p>
        </div>

        <div className="flex h-40 items-center justify-center opacity-20">
          <ActivityLabelIcon label={entry.label} className="size-20" />
        </div>
      </div>
    </>
  )
}
function DetailRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground font-bold">{props.label}</span>

      <span className="font-bold">{props.value}</span>
    </div>
  )
}
function entryTypeLabel(entryType: string): string {
  switch (entryType) {
    case 'sweep_to_checking':
      return 'Sweep to checking'
    case 'internal_transfer':
      return 'Transfer'
    default:
      return 'Activity'
  }
}
type PawketLedgerEntry = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyLedgerEntry>
>
