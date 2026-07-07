import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ChevronDown, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'

import { PawketActivityFeed } from '~/components/pawket/activity-feed'
import { MoneyAmount } from '~/components/money-amount'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { api } from '~/convex/_generated/api'
import { usePawketBankingData } from '~/hooks/use-pawket-banking-data'
import { cn } from '~/lib/class-name-merge'
import { displayFirstName } from '~/lib/pawket-nav'

import type { FunctionReturnType } from 'convex/server'
import type { ReactNode } from 'react'

export function PawketDashboardPage() {
  const { isOnline, balances, activity, activityRows } = usePawketBankingData({
    activityPageSize: 5,
  })
  const profile = useQuery(
    api.features.users.viewerProfile,
    isOnline ? {} : 'skip'
  )
  const [checkingOpen, setCheckingOpen] = useState(true)
  const [savingsOpen, setSavingsOpen] = useState(false)

  const firstName = displayFirstName(profile ?? null)

  return (
    <main className="grid gap-6 px-4 py-6">
      <section className="grid gap-1">
        <h1 className="font-heading text-2xl font-extrabold">
          Hello, {firstName}! 👋
        </h1>

        <p className="text-muted-foreground text-base">
          Ready to manage your pawsome wealth?
        </p>
      </section>

      <SwitchOn>
        <Case predicate={balances === undefined}>
          <p className="text-muted-foreground text-sm">Loading balances…</p>
        </Case>

        <Case predicate={balances === null}>
          <section className="border-ink bg-card shadow-brutal grid gap-3 rounded-xl border-2 p-6">
            <h2 className="font-heading text-lg font-bold">
              Student account required
            </h2>

            <p className="text-muted-foreground text-sm">
              Accept your classroom invitation to view balances and activity.
            </p>
          </section>
        </Case>

        <Case predicate={balances != null}>
          <DashboardBalancesSections
            balances={balances}
            checkingOpen={checkingOpen}
            savingsOpen={savingsOpen}
            onCheckingToggle={() => setCheckingOpen(current => !current)}
            onSavingsToggle={() => setSavingsOpen(current => !current)}
          />
        </Case>
      </SwitchOn>

      <section className="grid gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading text-lg font-bold">Activity feed</h2>

          <Link
            to="/pawket/checking"
            className="text-primary text-sm font-bold"
          >
            See all
          </Link>
        </div>

        <SwitchOn>
          <Case predicate={activity.status === 'LoadingFirstPage' && isOnline}>
            <p className="text-muted-foreground text-sm">Loading activity…</p>
          </Case>

          <Case>
            <PawketActivityFeed
              rows={activityRows}
              variant="dashboard"
              emptyMessage="No transactions yet. Pay runs, store purchases, and transfers will appear here."
            />
          </Case>
        </SwitchOn>
      </section>
    </main>
  )
}
function DashboardBalancesSections(props: {
  balances: PawketStudentBalances | null | undefined
  checkingOpen: boolean
  savingsOpen: boolean
  onCheckingToggle: () => void
  onSavingsToggle: () => void
}) {
  if (props.balances == null) {
    return null
  }

  const balances = props.balances

  return (
    <>
      <section className="grid gap-3">
        <AccountAccordion
          title="Checking Account"
          amount={<MoneyAmount cents={balances.checkingCents} />}
          icon={Wallet}
          iconClass="text-secondary"
          summaryClass="bg-secondary/20"
          open={props.checkingOpen}
          onToggle={props.onCheckingToggle}
        >
          <div className="grid gap-2 text-sm">
            <div className="text-muted-foreground flex justify-between">
              <span>Available balance</span>

              <span>
                <MoneyAmount cents={balances.checkingCents} />
              </span>
            </div>

            <div className="text-muted-foreground flex justify-between">
              <span>Pending transfers</span>

              <MoneyAmount cents={0} sign="minus" />
            </div>

            <Button
              asChild
              variant="brutal"
              className="mt-2 h-auto w-full py-3 font-bold"
            >
              <Link to="/pawket/checking">View checking</Link>
            </Button>
          </div>
        </AccountAccordion>

        <AccountAccordion
          title="Savings Account"
          amount={<MoneyAmount cents={balances.savingsCents} />}
          icon={PiggyBank}
          iconClass="text-accent-foreground"
          summaryClass="bg-accent/30"
          open={props.savingsOpen}
          onToggle={props.onSavingsToggle}
        >
          <div className="grid gap-3 text-sm">
            <p className="text-muted-foreground">
              Vault goals arrive in a future update — for now, all savings stay
              unallocated.
            </p>

            <Button
              asChild
              variant="brutal"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto w-full py-3 font-bold"
            >
              <Link to="/pawket/savings/vaults">View goals</Link>
            </Button>
          </div>
        </AccountAccordion>
      </section>

      <section className="grid gap-3">
        <h2 className="font-heading px-1 text-lg font-bold">Insights</h2>

        <div className="flex gap-4 overflow-x-auto pb-2">
          <InsightCard
            label="Net worth"
            value={
              <MoneyAmount
                cents={balances.checkingCents + balances.savingsCents}
              />
            }
            className="bg-primary text-primary-foreground min-w-60"
          />

          <InsightCard
            label="Savings APY"
            value={`${balances.savingsApyPercent.toFixed(1)}%`}
            className="bg-secondary text-secondary-foreground min-w-60"
            footer={
              <div className="mt-3 flex items-center gap-1 text-sm font-bold opacity-90">
                <TrendingUp className="size-4" aria-hidden />
                Earning on total savings
              </div>
            }
          />
        </div>
      </section>
    </>
  )
}
function AccountAccordion(props: {
  title: string
  amount: ReactNode
  icon: typeof Wallet
  iconClass: string
  summaryClass: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const Icon = props.icon

  return (
    <div className="border-ink bg-card shadow-brutal overflow-hidden rounded-xl border-2">
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-3 p-4 text-left transition-colors',
          props.summaryClass
        )}
        onClick={props.onToggle}
        aria-expanded={props.open}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn('size-5', props.iconClass)} aria-hidden />

          <span className="text-sm font-bold">{props.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold">{props.amount}</span>

          <ChevronDown
            className={cn(
              'size-5 transition-transform',
              props.open && 'rotate-180'
            )}
            aria-hidden
          />
        </div>
      </button>

      {props.open ? (
        <div className="border-ink border-t-2 p-4">{props.children}</div>
      ) : null}
    </div>
  )
}
function InsightCard(props: {
  label: string
  value: ReactNode
  className: string
  footer?: ReactNode
}) {
  return (
    <div
      className={cn(
        'border-ink shadow-brutal rounded-xl border-2 p-4',
        props.className
      )}
    >
      <p className="text-sm font-bold opacity-80">{props.label}</p>

      <p className="font-heading mt-1 text-2xl font-extrabold">{props.value}</p>

      {props.footer}
    </div>
  )
}
type PawketStudentBalances = NonNullable<
  FunctionReturnType<typeof api.features.banking.getMyBalances>
>
