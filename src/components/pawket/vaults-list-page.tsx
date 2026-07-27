import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowLeft, Plus } from 'lucide-react'

import { MoneyAmount } from '~/components/money-amount'
import { fundingModeLabel } from '~/components/pawket/vault-display'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'

import type { FunctionReturnType } from 'convex/server'

export function PawketVaultsListPage() {
  const vaults = useQuery(api.features.vaults.listMyVaults)

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <PawketSubNavLink to="/pawket/savings" label="Back to savings" />

      <section className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-extrabold">Vault goals</h1>

          <p className="text-muted-foreground text-sm">
            Specialized savings buckets for things you are working toward.
          </p>
        </div>

        <Button asChild variant="brutal" className="h-auto shrink-0 px-3 py-2">
          <Link to="/pawket/savings/vaults/setup">
            <Plus className="size-4" aria-hidden />

            <span className="sr-only">Create vault</span>
          </Link>
        </Button>
      </section>

      <SwitchOn>
        <Case predicate={vaults === undefined}>
          <p className="text-muted-foreground text-sm">Loading vaults…</p>
        </Case>

        <Case predicate={vaults != null && vaults.length === 0}>
          <section className="border-ink bg-muted text-muted-foreground rounded-xl border-2 border-dashed p-6 text-sm">
            <p className="text-foreground font-bold">No vaults yet</p>

            <p className="mt-2">
              Create a vault to set aside savings for a goal. You can fund it on
              payday, on a schedule, or manually.
            </p>

            <Button
              asChild
              variant="brutal"
              className="bg-accent text-accent-foreground mt-4 h-auto w-full py-3 text-sm font-bold"
            >
              <Link to="/pawket/savings/vaults/setup">
                Create your first vault
              </Link>
            </Button>
          </section>
        </Case>

        <Case predicate={vaults != null}>
          <section className="grid gap-3">
            <h2 className="font-heading text-lg font-bold">Your vaults</h2>

            <div className="grid gap-3">
              <For data={vaults ?? []} getKey={vault => vault._id}>
                {vault => <VaultListRow vault={vault} />}
              </For>
            </div>
          </section>
        </Case>
      </SwitchOn>
    </main>
  )
}
export function PawketSubNavLink(
  props:
    | {
        to:
          | '/pawket'
          | '/pawket/checking'
          | '/pawket/savings'
          | '/pawket/savings/vaults'
        label: string
      }
    | {
        to: '/pawket/savings/vaults/$vaultId'
        label: string
        vaultId: string
      }
) {
  if (props.to === '/pawket/savings/vaults/$vaultId') {
    return (
      <Link
        to="/pawket/savings/vaults/$vaultId"
        params={{ vaultId: props.vaultId }}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {props.label}
      </Link>
    )
  }

  return (
    <Link
      to={props.to}
      className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold transition-colors"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {props.label}
    </Link>
  )
}
function VaultListRow(props: { vault: VaultRow }) {
  const vault = props.vault
  const progress =
    vault.goalCents != null && vault.goalCents > 0
      ? Math.min(100, Math.round((vault.balanceCents / vault.goalCents) * 100))
      : null

  return (
    <Link
      to="/pawket/savings/vaults/$vaultId"
      params={{ vaultId: vault._id }}
      className="border-ink bg-card shadow-brutal block rounded-xl border-2 p-4 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {vault.icon}
          </span>

          <div className="grid gap-0.5">
            <p className="font-heading text-base font-bold">{vault.name}</p>

            <p className="text-muted-foreground text-xs font-bold">
              {fundingModeLabel(vault)}

              {vault.status === 'complete' ? ' · Complete' : ''}
            </p>
          </div>
        </div>

        <p className="font-heading text-base font-extrabold tabular-nums">
          <MoneyAmount cents={vault.balanceCents} />
        </p>
      </div>

      {progress != null && vault.goalCents != null ? (
        <div className="mt-3 grid gap-1">
          <div className="bg-muted border-ink h-2 overflow-hidden rounded-full border">
            <div
              className="bg-primary h-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-muted-foreground text-xs">
            {progress}% of <MoneyAmount cents={vault.goalCents} />
          </p>
        </div>
      ) : null}
    </Link>
  )
}
type VaultRow = NonNullable<
  FunctionReturnType<typeof api.features.vaults.listMyVaults>
>[number]
