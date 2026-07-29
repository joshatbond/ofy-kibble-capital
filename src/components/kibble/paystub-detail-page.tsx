import { Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

import { MoneyAmount } from '~/components/money-amount'
import { api } from '~/convex/_generated/api'
import { formatIsoDay } from '~/lib/format-iso-day'

import type { FunctionReturnType } from 'convex/server'
import type { ReactNode } from 'react'

export function KibblePaystubDetailPage(props: { paystubId: string }) {
  const stub = useQuery(api.features.payroll.getMyPaystub, {
    paystubId: props.paystubId,
  })
  const markViewed = useMutation(api.features.payroll.markMyPaystubViewed)
  const [markViewedFailed, setMarkViewedFailed] = useState(false)

  useEffect(() => {
    if (stub === undefined || stub === null || !stub.isNew) {
      return
    }
    setMarkViewedFailed(false)
    void markViewed({ paystubId: props.paystubId }).catch(() => {
      setMarkViewedFailed(true)
    })
  }, [stub, markViewed, props.paystubId])

  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-6">
      <Link
        to="/kibble/pay"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md text-sm font-bold focus-visible:ring-3 focus-visible:outline-none"
      >
        <span className="inline-flex items-center gap-2">
          <ArrowLeft className="size-4" aria-hidden />
          Back to pay
        </span>
      </Link>

      {stub === undefined ? (
        <p className="text-muted-foreground text-sm">Loading paystub…</p>
      ) : null}

      {stub === null ? (
        <p className="text-muted-foreground text-sm">Paystub not found.</p>
      ) : null}

      {stub !== undefined && stub !== null ? (
        <>
          {markViewedFailed ? (
            <p className="text-muted-foreground text-sm" role="status">
              Couldn’t clear the new badge. Try opening this paystub again.
            </p>
          ) : null}

          <PaystubDetailContent stub={stub} />
        </>
      ) : null}
    </main>
  )
}
function PaystubDetailContent(props: { stub: PaystubDetail }) {
  const stub = props.stub
  const withholdingTotal =
    stub.federalIncomeTaxCents +
    stub.californiaIncomeTaxCents +
    stub.socialSecurityCents +
    stub.medicareCents +
    stub.caSdiCents

  return (
    <article className="border-ink bg-card shadow-brutal-lg overflow-hidden rounded-xl border-2">
      <header className="bg-primary text-primary-foreground border-ink border-b-2 p-6">
        <p className="text-xs font-bold tracking-wide uppercase opacity-90">
          Paystub · {stub.schoolYear}
        </p>

        <h1 className="font-heading mt-1 text-2xl font-extrabold">
          Paid {formatIsoDay(stub.payDate)}
        </h1>

        <p className="mt-1 text-xs font-bold opacity-90">
          Period {formatIsoDay(stub.periodStartDate)}

          {' – '}

          {formatIsoDay(stub.periodEndDate)}
        </p>

        {stub.isCorrection ? (
          <p className="mt-3 text-xs font-bold">
            Correction
            {stub.correctionReason ? `: ${stub.correctionReason}` : ''}
          </p>
        ) : null}
      </header>

      <div className="grid gap-5 p-6">
        <Section title="Hours">
          <Line
            label="Days attended"
            value={`${String(stub.daysAttended)} × ${String(stub.standardDayHours)}h`}
          />

          <Line
            label="Base pay"
            value={<MoneyAmount cents={stub.basePayCents} />}
          />

          <Line
            label={`Overtime (${String(stub.overtimeHours)}h)`}
            value={<MoneyAmount cents={stub.overtimePayCents} />}
          />
        </Section>

        <Section title="Gross">
          <Line
            label="Gross pay"
            value={
              <MoneyAmount
                cents={stub.grossPayCents}
                className="font-heading text-lg font-extrabold"
              />
            }
            emphasis
          />
        </Section>

        <Section title="Pre-tax">
          <Line
            label="401(k)"
            value={
              <MoneyAmount cents={stub.retirement401kCents} sign="minus" />
            }
          />

          <Line
            label="Medical insurance"
            value={
              <MoneyAmount cents={stub.medicalInsuranceCents} sign="minus" />
            }
          />

          <Line
            label="Taxable wages"
            value={<MoneyAmount cents={stub.taxableWagesCents} />}
          />
        </Section>

        <Section title="Withholding">
          <Line
            label="Federal income tax"
            value={
              <MoneyAmount cents={stub.federalIncomeTaxCents} sign="minus" />
            }
          />

          <Line
            label="California income tax"
            value={
              <MoneyAmount
                cents={stub.californiaIncomeTaxCents}
                sign="minus"
              />
            }
          />

          <Line
            label="Social Security"
            value={
              <MoneyAmount cents={stub.socialSecurityCents} sign="minus" />
            }
          />

          <Line
            label="Medicare"
            value={<MoneyAmount cents={stub.medicareCents} sign="minus" />}
          />

          <Line
            label="CA SDI"
            value={<MoneyAmount cents={stub.caSdiCents} sign="minus" />}
          />

          <Line
            label="Total withholding"
            value={<MoneyAmount cents={withholdingTotal} sign="minus" />}
            emphasis
          />
        </Section>

        <Section title="Net">
          <Line
            label="Net pay"
            value={
              <MoneyAmount
                cents={stub.netPayCents}
                className="font-heading text-2xl font-extrabold"
              />
            }
            emphasis
          />

          <Line
            label="YTD gross"
            value={<MoneyAmount cents={stub.ytdGrossCents} />}
          />

          <Line
            label="YTD net"
            value={<MoneyAmount cents={stub.ytdNetPayCents} />}
          />
        </Section>
      </div>
    </article>
  )
}
function Section(props: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="font-heading text-sm font-bold tracking-wide uppercase">
        {props.title}
      </h2>

      <div className="grid gap-2">{props.children}</div>
    </section>
  )
}
function Line(props: {
  label: string
  value: ReactNode
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={
          props.emphasis ? 'font-heading font-bold' : 'text-muted-foreground'
        }
      >
        {props.label}
      </span>

      <span className={props.emphasis ? 'font-bold' : undefined}>
        {props.value}
      </span>
    </div>
  )
}
type PaystubDetail = NonNullable<
  FunctionReturnType<typeof api.features.payroll.getMyPaystub>
>
