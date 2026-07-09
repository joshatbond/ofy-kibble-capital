import { Link } from '@tanstack/react-router'
import { ArrowLeftRight, Building2, Send, Wallet } from 'lucide-react'

import { PawketActivityFeed } from '~/components/pawket/activity-feed'
import { MoneyAmount } from '~/components/money-amount'
import { Case, SwitchOn } from '~/components/switch-on'
import type { api } from '~/convex/_generated/api'
import { usePawketBankingData } from '~/hooks/use-pawket-banking-data'

import type { FunctionReturnType } from 'convex/server'
import type { LucideIcon } from 'lucide-react'

export function PawketCheckingPage() {
  const { isOnline, balances, activity, activityRows } = usePawketBankingData({
    activityPageSize: 20,
    accountKind: 'checking',
  })

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

        <Case>
          <CheckingBalanceCard balances={balances} />
        </Case>
      </SwitchOn>

      <section className="grid gap-3">
        <h2 className="font-heading text-lg font-bold">Quick actions</h2>

        <div className="grid grid-cols-2 gap-4">
          <QuickAction
            to="/pawket/transfer"
            label="Transfer"
            icon={ArrowLeftRight}
            chipClass="bg-primary/15 text-primary"
          />

          <QuickAction
            to="/pawket/savings"
            label="Deposit"
            icon={Building2}
            chipClass="bg-secondary/30 text-secondary"
          />

          <QuickAction
            to="/kibble/pay"
            label="Pay"
            icon={Wallet}
            chipClass="bg-accent text-accent-foreground"
          />

          <QuickAction
            to="/pawket/transfer"
            label="Zelle"
            icon={Send}
            chipClass="bg-primary text-primary-foreground"
          />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Recent activity</h2>

          <span className="text-primary text-sm font-bold underline">
            Checking only
          </span>
        </div>

        <SwitchOn>
          <Case predicate={activity.status === 'LoadingFirstPage' && isOnline}>
            <p className="text-muted-foreground text-sm">Loading activity…</p>
          </Case>

          <Case>
            <PawketActivityFeed
              rows={activityRows}
              variant="list"
              detailBasePath="/pawket/checking"
              emptyMessage="No checking activity yet."
              canLoadMore={isOnline && activity.status === 'CanLoadMore'}
              onLoadMore={() => activity.loadMore(20)}
            />
          </Case>
        </SwitchOn>
      </section>
    </main>
  )
}

function CheckingBalanceCard(props: {
  balances: PawketStudentBalances | null | undefined
}) {
  if (props.balances == null) return null

  return (
    <section className="border-ink bg-accent shadow-brutal-lg rounded-xl border-2 p-6">
      <p className="text-accent-foreground/80 text-xs font-bold tracking-wider uppercase">
        Current balance
      </p>

      <p className="font-heading text-accent-foreground mt-2 text-4xl font-extrabold">
        <MoneyAmount cents={props.balances.checkingCents} />
      </p>
    </section>
  )
}

function QuickAction(props: {
  to: '/pawket/transfer' | '/pawket/savings' | '/kibble/pay'
  label: string
  icon: LucideIcon
  chipClass: string
}) {
  const Icon = props.icon

  return (
    <Link
      to={props.to}
      className="border-ink bg-card shadow-brutal hover:bg-muted/40 flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    >
      <div
        className={`border-ink flex size-12 items-center justify-center rounded-full border-2 shadow-[2px_2px_0_0_var(--ink)] ${props.chipClass}`}
      >
        <Icon className="size-5" aria-hidden />
      </div>

      <span className="text-sm font-bold">{props.label}</span>
    </Link>
  )
}

type PawketStudentBalances = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyBalances>
>
