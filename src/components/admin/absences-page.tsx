import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Plus,
} from 'lucide-react'
import { useState } from 'react'

import { AdminPage } from '~/components/admin/admin-shell'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/class-name-merge'

const WEEKDAY_LABELS = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
] as const
const MOCK_LEDGER = [
  {
    name: 'Liam Wilson',
    range: 'Oct 03 – Oct 04',
    type: 'Excused (Sick)',
    penalty: '-0.00 KBL',
    status: 'VERIFIED' as const,
  },
  {
    name: 'Emma Smith',
    range: 'Oct 11',
    type: 'Unexcused',
    penalty: '-25.00 KBL',
    status: 'DEDUCTED' as const,
  },
  {
    name: 'Noah Knight',
    range: 'Oct 11 – Oct 12',
    type: 'School Event',
    penalty: '+5.00 KBL',
    status: 'PENDING' as const,
  },
]
export function AdminAbsencesPage() {
  const [view, setView] = useState<'calendar' | 'approvals'>('calendar')

  return (
    <AdminPage
      title="Absences"
      description="Track attendance, approve student requests, and keep the Kibble ledger accurate."
    >
      <div className="grid gap-4 @min-[30rem]/admin:grid-cols-[auto_auto] @min-[30rem]/admin:content-start">
        <TabButton
          active={view === 'calendar'}
          icon={CalendarDays}
          label="Calendar"
          onClick={() => setView('calendar')}
        />

        <TabButton
          active={view === 'approvals'}
          icon={ClipboardCheck}
          label="Approvals"
          onClick={() => setView('approvals')}
        />
      </div>

      <SwitchOn>
        <Case predicate={view === 'calendar'}>
          <AbsenceCalendarPanel />
        </Case>

        <Case>
          <ApprovalsPlaceholder />
        </Case>
      </SwitchOn>

      <RecentLedgerSection />
    </AdminPage>
  )
}
function TabButton(props: {
  active: boolean
  icon: typeof CalendarDays
  label: string
  onClick: () => void
}) {
  const Icon = props.icon

  return (
    <Button
      type="button"
      variant={props.active ? 'brutal' : 'brutal-outline'}
      className="h-auto gap-2 px-6 py-3 text-sm font-bold uppercase"
      onClick={props.onClick}
    >
      <Icon className="size-4" aria-hidden />

      {props.label}
    </Button>
  )
}
function AbsenceCalendarPanel() {
  return (
    <div className="grid gap-6 @min-[56rem]/admin:grid-cols-12">
      <section className="grid gap-6 @min-[56rem]/admin:col-span-8">
        <div className="border-ink bg-card shadow-brutal border-2">
          <div className="border-ink grid grid-cols-[1fr_auto] items-center gap-4 border-b-2 p-6">
            <h2 className="font-heading text-xl font-bold">October 2023</h2>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="border-ink bg-background hover:bg-muted grid size-10 place-items-center border-2 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                type="button"
                className="border-ink bg-background hover:bg-muted grid size-10 place-items-center border-2 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          <CalendarGrid />
        </div>
      </section>

      <aside className="grid content-start gap-6 @min-[56rem]/admin:col-span-4">
        <LegendCard />

        <div className="border-ink bg-primary text-primary-foreground shadow-brutal grid gap-4 border-2 p-6">
          <h3 className="font-heading text-xl font-bold">Record Absence</h3>

          <p className="text-sm opacity-90">
            Quickly log a student absence for the Kibble Ledger.
          </p>

          <Button
            type="button"
            variant="brutal-outline"
            className="bg-background text-foreground h-auto w-full gap-2 py-3"
          >
            <Plus className="size-4" aria-hidden />
            Log new record
          </Button>
        </div>
      </aside>
    </div>
  )
}
function CalendarGrid() {
  const cells = buildOctober2023Cells()

  return (
    <div className="border-ink grid grid-cols-7 border-t border-l">
      {WEEKDAY_LABELS.map(label => (
        <div
          key={label}
          className="border-ink bg-muted text-muted-foreground border-r border-b p-2 text-center text-xs font-bold"
        >
          {label}
        </div>
      ))}

      {cells.map(cell => (
        <div
          key={cell.key}
          className={cn(
            'border-ink grid min-h-24 content-start gap-1 border-r border-b p-2 text-sm font-bold',
            cell.dimmed && 'text-muted-foreground/50',
            cell.today && 'ring-primary ring-2 ring-inset',
            cell.highlight && 'bg-secondary'
          )}
        >
          <span>{cell.day}</span>

          {cell.tags?.map(tag => (
            <span
              key={tag}
              className="border-ink bg-accent text-accent-foreground border px-1 text-[10px] font-bold uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
function LegendCard() {
  return (
    <div className="border-ink bg-card shadow-brutal grid gap-4 border-2 p-6">
      <h3 className="font-heading text-xl font-bold">Calendar legend</h3>

      <ul className="grid gap-3 text-sm font-bold">
        <li className="grid grid-cols-[auto_1fr] items-center gap-3">
          <span className="border-ink bg-primary size-6 border-2" />
          Past absences
        </li>

        <li className="grid grid-cols-[auto_1fr] items-center gap-3">
          <span className="border-ink bg-accent size-6 border-2" />
          Upcoming / current
        </li>

        <li className="grid grid-cols-[auto_1fr] items-center gap-3">
          <span className="border-primary size-6 border-2" />
          Today
        </li>
      </ul>

      <hr className="border-ink border-dashed" />

      <dl className="grid gap-2 text-sm">
        <div className="grid grid-cols-[1fr_auto] items-center">
          <dt className="font-bold">Total this month</dt>

          <dd className="font-heading text-primary text-xl font-bold">12</dd>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center">
          <dt className="font-bold">Pending approvals</dt>

          <dd className="font-heading text-accent text-xl font-bold">04</dd>
        </div>
      </dl>
    </div>
  )
}
function ApprovalsPlaceholder() {
  return (
    <div className="border-ink bg-card shadow-brutal border-2 p-8 text-center">
      <p className="text-muted-foreground text-lg">
        Student absence approvals will appear here once the workflow is wired
        up.
      </p>
    </div>
  )
}
function RecentLedgerSection() {
  return (
    <section className="border-ink bg-card shadow-brutal mt-4 overflow-hidden border-2">
      <div className="bg-foreground text-background grid grid-cols-[1fr_auto] items-center gap-4 p-4">
        <h3 className="font-heading text-xl font-bold">
          Recent ledger entries
        </h3>

        <span className="border-background border px-3 py-1 text-xs font-bold">
          SYNCED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-ink bg-muted border-b-2">
            <tr>
              <th className="p-4 font-bold">Student name</th>

              <th className="p-4 font-bold">Date range</th>

              <th className="p-4 font-bold">Type</th>

              <th className="p-4 font-bold">Kibble penalty</th>

              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-border/40 divide-y">
            {MOCK_LEDGER.map(row => (
              <tr key={row.name} className="hover:bg-muted/50">
                <td className="p-4 font-bold">{row.name}</td>

                <td className="p-4">{row.range}</td>

                <td className="p-4">{row.type}</td>

                <td
                  className={cn(
                    'p-4 font-bold',
                    row.penalty.startsWith('-')
                      ? 'text-destructive'
                      : 'text-accent'
                  )}
                >
                  {row.penalty}
                </td>

                <td className="p-4">
                  <LedgerStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
function LedgerStatusBadge(props: {
  status: 'VERIFIED' | 'DEDUCTED' | 'PENDING'
}) {
  const styles = {
    VERIFIED: 'bg-secondary text-secondary-foreground',
    DEDUCTED: 'bg-destructive/15 text-destructive',
    PENDING: 'bg-accent text-accent-foreground',
  } as const

  return (
    <span
      className={cn(
        'border-ink border-2 px-2 py-1 text-xs font-bold',
        styles[props.status]
      )}
    >
      {props.status}
    </span>
  )
}
function buildOctober2023Cells(): Array<CalendarCell> {
  const leading = [
    { key: 'sep-24', day: 24, dimmed: true },
    { key: 'sep-25', day: 25, dimmed: true },
    { key: 'sep-26', day: 26, dimmed: true },
    { key: 'sep-27', day: 27, dimmed: true },
    { key: 'sep-28', day: 28, dimmed: true },
    { key: 'sep-29', day: 29, dimmed: true },
    { key: 'sep-30', day: 30, dimmed: true },
  ]

  const october = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1
    const key = `oct-${day}`

    if (day === 3) {
      return { key, day, tags: ['Liam W.'], highlight: true }
    }

    if (day === 10) {
      return { key, day, today: true }
    }

    if (day === 11) {
      return { key, day, tags: ['Emma S.', 'Noah K.'] }
    }

    return { key, day }
  })

  return [...leading, ...october]
}
type CalendarCell = {
  key: string
  day: number
  dimmed?: boolean
  today?: boolean
  highlight?: boolean
  tags?: Array<string>
}
