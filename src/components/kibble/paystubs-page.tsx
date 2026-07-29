import { Link } from '@tanstack/react-router'
import { usePaginatedQuery } from 'convex/react'
import { ArrowLeft } from 'lucide-react'

import { MoneyAmount } from '~/components/money-amount'
import { Case, SwitchOn } from '~/components/switch-on'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import { cn } from '~/lib/class-name-merge'
import { formatIsoDay } from '~/lib/format-iso-day'
import { formatCentsAmount } from '~/lib/format-money'

import type { FunctionReturnType } from 'convex/server'

const INITIAL_PAYSTUBS = 10

export function KibblePaystubsPage() {
  const stubs = usePaginatedQuery(
    api.features.payroll.listMyPaystubs,
    {},
    { initialNumItems: INITIAL_PAYSTUBS }
  )

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-6">
      <Link
        to="/kibble"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md text-sm font-bold focus-visible:ring-3 focus-visible:outline-none"
      >
        <span className="inline-flex items-center gap-2">
          <ArrowLeft className="size-4" aria-hidden />
          Dashboard
        </span>
      </Link>

      <header className="grid gap-1">
        <h1 className="font-heading text-primary text-2xl font-extrabold">
          Pay
        </h1>

        <p className="text-muted-foreground text-sm">Your posted paystubs.</p>
      </header>

      <SwitchOn>
        <Case predicate={stubs.status === 'LoadingFirstPage'}>
          <p className="text-muted-foreground text-sm">Loading paystubs…</p>
        </Case>

        <Case predicate={stubs.results.length === 0}>
          <p className="text-muted-foreground text-sm">
            No paystubs yet. Your next payday will show up here.
          </p>
        </Case>

        <Case>
          <PaystubList
            stubs={stubs.results}
            canLoadMore={stubs.status === 'CanLoadMore'}
            isLoadingMore={stubs.status === 'LoadingMore'}
            onLoadMore={() => stubs.loadMore(INITIAL_PAYSTUBS)}
          />
        </Case>
      </SwitchOn>
    </main>
  )
}

function PaystubList(props: {
  stubs: Array<PaystubListItem>
  canLoadMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}) {
  const latest = props.stubs[0]
  const history = props.stubs.slice(1)

  return (
    <div className="grid gap-8">
      <section className="grid gap-3" aria-labelledby="paystub-latest-heading">
        <h2
          id="paystub-latest-heading"
          className="font-heading text-sm font-bold tracking-wide uppercase"
        >
          Latest
        </h2>

        <PaystubRow stub={latest} featured />
      </section>

      {history.length > 0 || props.canLoadMore ? (
        <section
          className="grid gap-3"
          aria-labelledby="paystub-history-heading"
        >
          <h2
            id="paystub-history-heading"
            className="font-heading text-sm font-bold tracking-wide uppercase"
          >
            History
          </h2>

          {history.length > 0 ? (
            <ul className="grid gap-3">
              <For data={history} getKey={stub => stub._id}>
                {stub => (
                  <li>
                    <PaystubRow stub={stub} />
                  </li>
                )}
              </For>
            </ul>
          ) : null}

          {props.canLoadMore ? (
            <button
              type="button"
              onClick={props.onLoadMore}
              disabled={props.isLoadingMore}
              className="border-ink bg-card shadow-brutal focus-visible:ring-ring rounded-xl border-2 px-4 py-3 text-sm font-bold focus-visible:ring-3 focus-visible:outline-none disabled:opacity-50"
            >
              {props.isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

function PaystubRow(props: { stub: PaystubListItem; featured?: boolean }) {
  const stub = props.stub
  const paidLabel = `Paid ${formatIsoDay(stub.payDate)}`
  const ariaParts = [
    paidLabel,
    `net ${formatCentsAmount(stub.netPayCents)} bark bucks`,
  ]
  if (stub.isNew) {
    ariaParts.push('new')
  }
  if (stub.isCorrection) {
    ariaParts.push('correction')
  }

  return (
    <Link
      to="/kibble/pay/$id"
      params={{ id: stub._id }}
      aria-label={ariaParts.join(', ')}
      className={cn(
        'border-ink bg-card shadow-brutal focus-visible:ring-ring block rounded-xl border-2 p-4 transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:outline-none',
        props.featured && 'shadow-brutal-lg'
      )}
    >
      <div aria-hidden>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="font-heading text-lg font-bold">{paidLabel}</p>

            <p className="text-muted-foreground text-xs font-bold">
              {formatIsoDay(stub.periodStartDate)}

              {' – '}

              {formatIsoDay(stub.periodEndDate)}
            </p>
          </div>

          <div className="grid justify-items-end gap-1">
            {stub.isNew ? (
              <span className="bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase">
                New
              </span>
            ) : null}

            {stub.isCorrection ? (
              <span className="text-muted-foreground text-[10px] font-bold uppercase">
                Correction
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="grid gap-0.5">
            <span className="text-muted-foreground text-xs font-bold">
              Gross
            </span>

            <MoneyAmount
              cents={stub.grossPayCents}
              className="text-sm font-bold"
            />
          </div>

          <div className="grid justify-items-end gap-0.5">
            <span className="text-muted-foreground text-xs font-bold">Net</span>

            <MoneyAmount
              cents={stub.netPayCents}
              className="font-heading text-xl font-extrabold"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

type PaystubListItem = FunctionReturnType<
  typeof api.features.payroll.listMyPaystubs
>['page'][number]
