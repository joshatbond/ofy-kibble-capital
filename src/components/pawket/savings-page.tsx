import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowLeftRight, CreditCard, PiggyBank } from 'lucide-react'

import { MoneyAmount } from '~/components/money-amount'
import { PawketActivityFeed } from '~/components/pawket/activity-feed'
import { Case, SwitchOn } from '~/components/switch-on'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import { usePawketBankingData } from '~/hooks/use-pawket-banking-data'

import type { FunctionReturnType } from 'convex/server'

export function PawketSavingsPage() {
  const { isOnline, balances, activity, activityRows } = usePawketBankingData({
    activityPageSize: 20,
    accountKind: 'savings',
  })
  const vaults = useQuery(api.features.vaults.listMyVaults)

  return (
    <main className="grid gap-6 px-4 py-6 pb-8">
      <SwitchOn>
        <Case predicate={balances === undefined}>
          <p className="text-muted-foreground text-sm">Loading…</p>
        </Case>

        <Case predicate={balances === null}>
          <p className="text-muted-foreground text-sm">
            Student account required.
          </p>
        </Case>

        <Case predicate={balances != null}>
          <SavingsBalancesSections balances={balances} />
        </Case>
      </SwitchOn>

      <section className="grid grid-cols-2 gap-4">
        <Link
          to="/pawket/transfer"
          className="border-ink bg-primary text-primary-foreground shadow-brutal flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
          Transfer
        </Link>

        <Link
          to="/pawket/checking"
          className="border-ink bg-secondary text-secondary-foreground shadow-brutal flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <CreditCard className="size-4" aria-hidden />
          Deposit
        </Link>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">Vaults</h3>

          <Link
            to="/pawket/savings/vaults/setup"
            className="text-primary text-sm font-bold"
          >
            + Create new
          </Link>
        </div>

        <SavingsVaultsPreview vaults={vaults} />
      </section>

      <section className="grid gap-3">
        <h3 className="font-heading text-lg font-bold">Activity</h3>

        <SwitchOn>
          <Case predicate={activity.status === 'LoadingFirstPage' && isOnline}>
            <p className="text-muted-foreground text-sm">Loading activity…</p>
          </Case>

          <Case>
            <PawketActivityFeed
              rows={activityRows}
              variant="list"
              detailBasePath="/pawket/savings"
              emptyMessage="No savings activity yet."
              canLoadMore={isOnline && activity.status === 'CanLoadMore'}
              onLoadMore={() => activity.loadMore(20)}
            />
          </Case>
        </SwitchOn>
      </section>
    </main>
  )
}

function SavingsBalancesSections(props: {
  balances: PawketStudentBalances | null | undefined
}) {
  if (props.balances == null) {
    return null
  }

  const balances = props.balances

  return (
    <>
      <section className="grid gap-1">
        <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Balance total
        </p>

        <h2 className="font-heading text-4xl font-extrabold">
          <MoneyAmount cents={balances.savingsCents} />
        </h2>
      </section>

      <section className="border-ink bg-accent shadow-brutal relative overflow-hidden rounded-xl border-2 p-6">
        <PiggyBank
          className="text-foreground/10 absolute -top-4 -right-4 size-28"
          aria-hidden
        />

        <div className="border-ink bg-foreground text-background mb-4 inline-flex rounded-full border-2 px-3 py-1 text-xs font-bold">
          Current APY: {balances.savingsApyPercent.toFixed(1)}%
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase opacity-70">
              Total in savings
            </p>

            <p className="font-heading text-xl font-bold">
              <MoneyAmount cents={balances.savingsUnallocatedCents} />
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase opacity-70">
              Total in vaults
            </p>

            <p className="font-heading text-xl font-bold">
              <MoneyAmount cents={balances.vaultsTotalCents} />
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

function SavingsVaultsPreview(props: {
  vaults:
    | FunctionReturnType<typeof api.features.vaults.listMyVaults>
    | undefined
}) {
  return (
    <SwitchOn>
      <Case predicate={props.vaults === undefined}>
        <p className="text-muted-foreground text-sm">Loading vaults…</p>
      </Case>

      <Case predicate={props.vaults != null && props.vaults.length === 0}>
        <div className="border-ink bg-muted text-muted-foreground rounded-xl border-2 border-dashed p-6 text-sm">
          <p>No vaults yet. Create one to start saving toward a goal.</p>

          <Link
            to="/pawket/savings/vaults/setup"
            className="text-primary mt-2 inline-block text-sm font-bold"
          >
            Create vault
          </Link>
        </div>
      </Case>

      <Case predicate={props.vaults != null}>
        <div className="grid gap-3">
          <div className="border-ink bg-card divide-ink divide-y-2 overflow-clip rounded-xl border-2">
            <For data={props.vaults ?? []} getKey={vault => vault._id}>
              {vault => (
                <Link
                  to="/pawket/savings/vaults/$vaultId"
                  params={{ vaultId: vault._id }}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <span aria-hidden>{vault.icon}</span>

                    {vault.name}
                  </span>

                  <span className="font-bold tabular-nums">
                    <MoneyAmount cents={vault.balanceCents} />
                  </span>
                </Link>
              )}
            </For>
          </div>

          <Link
            to="/pawket/savings/vaults"
            className="text-primary text-sm font-bold"
          >
            Manage vaults
          </Link>
        </div>
      </Case>
    </SwitchOn>
  )
}

type PawketStudentBalances = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyBalances>
>
