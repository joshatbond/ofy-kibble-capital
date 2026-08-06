import { useMutation } from 'convex/react'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { AdminPage } from '~/components/admin/admin-shell'
import { MoneyAmount } from '~/components/money-amount'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '~/components/ui/popover'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { useSafeQuery } from '~/hooks/use-safe-query'
import { cn } from '~/lib/class-name-merge'
import { formatIsoDay } from '~/lib/format-iso-day'
import {
  emptyPaystubsMessage,
  resolvePayRunReportViewState,
  studentPayBreakdown,
} from '~/lib/payroll-admin-report'
import type { PayBreakdownField } from '~/lib/payroll-admin-report'
import { userFacingErrorMessage } from '~/lib/user-facing-error'

import { Case, SwitchOn } from '../switch-on'
import { Field, FieldLabel } from '../ui/field'


import type { FunctionReturnType } from 'convex/server'
import type { ReactNode } from 'react'

export function AdminPayrollPage(props: {
  organizationId: string
  page: PayrollAdminPage
}) {
  const page = props.page
  const details = page.current
  const period = details.period
  const isOpen = period.status === 'open'
  const attendance = details.attendance
  const isReady = attendance.status === 'ready'
  const currentRuns = details.runs.filter(
    run => run.status === 'succeeded' || run.status === 'blocked'
  )
  const [selectedRunId, setSelectedRunId] = useState<Id<'payRuns'> | null>(null)

  return (
    <AdminPage title="Payroll" description="Pay period information">
      <PayrollSection title="Current Period">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(max(100px,30%),1fr))] gap-4">
          <StatusField
            label="Work Window"
            value={`${formatIsoDay(period.startDate)} - ${formatIsoDay(period.endDate)}`}
          />

          <StatusField
            label="Effective payday"
            value={formatIsoDay(details.effectivePayDate)}
          />

          <StatusField
            label="Scheduled payday"
            value={formatIsoDay(period.payDate)}
          />

          <StatusField
            label="Schedule"
            value={
              period.isTransition
                ? 'Transition'
                : formatScheduleType(period.scheduleType)
            }
          />

          <StatusField
            label="Students in period"
            value={String(attendance.activeStudentCount)}
          />

          <StatusField
            label="Period status"
            value={period.status === 'closed' ? 'Closed' : 'Open'}
          />
        </div>

        <div className="flex flex-col gap-4 bg-[#eee] p-6">
          <SwitchOn value={attendance}>
            <Case
              predicate={(
                entry: typeof attendance
              ): entry is Extract<typeof attendance, { status: 'blocked' }> =>
                entry.status === 'blocked'
              }
            >
              {blocked => (
                <>
                  <p className="text-destructive text-sm font-bold">
                    Blocked - fix these before running payroll:
                  </p>

                  <ul className="text-muted-foreground grid list-disc gap-1 pl-5 text-sm">
                    <For data={blocked.blockReasons} getKey={reason => reason}>
                      {reason => <li>{reason}</li>}
                    </For>
                  </ul>
                </>
              )}
            </Case>

            <Case>
              <>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">
                    Pay Runs this Period
                  </h3>

                  <div className="flex flex-wrap items-center gap-3">
                    <RunPayrollButton
                      organizationId={props.organizationId}
                      payPeriodId={period._id}
                      disabled={!isOpen || !isReady}
                    />

                    <PostponePaydayMenu
                      organizationId={props.organizationId}
                      payPeriodId={period._id}
                      effectivePayDate={details.effectivePayDate}
                      disabled={!isOpen}
                    />
                  </div>
                </div>

                <SwitchOn>
                  <Case predicate={currentRuns.length === 0}>
                    <p className="text-muted-foreground py-6 text-center text-base">
                      No pay runs for this period yet.
                    </p>
                  </Case>

                  <Case>
                    <div className="grid gap-4">
                      <For data={currentRuns} getKey={run => run._id}>
                        {run => (
                          <PayRunCard
                            run={run}
                            onOpen={() => {
                              setSelectedRunId(run._id)
                            }}
                          />
                        )}
                      </For>
                    </div>
                  </Case>
                </SwitchOn>
              </>
            </Case>
          </SwitchOn>
        </div>
      </PayrollSection>

      <PayrollSection title="Previous Periods">
        <SwitchOn>
          <Case predicate={page.previousRuns.length === 0}>
            <p className="text-muted-foreground py-6 text-center text-base">
              No previous runs exist
            </p>
          </Case>

          <Case>
            <div className="grid gap-4 py-4">
              <For data={page.previousRuns} getKey={run => run._id}>
                {run => (
                  <PayRunCard
                    run={run}
                    onOpen={() => setSelectedRunId(run._id)}
                  />
                )}
              </For>
            </div>
          </Case>
        </SwitchOn>
      </PayrollSection>

      <PayRunReportDialog
        organizationId={props.organizationId}
        payRunId={selectedRunId}
        onClose={() => {
          setSelectedRunId(null)
        }}
      />
    </AdminPage>
  )
}

function PayrollSection(props: { title: string; children: ReactNode }) {
  return (
    <article>
      <h2 className="font-heading border-ink border-t border-b px-1 py-0.5 text-xl font-bold">
        {props.title}
      </h2>

      <section className="grid gap-4 p-4">{props.children}</section>
    </article>
  )
}

function StatusField(props: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-0.5', props.className)}>
      <dt className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        {props.label}
      </dt>

      <dd className="text-xs font-bold">{props.value}</dd>
    </div>
  )
}

function RunPayrollButton(props: {
  organizationId: string
  payPeriodId: Id<'payPeriods'>
  disabled: boolean
}) {
  const runPayPeriod = useMutation(api.features.payroll.runPayPeriod)
  const [pending, setPending] = useState(false)

  async function handleRun() {
    setPending(true)
    try {
      const result = await runPayPeriod({
        organizationId: props.organizationId,
        payPeriodId: props.payPeriodId,
      })
      if (result.status === 'blocked') {
        toast.error(result.blockReasons.join(' '))
        return
      }
      toast.success(
        result.alreadyCompleted
          ? 'Pay period was already paid.'
          : `Pay run posted ${String(result.stubCount)} paystub${result.stubCount === 1 ? '' : 's'}.`
      )
    } catch (error) {
      toast.error(userFacingErrorMessage(error, 'Could not run payroll.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="brutal"
      size="sm"
      disabled={props.disabled || pending}
      onClick={() => {
        void handleRun()
      }}
    >
      {pending ? 'Running…' : 'Run now'}
    </Button>
  )
}

function PostponePaydayMenu(props: {
  organizationId: string
  payPeriodId: Id<'payPeriods'>
  effectivePayDate: string
  disabled: boolean
}) {
  const postponePayPeriod = useMutation(api.features.payroll.postponePayPeriod)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [postponeUntil, setPostponeUntil] = useState(props.effectivePayDate)

  useEffect(() => {
    setPostponeUntil(props.effectivePayDate)
  }, [props.effectivePayDate, props.payPeriodId])

  async function handlePostpone() {
    setPending(true)
    try {
      const result = await postponePayPeriod({
        organizationId: props.organizationId,
        payPeriodId: props.payPeriodId,
        postponedUntil: postponeUntil,
      })
      toast.success(
        `Payday postponed to ${formatIsoDay(result.effectivePayDate)}.`
      )
      setOpen(false)
    } catch (error) {
      toast.error(userFacingErrorMessage(error, 'Could not postpone payday.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="brutal-outline"
          size="sm"
          disabled={props.disabled}
        >
          Postpone
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        sideOffset={12}
        className="border-ink w-46.25 rounded-lg border p-3 shadow-none"
      >
        <PopoverHeader>
          <PopoverTitle>Postpone Payday</PopoverTitle>

          <PopoverDescription>
            Select a new payday for this pay period.
          </PopoverDescription>
        </PopoverHeader>

        <Field>
          <FieldLabel>New payday</FieldLabel>

          <Input
            type="date"
            value={postponeUntil}
            disabled={pending}
            onChange={event => {
              setPostponeUntil(event.target.value)
            }}
          />
        </Field>

        <Button
          type="button"
          variant="brutal-outline"
          size="sm"
          className="w-full"
          disabled={pending || postponeUntil.length === 0}
          onClick={() => {
            void handlePostpone()
          }}
        >
          {pending ? 'Saving…' : 'Postpone'}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function PayRunCard(props: { run: PayRunSummary; onOpen: () => void }) {
  const run = props.run
  const statusLabel = formatRunStatus(run.status)
  const completedLabel =
    run.postponedUntil !== undefined
      ? formatIsoDay(run.postponedUntil)
      : formatRunCompletedDay(run)

  return (
    <button
      type="button"
      onClick={props.onOpen}
      className="border-ink bg-card hover:bg-muted/40 focus-visible:ring-ring grid w-full gap-0 overflow-clip rounded-lg border text-left transition-colors focus-visible:ring-3 focus-visible:outline-none"
    >
      <span className="bg-ink text-primary-foreground w-fit px-4 py-1.5 text-sm">
        ID: {run._id}
      </span>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(max(100px,30%),1fr))] gap-2 px-4 py-4 text-xs">
        <StatusField label="run completed" value={completedLabel} />

        <StatusField label="status" value={statusLabel} />

        <StatusField
          label="total funds"
          value={<MoneyAmount cents={run.totalFundsCents} />}
        />
      </div>
    </button>
  )
}

function PayRunReportDialog(props: {
  organizationId: string
  payRunId: Id<'payRuns'> | null
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return
    if (props.payRunId === null) {
      if (dialog.open) dialog.close()

      return
    }
    if (!dialog.open) dialog.showModal()
  }, [props.payRunId])

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-foreground/40 bg-transparent p-0 open:fixed open:inset-0 open:m-0 open:flex open:h-dvh open:w-dvw open:items-center open:justify-center open:overflow-auto"
      onClose={props.onClose}
      onClick={event => {
        const dialog = dialogRef.current
        if (dialog !== null && event.target === dialog) {
          dialog.close()
        }
      }}
    >
      <div
        data-payroll-report-scroller=""
        className="bg-background shadow-brutal-lg m-4 grid max-h-[min(886px,90dvh)] w-full max-w-182.5 gap-4 overflow-auto p-6"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <SwitchOn value={props.payRunId}>
          <Case
            predicate={(
              payRunId: Id<'payRuns'> | null
            ): payRunId is Id<'payRuns'> => payRunId !== null}
          >
            {payRunId => (
              <PayRunReportDialogContent
                key={retryKey}
                organizationId={props.organizationId}
                payRunId={payRunId}
                onClose={props.onClose}
                onRetry={() => {
                  setRetryKey(value => value + 1)
                }}
              />
            )}
          </Case>
        </SwitchOn>
      </div>
    </dialog>
  )
}

function PayRunReportDialogContent(props: {
  organizationId: string
  payRunId: Id<'payRuns'>
  onClose: () => void
  onRetry: () => void
}) {
  const reportQuery = useSafeQuery(
    api.features.payroll.getPayRunAdminReportForOrganization,
    {
      organizationId: props.organizationId,
      payRunId: props.payRunId,
    }
  )
  const view = resolvePayRunReportViewState(reportQuery)

  return (
    <SwitchOn value={view}>
      <Case predicate={view.status === 'loading'}>
        <p className="text-muted-foreground text-sm">Loading pay report…</p>
      </Case>

      <Case
        predicate={(
          state: typeof view
        ): state is Extract<typeof view, { status: 'error' }> =>
          state.status === 'error'}
      >
        {state => (
          <div className="grid gap-4">
            <p className="text-destructive text-sm font-bold" role="alert">
              {state.message}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="brutal-outline"
                onClick={props.onRetry}
              >
                Retry
              </Button>

              <Button type="button" variant="ghost" onClick={props.onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Case>

      <Case
        predicate={(
          state: typeof view
        ): state is Extract<typeof view, { status: 'ready' }> =>
          state.status === 'ready'}
      >
        {state => (
          <PayRunReportBody report={state.report} onClose={props.onClose} />
        )}
      </Case>
    </SwitchOn>
  )
}

function PayRunReportBody(props: {
  report: PayRunReport
  onClose: () => void
}) {
  const report = props.report
  const run = report.run
  const statusMs = run.completedAt ?? run.startedAt

  return (
    <>
      <header className="">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-4xl font-bold">Pay Report</h2>

          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="mt-2 justify-self-end"
            onClick={props.onClose}
          >
            <X className="size-6" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-lg">
            ID: {shortRunId(run._id)}
          </p>

          <div className="grid gap-0.5 text-right text-xs">
            <p className="text-muted-foreground font-bold uppercase">
              run completed
            </p>

            <p className="font-bold">{formatRunCompletedDay(run)}</p>
          </div>
        </div>
      </header>

      <PayrollSection title="Run Info">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(max(100px,30%),1fr))] gap-4">
          <StatusField
            label="Students in run"
            value={String(report.studentCount)}
          />

          <StatusField
            label="funds dispersed"
            value={<MoneyAmount cents={report.fundsDispersedCents} />}
          />

          <StatusField
            label="Status Timestamp"
            value={formatStatusTimestamp(statusMs)}
          />

          <StatusField
            label="scheduled payday"
            value={formatIsoDay(report.period.payDate)}
          />

          <StatusField label="status" value={formatRunStatus(run.status)} />

          <StatusField
            label="Work Window"
            value={`${formatIsoDay(report.period.startDate)} - ${formatIsoDay(report.period.endDate)}`}
          />
        </div>

        <BlockedReasons blockReasons={run.blockReasons} />
      </PayrollSection>

      <PayrollSection title="Individual Pay">
        <SwitchOn>
          <Case predicate={report.stubs.length === 0}>
            <p className="text-muted-foreground text-sm">
              {emptyPaystubsMessage(run.status)}
            </p>
          </Case>

          <Case>
            <div className="grid gap-4">
              <For data={report.stubs} getKey={stub => stub.rosterStudentId}>
                {stub => <StudentPayReportCard stub={stub} />}
              </For>
            </div>
          </Case>
        </SwitchOn>
      </PayrollSection>
    </>
  )
}

function BlockedReasons(props: { blockReasons?: Array<string> }) {
  if (props.blockReasons == undefined || props.blockReasons.length === 0)
    return null

  return (
    <div className="grid gap-2">
      <p className="text-destructive text-sm font-bold">
        Blocked — fix these before running payroll:
      </p>

      <ul className="text-muted-foreground grid list-disc gap-1 pl-5 text-sm">
        <For data={props.blockReasons} getKey={reason => reason}>
          {reason => <li>{reason}</li>}
        </For>
      </ul>
    </div>
  )
}

/** Scroll the report dialog so `element` stays in view with `min(2rem, scrollport)` below its bottom. */
function scrollPanelInReportDialog(element: HTMLElement) {
  const scroller = element.closest<HTMLElement>(
    '[data-payroll-report-scroller]'
  )
  if (scroller === null) return

  const rem = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize
  )
  const gapPx = Math.min(2 * rem, scroller.clientHeight)
  const elementRect = element.getBoundingClientRect()
  const scrollerRect = scroller.getBoundingClientRect()
  const scrollportTop = scrollerRect.top + scroller.clientTop
  const scrollportBottom = scrollportTop + scroller.clientHeight
  const neededBottom = elementRect.bottom + gapPx

  let delta = 0
  if (neededBottom > scrollportBottom) {
    delta = neededBottom - scrollportBottom
  } else if (elementRect.top < scrollportTop) {
    delta = elementRect.top - scrollportTop
  }

  if (delta === 0) return
  scroller.scrollBy({ top: delta, behavior: 'smooth' })
}

function StudentPayReportCard(props: { stub: PayRunReport['stubs'][number] }) {
  const stub = props.stub
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const breakdown = studentPayBreakdown(stub)
  const disbursementAccent = 'text-blue-700'

  return (
    <div className="border-ink overflow-hidden rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-0 text-left"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(value => !value)
        }}
      >
        <span className="bg-ink text-primary-foreground inline-flex w-fit items-center gap-2 px-4 py-2 text-sm">
          <ChevronDown
            className={cn(
              'size-4 transition-transform',
              expanded ? '' : '-rotate-90'
            )}
          />

          <span>{stub.displayName}</span>
        </span>

        <div className="grid grid-cols-2 gap-6 text-xs">
          <StatusField
            label="Gross pay"
            value={<MoneyAmount cents={stub.grossPayCents} />}
            className="flex gap-2"
          />

          <StatusField
            label="net pay"
            value={<MoneyAmount cents={stub.netPayCents} />}
            className="flex gap-2"
          />
        </div>
      </button>

      <div
        ref={panelRef}
        className={cn(
          'grid transition-[grid-template-rows] duration-150 ease-in-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        onTransitionEnd={event => {
          if (!expanded) return
          if (event.target !== event.currentTarget) return
          if (event.propertyName !== 'grid-template-rows') return
          if (panelRef.current === null) return
          scrollPanelInReportDialog(panelRef.current)
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-ink grid gap-4 border-t bg-[#ddd] px-3 py-4">
            <div className="grid gap-3 @min-[40rem]/admin:grid-cols-2">
              <For data={breakdown.panels} getKey={panel => panel.title}>
                {panel => (
                  <PayBreakdownPanel
                    title={panel.title}
                    amountCents={panel.amountCents}
                    accentColor={panel.accentColor}
                  >
                    <For data={panel.groups} getKey={group => group.title}>
                      {group => (
                        <PayBreakdownGroup
                          title={group.title}
                          accentColor={panel.accentColor}
                          fields={group.fields}
                        />
                      )}
                    </For>
                  </PayBreakdownPanel>
                )}
              </For>
            </div>

            <PayBreakdownPanel
              title="disbursement"
              amountCents={stub.netPayCents}
              accentColor={disbursementAccent}
            >
              <div className="space-y-1 px-3">
                <p className={cn('text-sm uppercase', disbursementAccent)}>
                  pay split
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <For data={stub.paySplit} getKey={share => share.label}>
                    {share => (
                      <StatusField
                        label={share.label}
                        value={`${formatMoneyPlain(share.amountCents)} (${String(share.percent)}%)`}
                      />
                    )}
                  </For>
                </div>
              </div>
            </PayBreakdownPanel>
          </div>
        </div>
      </div>
    </div>
  )
}

function PayBreakdownPanel(props: {
  title: string
  amountCents: number
  accentColor: string
  children: ReactNode
}) {
  return (
    <div className="bg-background space-y-2 rounded-lg py-2">
      <div className="flex items-center justify-between border-b border-[#8a7574] px-3 pb-2">
        <p className="text-base uppercase">{props.title}</p>

        <p className={cn('text-base font-bold', props.accentColor)}>
          <MoneyAmount cents={props.amountCents} />
        </p>
      </div>

      <div className="space-y-6">{props.children}</div>
    </div>
  )
}

function breakdownFieldValue(field: PayBreakdownField): ReactNode {
  if ('cents' in field) {
    return <MoneyAmount cents={field.cents} />
  }
  return field.value
}

function PayBreakdownGroup(props: {
  title: string
  accentColor: string
  fields: ReadonlyArray<PayBreakdownField>
}) {
  const lastField = props.fields.at(-1)
  if (lastField === undefined) {
    return null
  }

  return (
    <div className="space-y-2 px-3">
      <p className={cn('text-sm uppercase', props.accentColor)}>
        {props.title}
      </p>

      <div className="space-y-1">
        <For data={props.fields.slice(0, -1)} getKey={field => field.label}>
          {field => (
            <StatusField
              label={field.label}
              value={breakdownFieldValue(field)}
              className="flex items-center justify-between"
            />
          )}
        </For>

        <div className="border-b border-[#8a7574]" />

        <StatusField
          label={lastField.label}
          value={breakdownFieldValue(lastField)}
          className="flex items-center justify-between"
        />
      </div>
    </div>
  )
}

function formatScheduleType(type: string): string {
  if (type === 'biweekly') {
    return 'Bi-weekly'
  }
  if (type === 'semimonthly') {
    return 'Semi-monthly'
  }
  if (type === 'weekly') {
    return 'Weekly'
  }
  return type
}

function formatRunStatus(status: PayRunSummary['status']): string {
  if (status === 'succeeded') {
    return 'Completed'
  }
  if (status === 'blocked') {
    return 'Blocked'
  }
  if (status === 'postponed') {
    return 'Postponed'
  }
  return status
}

function formatRunCompletedDay(run: PayRunSummary): string {
  if (run.postponedUntil !== undefined) {
    return formatIsoDay(run.postponedUntil)
  }
  const ms = run.completedAt ?? run.startedAt
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatStatusTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function shortRunId(id: string): string {
  return id.slice(-4).toUpperCase()
}

function formatMoneyPlain(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`
}

type PayrollAdminPage = NonNullable<
  FunctionReturnType<
    typeof api.features.payroll.getPayrollAdminPageForOrganization
  >
>
type PayRunSummary = PayrollAdminPage['current']['runs'][number]
type PayRunReport = FunctionReturnType<
  typeof api.features.payroll.getPayRunAdminReportForOrganization
>
