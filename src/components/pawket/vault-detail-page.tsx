import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { ArrowLeft, ArrowLeftRight, Pencil } from 'lucide-react'
import { useState } from 'react'

import { MoneyAmount } from '~/components/money-amount'
import { fundingModeLabel } from '~/components/pawket/vault-display'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { cn } from '~/lib/class-name-merge'

import type { FunctionReturnType } from 'convex/server'

export function PawketVaultDetailPage(props: { vaultId: string }) {
  const vault = useQuery(api.features.vaults.getMyVault, {
    vaultId: props.vaultId as Id<'vaults'>,
  })
  const balances = useQuery(api.features.banking.getMyBalances)

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <SwitchOn>
        <Case predicate={vault === undefined}>
          <p className="text-muted-foreground text-sm">Loading vault…</p>
        </Case>

        <Case predicate={vault === null}>
          <section className="grid gap-3">
            <Link
              to="/pawket/savings/vaults"
              className="text-muted-foreground hover:text-foreground inline-flex size-6 items-center justify-center"
              aria-label="Back to vaults"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Link>

            <h1 className="font-heading text-2xl font-extrabold">
              Vault not found
            </h1>

            <p className="text-muted-foreground text-sm">
              This vault is missing, closed, or belongs to another account.
            </p>

            <Link
              to="/pawket/savings/vaults"
              className="text-primary text-sm font-bold"
            >
              Return to vaults
            </Link>
          </section>
        </Case>

        <Case predicate={vault != null}>
          {vault != null ? (
            <VaultDetail
              vault={vault}
              savingsApyPercent={balances?.savingsApyPercent}
            />
          ) : null}
        </Case>
      </SwitchOn>
    </main>
  )
}
function VaultDetail(props: {
  vault: Vault
  savingsApyPercent: number | undefined
}) {
  const vault = props.vault
  const progress =
    vault.goalCents != null && vault.goalCents > 0
      ? Math.min(100, Math.round((vault.balanceCents / vault.goalCents) * 100))
      : null

  return (
    <>
      <header className="flex items-center gap-2">
        <Link
          to="/pawket/savings/vaults"
          className="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center"
          aria-label="Back to vaults"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Link>

        <div className="flex min-w-0 grow flex-col items-center text-center">
          <h1 className="font-heading truncate text-base font-extrabold">
            {vault.name}
          </h1>

          <p className="text-muted-foreground truncate text-xs font-bold">
            {fundingModeLabel(vault)}

            {vault.status === 'complete' ? ' · Complete' : ''}
          </p>
        </div>

        <div className="size-6 shrink-0" aria-hidden />
      </header>

      <section className="grid justify-items-center gap-1 text-center">
        <p className="font-heading text-5xl font-extrabold tracking-tight">
          <MoneyAmount cents={vault.balanceCents} />
        </p>

        <p className="text-muted-foreground text-sm font-bold">Vault balance</p>
      </section>

      <section className="border-ink bg-card shadow-brutal grid gap-3 rounded-xl border-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl" aria-hidden>
            {vault.icon}
          </span>

          {props.savingsApyPercent != null ? (
            <p className="text-muted-foreground text-right text-xs font-bold">
              Current APY
              <br />
              <span className="text-foreground text-sm">
                {props.savingsApyPercent.toFixed(1)}%
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm font-bold">
          <span>Goal</span>

          <span>
            {vault.goalCents != null ? (
              <MoneyAmount cents={vault.goalCents} />
            ) : (
              'Uncapped'
            )}
          </span>
        </div>

        {progress != null ? (
          <div className="grid gap-1">
            <div className="bg-muted border-ink h-3 overflow-hidden rounded-full border">
              <div
                className="bg-primary h-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-muted-foreground text-xs font-bold">
              {progress}%
            </p>
          </div>
        ) : null}
      </section>

      <section className="border-ink bg-card shadow-brutal grid grid-cols-2 overflow-hidden rounded-xl border-2">
        <Link
          to="/pawket/savings/vaults/$vaultId/transfer"
          params={{ vaultId: vault._id }}
          className="border-ink hover:bg-muted/60 grid place-items-center gap-1 border-r-2 py-4 text-sm font-bold transition-colors"
        >
          <ArrowLeftRight className="size-5" aria-hidden />
          Transfer
        </Link>

        <Link
          to="/pawket/savings/vaults/$vaultId/edit"
          params={{ vaultId: vault._id }}
          className="hover:bg-muted/60 grid place-items-center gap-1 py-4 text-sm font-bold transition-colors"
        >
          <Pencil className="size-5" aria-hidden />
          Edit
        </Link>
      </section>

      <VaultActivitySection vaultId={vault._id} />

      <CloseVaultSection vault={vault} />
    </>
  )
}
function VaultActivitySection(props: { vaultId: Id<'vaults'> }) {
  const activity = usePaginatedQuery(
    api.features.vaults.listMyVaultActivity,
    { vaultId: props.vaultId },
    { initialNumItems: 8 }
  )

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">Activity</h2>

        <Link
          to="/pawket/savings/vaults/$vaultId/transactions"
          params={{ vaultId: props.vaultId }}
          className="text-primary text-sm font-bold"
        >
          View all
        </Link>
      </div>

      <SwitchOn>
        <Case predicate={activity.status === 'LoadingFirstPage'}>
          <p className="text-muted-foreground text-sm">Loading activity…</p>
        </Case>

        <Case predicate={activity.results.length === 0}>
          <p className="border-ink bg-muted text-muted-foreground rounded-xl border-2 border-dashed p-6 text-sm">
            No vault activity yet. Transfers in and out will show up here.
          </p>
        </Case>

        <Case>
          <div className="border-ink bg-card divide-ink divide-y-2 overflow-hidden rounded-xl border-2">
            <For data={activity.results} getKey={row => row.entryId}>
              {row => <VaultActivityRowItem row={row} />}
            </For>
          </div>
        </Case>
      </SwitchOn>
    </section>
  )
}
function VaultActivityRowItem(props: { row: VaultActivityRow }) {
  const isCredit = props.row.direction === 'credit'
  const createdAt = new Date(props.row.createdAt).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="grid min-w-0 gap-0.5">
        <p className="truncate text-sm font-bold">{props.row.label}</p>

        <p className="text-muted-foreground text-xs">{createdAt}</p>
      </div>

      <p
        className={cn(
          'shrink-0 text-sm font-bold tabular-nums',
          isCredit && 'text-primary'
        )}
      >
        <MoneyAmount
          cents={props.row.amountCents}
          sign={isCredit ? 'plus' : 'minus'}
        />
      </p>
    </div>
  )
}
function CloseVaultSection(props: { vault: Vault }) {
  const navigate = useNavigate()
  const closeVault = useMutation(api.features.vaults.closeVault)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const canClose = props.vault.balanceCents === 0

  async function handleClose() {
    if (!canClose) return

    setError(null)
    setClosing(true)
    try {
      await closeVault({ vaultId: props.vault._id })
      await navigate({ to: '/pawket/savings/vaults', replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete vault.')
    } finally {
      setClosing(false)
    }
  }

  return (
    <section className="grid gap-2">
      <SwitchOn>
        <Case predicate={canClose}>
          <Button
            type="button"
            variant="destructive"
            className="border-ink h-auto w-full justify-between rounded-xl border-2 px-4 py-4 text-sm font-bold"
            disabled={closing}
            onClick={() => void handleClose()}
          >
            <span>{closing ? 'Deleting…' : 'Delete vault'}</span>

            <span aria-hidden>›</span>
          </Button>
        </Case>

        <Case>
          <p className="text-muted-foreground text-sm">
            Move all funds out of this vault before you can delete it.
          </p>
        </Case>
      </SwitchOn>

      {error ? (
        <p className="text-destructive text-sm font-bold" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
type Vault = NonNullable<
  FunctionReturnType<typeof api.features.vaults.getMyVault>
>
type VaultActivityRow = FunctionReturnType<
  typeof api.features.vaults.listMyVaultActivity
>['page'][number]
