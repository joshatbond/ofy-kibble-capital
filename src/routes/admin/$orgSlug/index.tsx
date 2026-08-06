import { Link, createFileRoute } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import { useMutation, useQuery } from 'convex/react'
import {
  Ban,
  CopyIcon,
  Filter,
  History,
  Link2,
  RefreshCw,
  RotateCw,
  Search,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'

import { AdminPage } from '~/components/admin/admin-shell'
import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { Input } from '~/components/ui/input'
import { RevealLabelButton } from '~/components/ui/reveal-label-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'
import { inviteRedirectTo } from '~/lib/auth-redirect'
import { cn } from '~/lib/class-name-merge'
import { rosterRowDisplayName } from '~/lib/viewer-display'

import type { FunctionReturnType } from 'convex/server'

const rosterStudentCardVariants = cva(
  'border-ink shadow-brutal grid gap-4 rounded-xl border-2 p-4',
  {
    variants: {
      status: {
        pending: 'bg-black/5',
        revoked: 'bg-black/10',
        active: 'bg-card',
      },
    },
    defaultVariants: {
      status: 'active',
    },
  }
)
export const Route = createFileRoute('/admin/$orgSlug/')({
  component: AdminClassPage,
})
function AdminClassPage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs(params)
  )
  const organizationId = context?.organizationId
  const roster = useQuery(
    api.features.invitations.listClassroomRoster,
    organizationId === undefined ? 'skip' : { organizationId }
  )
  const teachers = useQuery(
    api.features.admin.context.listClassroomTeachers,
    organizationId === undefined ? 'skip' : { organizationId }
  )

  return (
    <SwitchOn>
      <Case predicate={roster === undefined || teachers === undefined}>
        <main>
          <p>Loading classroom roster…</p>
        </main>
      </Case>

      <Case predicate={context === null}>
        <main>
          <p>This classroom does not match your teacher account.</p>

          <p>
            <Link to="/admin">Back to dashboard</Link>
          </p>
        </main>
      </Case>

      <Case>
        <AdminClassRosterContent />
      </Case>
    </SwitchOn>
  )
}
function AdminClassRosterContent() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs(params)
  )
  const organizationId = context?.organizationId
  const roster = useQuery(
    api.features.invitations.listClassroomRoster,
    organizationId === undefined ? 'skip' : { organizationId }
  )
  const teachers = useQuery(
    api.features.admin.context.listClassroomTeachers,
    organizationId === undefined ? 'skip' : { organizationId }
  )
  const [showInvites, setShowInvites] = useState(false)

  if (context == null || roster === undefined || teachers === undefined) {
    return null
  }

  return (
    <AdminPage
      title="Student roster"
      description="Manage classroom accounts, monitor balances, and distribute Kibble."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/$orgSlug/activity"
            params={params}
            className="border-ink bg-card shadow-brutal hover:bg-muted/40 inline-flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <History className="size-4" aria-hidden />
            Classroom activity
          </Link>

          <Button
            type="button"
            variant="brutal"
            className="h-auto w-fit gap-2 px-6 py-4 text-sm font-bold uppercase"
            onClick={() => setShowInvites(current => !current)}
          >
            <UserPlus className="size-4" aria-hidden />

            {showInvites ? 'Hide invites' : 'Create account'}
          </Button>
        </div>
      }
    >
      <ClassroomRosterTable
        organizationId={context.organizationId}
        roster={roster}
      />

      {showInvites ? (
        <InvitePanels
          organizationId={context.organizationId}
          teachers={teachers}
        />
      ) : null}
    </AdminPage>
  )
}
function ClassroomRosterTable(props: {
  organizationId: string
  roster: Array<RosterRow>
}) {
  const resendInvitation = useMutation(
    api.features.invitations.resendClassroomInvitation
  )
  const revokeInvitation = useMutation(
    api.features.invitations.revokeClassroomInvitation
  )
  const rotatePayToken = useMutation(api.features.invitations.rotatePayToken)
  const paySplits = useQuery(api.features.paySplit.listClassroomPaySplits, {
    organizationId: props.organizationId,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RosterStatusFilter>('all')
  const [rowActionError, setRowActionError] = useState<string | null>(null)
  const [resendSuccessLink, setResendSuccessLink] = useState<string | null>(
    null
  )

  const paySplitByRosterId = new Map(
    (paySplits ?? []).map(row => [row.rosterStudentId, row] as const)
  )

  const filteredRoster = props.roster.filter(row => {
    if (statusFilter === 'active' && row.status !== 'active') {
      return false
    }

    if (statusFilter === 'inactive' && row.status === 'active') {
      return false
    }

    const query = searchQuery.trim().toLowerCase()
    if (query === '') {
      return true
    }

    const displayName = rosterRowDisplayName({
      resolvedName: row.resolvedName,
      email: row.email,
    })

    return (
      displayName.toLowerCase().includes(query) ||
      row.email.toLowerCase().includes(query) ||
      String(row.externalStudentId).includes(query)
    )
  })

  return (
    <>
      <div className="grid gap-4 @min-[30rem]/admin:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
            aria-hidden
          />

          <Input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search students by name or ID…"
            className="border-ink shadow-brutal h-14 border-2 pl-12"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={value => setStatusFilter(value as RosterStatusFilter)}
        >
          <SelectTrigger className="border-ink shadow-brutal h-14 w-full gap-2 border-2 px-4 font-bold @min-[30rem]/admin:w-auto">
            <Filter className="size-4 shrink-0" aria-hidden />

            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All students</SelectItem>

            <SelectItem value="active">Active only</SelectItem>

            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <InvitationSentSection link={resendSuccessLink} />

      <AlertMessage message={rowActionError} />

      <section className="@container/roster grid gap-4">
        <SwitchOn>
          <Case predicate={filteredRoster.length === 0}>
            <p className="text-muted-foreground py-12 text-center">
              No students match your search or filters yet.
            </p>
          </Case>

          <Case>
            <div className="flex flex-wrap gap-4">
              <For data={filteredRoster} getKey={row => row.rosterStudentId}>
                {row => (
                  <RosterStudentCard
                    row={row}
                    paySplit={paySplitByRosterId.get(row.rosterStudentId)}
                    onResend={handleResend}
                    onRevoke={handleRevoke}
                    onRotate={handleRotate}
                  />
                )}
              </For>
            </div>
          </Case>
        </SwitchOn>
      </section>
    </>
  )

  async function handleResend(invitationId: string) {
    setRowActionError(null)
    setResendSuccessLink(null)

    try {
      const result = await resendInvitation({
        organizationId: props.organizationId,
        invitationId,
      })
      setResendSuccessLink(inviteRedirectTo(result.invitationId))
    } catch (error) {
      setRowActionError(
        error instanceof Error ? error.message : 'Could not resend invitation.'
      )
    }
  }

  async function handleRevoke(invitationId: string) {
    setRowActionError(null)

    try {
      await revokeInvitation({
        organizationId: props.organizationId,
        invitationId,
      })
    } catch (error) {
      setRowActionError(
        error instanceof Error ? error.message : 'Could not revoke invitation.'
      )
    }
  }

  async function handleRotate(rosterStudentId: Id<'rosterStudents'>) {
    setRowActionError(null)

    try {
      await rotatePayToken({
        organizationId: props.organizationId,
        rosterStudentId,
      })
    } catch (error) {
      setRowActionError(
        error instanceof Error ? error.message : 'Could not rotate pay token.'
      )
    }
  }
}
function InvitePanels(props: {
  organizationId: string
  teachers: Array<ClassroomTeacher>
}) {
  return (
    <div className="grid gap-6">
      <section className="border-ink bg-card shadow-brutal grid gap-4 border-2 p-6">
        <h2 className="font-heading text-lg font-bold">How invitations work</h2>

        <ul className="text-muted-foreground grid list-disc gap-2 pl-5 text-sm">
          <li>
            Checking and Savings accounts are provisioned when you send a
            student invite.
          </li>

          <li>
            Students stay pending until they accept; they are excluded from pay
            runs and POS until active.
          </li>

          <li>
            A pay token is created at invite send so you can print ID cards
            immediately.
          </li>

          <li>Invitation links expire after 14 days. Resend to refresh.</li>
        </ul>
      </section>

      <div className="grid gap-6 @min-[48rem]/admin:grid-cols-2">
        <InviteStudentForm organizationId={props.organizationId} />

        <InviteCoTeacherForm
          organizationId={props.organizationId}
          teachers={props.teachers}
        />
      </div>
    </div>
  )
}
function InviteStudentForm(props: { organizationId: string }) {
  const inviteStudent = useMutation(api.features.invitations.inviteStudent)
  const [studentEmail, setStudentEmail] = useState('')
  const [studentName, setStudentName] = useState('')
  const [externalStudentId, setExternalStudentId] = useState('')
  const [grade, setGrade] = useState<7 | 8>(7)
  const [formError, setFormError] = useState<string | null>(null)
  const [formPending, setFormPending] = useState(false)
  const [successLink, setSuccessLink] = useState<string | null>(null)

  return (
    <section className="border-ink bg-card shadow-brutal grid gap-4 border-2 p-6">
      <h2 className="font-heading text-lg font-bold">Invite student</h2>

      <InvitationSentSection link={successLink} />

      <AlertMessage message={formError} />

      <form
        className="grid gap-4"
        onSubmit={event => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <label className="grid gap-1 text-sm font-bold">
          {import.meta.env.DEV ? 'Email' : 'School email'}

          <Input
            type="email"
            value={studentEmail}
            onChange={event => setStudentEmail(event.target.value)}
            required
            className="border-ink h-11 border-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-bold">
          Student name
          <Input
            type="text"
            value={studentName}
            onChange={event => setStudentName(event.target.value)}
            placeholder="Optional — Google fills this on first sign-in"
            className="border-ink h-11 border-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-bold">
          External student ID
          <Input
            type="number"
            value={externalStudentId}
            onChange={event => setExternalStudentId(event.target.value)}
            required
            className="border-ink h-11 border-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-bold">
          Grade
          <select
            value={grade}
            onChange={event => setGrade(Number(event.target.value) as 7 | 8)}
            className="border-ink bg-background h-11 rounded-lg border-2 px-3"
          >
            <option value={7}>7</option>

            <option value={8}>8</option>
          </select>
        </label>

        <Button
          type="submit"
          variant="brutal"
          disabled={formPending}
          className="h-auto py-3 font-bold"
        >
          {formPending ? 'Sending…' : 'Invite student'}
        </Button>
      </form>
    </section>
  )

  async function handleSubmit() {
    setFormError(null)
    setSuccessLink(null)
    setFormPending(true)

    try {
      const parsedId = Number(externalStudentId)
      if (!Number.isFinite(parsedId)) {
        throw new Error('External student ID must be a number.')
      }

      const result = await inviteStudent({
        organizationId: props.organizationId,
        email: studentEmail,
        displayName: studentName.trim() === '' ? undefined : studentName,
        externalStudentId: parsedId,
        grade,
      })

      setStudentEmail('')
      setStudentName('')
      setExternalStudentId('')
      setSuccessLink(inviteRedirectTo(result.invitationId))
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not send invitation.'
      )
    } finally {
      setFormPending(false)
    }
  }
}
function InviteCoTeacherForm(props: {
  organizationId: string
  teachers: Array<ClassroomTeacher>
}) {
  const inviteCoTeacher = useMutation(api.features.invitations.inviteCoTeacher)
  const [coTeacherEmail, setCoTeacherEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formPending, setFormPending] = useState(false)
  const [successLink, setSuccessLink] = useState<string | null>(null)

  return (
    <section className="border-ink bg-card shadow-brutal grid gap-4 border-2 p-6">
      <h2 className="font-heading text-lg font-bold">Invite co-teacher</h2>

      <InvitationSentSection link={successLink} />

      <AlertMessage message={formError} />

      <form
        className="grid gap-4"
        onSubmit={event => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <label className="grid gap-1 text-sm font-bold">
          {import.meta.env.DEV ? 'Email' : 'School email'}

          <Input
            type="email"
            value={coTeacherEmail}
            onChange={event => setCoTeacherEmail(event.target.value)}
            required
            className="border-ink h-11 border-2"
          />
        </label>

        <Button
          type="submit"
          variant="brutal"
          disabled={formPending}
          className="h-auto py-3 font-bold"
        >
          {formPending ? 'Sending…' : 'Invite co-teacher'}
        </Button>
      </form>

      <div className="border-ink border-t pt-4">
        <h3 className="mb-2 text-sm font-bold">Co-teachers</h3>

        <SwitchOn>
          <Case predicate={props.teachers.length === 0}>
            <p className="text-muted-foreground text-sm">No co-teachers yet.</p>
          </Case>

          <Case>
            <ul className="grid gap-2 text-sm">
              <For data={props.teachers} getKey={teacher => teacher.userId}>
                {teacher => (
                  <li>
                    {`${teacher.name ?? teacher.email} (${teacher.role}) — ${teacher.email}`}
                  </li>
                )}
              </For>
            </ul>
          </Case>
        </SwitchOn>
      </div>
    </section>
  )

  async function handleSubmit() {
    setFormError(null)
    setSuccessLink(null)
    setFormPending(true)

    try {
      const result = await inviteCoTeacher({
        organizationId: props.organizationId,
        email: coTeacherEmail,
      })

      setCoTeacherEmail('')
      setSuccessLink(inviteRedirectTo(result.invitationId))
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not send invitation.'
      )
    } finally {
      setFormPending(false)
    }
  }
}
async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}
function InvitationSentSection(props: { link: string | null }) {
  if (props.link === null) {
    return null
  }

  const link = props.link

  return (
    <section className="border-ink bg-card shadow-brutal grid gap-3 border-2 p-6">
      <h2 className="font-heading text-lg font-bold">Invitation sent</h2>

      <p className="text-muted-foreground text-sm">
        Share this link with the invitee (email delivery comes later):
      </p>

      <div className="grid gap-2 @min-[30rem]/admin:grid-cols-[1fr_auto]">
        <code className="border-ink bg-muted block overflow-x-auto rounded border p-2 text-xs">
          {link}
        </code>

        <Button
          type="button"
          variant="brutal-outline"
          onClick={() => void copyText(link)}
        >
          Copy link
        </Button>
      </div>
    </section>
  )
}
function AlertMessage(props: { message: string | null }) {
  if (props.message === null) {
    return null
  }

  return (
    <p
      role="alert"
      className="border-destructive bg-destructive/10 text-destructive border-2 p-4 text-sm font-bold"
    >
      {props.message}
    </p>
  )
}
function RosterCopyInviteLinkButton(props: { invitationId: string }) {
  const [copied, setCopied] = useState(false)
  const link = inviteRedirectTo(props.invitationId)

  return (
    <RevealLabelButton
      label={copied ? 'Copied!' : 'Copy link'}
      icon={<Link2 aria-hidden />}
      onClick={() => {
        void copyText(link).then(() => setCopied(true))
      }}
      onCollapse={() => setCopied(false)}
    />
  )
}
function PendingInvitationActions(props: {
  invitationId: string
  invitationStatus: RosterRow['invitationStatus']
  onResend: (invitationId: string) => void
  onRevoke: (invitationId: string) => void
}) {
  if (props.invitationStatus !== 'pending') {
    return null
  }

  return (
    <>
      <RevealLabelButton
        label="Resend"
        icon={<RefreshCw aria-hidden />}
        onClick={() => props.onResend(props.invitationId)}
      />

      <RevealLabelButton
        label="Revoke"
        icon={<Ban aria-hidden />}
        onClick={() => props.onRevoke(props.invitationId)}
      />
    </>
  )
}
function RosterStudentCard(props: {
  row: RosterRow
  paySplit: PaySplitRow | undefined
  onResend: (invitationId: string) => void
  onRevoke: (invitationId: string) => void
  onRotate: (rosterStudentId: Id<'rosterStudents'>) => void
}) {
  const { row } = props
  const displayName = rosterRowDisplayName({
    resolvedName: row.resolvedName,
    email: row.email,
  })
  const invitationAccepted = row.invitationStatus === 'accepted'
  const showInviteActions =
    !invitationAccepted && row.invitationStatus === 'pending'

  return (
    <article
      className={cn(
        rosterStudentCardVariants({ status: row.status }),
        'w-full max-w-full min-w-[min(100%,17.5rem)] grow basis-70',
        '@min-[30rem]/roster:w-fit @min-[30rem]/roster:max-w-none @min-[30rem]/roster:grow-0 @min-[30rem]/roster:basis-auto'
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="border-ink bg-accent text-accent-foreground grid size-12 shrink-0 place-items-center border-2">
          <span className="text-lg font-bold">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0 flex-1 @min-[30rem]/roster:flex-none">
          <p
            className="font-heading text-lg font-bold capitalize @max-[30rem]/roster:truncate @min-[30rem]/roster:whitespace-nowrap"
            title={displayName}
          >
            {displayName}
          </p>

          <p className="text-muted-foreground text-sm font-bold @max-[30rem]/roster:truncate">
            ID: #{row.externalStudentId}
          </p>

          {!invitationAccepted ? (
            <p className="text-muted-foreground mt-1 text-sm font-bold @max-[30rem]/roster:truncate">
              {`Invite: ${row.invitationStatus}${row.invitationIsExpired ? ' (expired)' : ''}`}
            </p>
          ) : null}

          <PaySplitReadOnly paySplit={props.paySplit} status={row.status} />
        </div>
      </div>

      <div className="pt-4">
        <SwitchOn>
          <Case predicate={showInviteActions}>
            <div className="flex w-full flex-wrap items-center gap-3 @min-[30rem]/roster:w-fit">
              <RosterCopyInviteLinkButton invitationId={row.invitationId} />

              <PendingInvitationActions
                invitationId={row.invitationId}
                invitationStatus={row.invitationStatus}
                onResend={props.onResend}
                onRevoke={props.onRevoke}
              />
            </div>
          </Case>

          <Case predicate={row.status === 'active'}>
            <div className="flex w-full flex-wrap items-center gap-3 @min-[30rem]/roster:w-fit">
              <PayTokenCopyButton payToken={row.payToken} />

              <RevealLabelButton
                label="Rotate token"
                icon={<RotateCw aria-hidden />}
                onClick={() => props.onRotate(row.rosterStudentId)}
              />
            </div>
          </Case>

          <Case>
            <p className="text-muted-foreground text-sm">
              No actions available for this student.
            </p>
          </Case>
        </SwitchOn>
      </div>
    </article>
  )
}

function PaySplitReadOnly(props: {
  paySplit: PaySplitRow | undefined
  status: RosterRow['status']
}) {
  if (props.status !== 'active') {
    return null
  }

  if (props.paySplit === undefined) {
    return (
      <p className="text-muted-foreground mt-1 text-sm font-bold">
        Pay Split (%): …
      </p>
    )
  }

  return (
    <p
      className={cn(
        'mt-1 text-sm font-bold',
        !props.paySplit.isConfigured && 'text-muted-foreground'
      )}
    >
      {`Pay Split (%): ${props.paySplit.checkingPercent} / ${props.paySplit.savingsPercent}`}
    </p>
  )
}
function PayTokenCopyButton(props: { payToken: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <RevealLabelButton
      label={copied ? 'Copied!' : 'Copy Pay Token'}
      icon={<CopyIcon aria-hidden />}
      onClick={() => {
        void copyText(props.payToken).then(() => setCopied(true))
      }}
      onCollapse={() => setCopied(false)}
    />
  )
}
type RosterStatusFilter = 'all' | 'active' | 'inactive'
type RosterRow = FunctionReturnType<
  typeof api.features.invitations.listClassroomRoster
>[number]
type PaySplitRow = FunctionReturnType<
  typeof api.features.paySplit.listClassroomPaySplits
>[number]
type ClassroomTeacher = FunctionReturnType<
  typeof api.features.admin.context.listClassroomTeachers
>[number]
