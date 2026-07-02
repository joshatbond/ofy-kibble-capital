import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Filter, Search, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { AdminPage } from '~/components/admin/admin-shell'
import { Case, SwitchOn } from '~/components/switch-on'
import { Button } from '~/components/ui/button'
import { For } from '~/components/ui/for'
import { Input } from '~/components/ui/input'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { teacherContextQueryArgs } from '~/lib/admin-route-context'
import { inviteRedirectTo } from '~/lib/auth-redirect'
import { rosterRowDisplayName } from '~/lib/viewer-display'

import type { FunctionReturnType } from 'convex/server'

export const Route = createFileRoute('/admin/$orgId/$classId/')({
  component: AdminClassPage,
})

function AdminClassPage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext,
    teacherContextQueryArgs(params)
  )
  const roster = useQuery(api.features.invitations.listClassroomRoster, {
    organizationId: params.orgId,
  })
  const teachers = useQuery(api.features.admin.context.listClassroomTeachers, {
    organizationId: params.orgId,
  })

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
  const roster = useQuery(api.features.invitations.listClassroomRoster, {
    organizationId: params.orgId,
  })
  const teachers = useQuery(api.features.admin.context.listClassroomTeachers, {
    organizationId: params.orgId,
  })
  const [showInvites, setShowInvites] = useState(false)

  if (context === null || roster === undefined || teachers === undefined) {
    return null
  }

  return (
    <AdminPage
      title="Student roster"
      description="Manage classroom accounts, monitor balances, and distribute Kibble."
      action={
        <Button
          type="button"
          variant="brutal"
          className="h-auto w-fit gap-2 px-6 py-4 text-sm font-bold uppercase"
          onClick={() => setShowInvites(current => !current)}
        >
          <UserPlus className="size-4" aria-hidden />

          {showInvites ? 'Hide invites' : 'Create account'}
        </Button>
      }
    >
      <ClassroomRosterTable organizationId={params.orgId} roster={roster} />

      {showInvites ? (
        <InvitePanels organizationId={params.orgId} teachers={teachers} />
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
  const [searchQuery, setSearchQuery] = useState('')
  const [rowActionError, setRowActionError] = useState<string | null>(null)
  const [resendSuccessLink, setResendSuccessLink] = useState<string | null>(
    null
  )

  const filteredRoster = props.roster.filter(row => {
    const query = searchQuery.trim().toLowerCase()
    if (query === '') {
      return true
    }

    return (
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

        <Button
          type="button"
          variant="brutal-outline"
          className="h-14 gap-2 px-8 font-bold"
        >
          <Filter className="size-4" aria-hidden />
          Filter by class
        </Button>
      </div>

      <InvitationSentSection link={resendSuccessLink} />

      <AlertMessage message={rowActionError} />

      <section className="border-ink border-t-2">
        <div className="border-ink bg-muted text-muted-foreground hidden border-b-2 px-4 py-3 text-xs font-bold tracking-wider uppercase @min-[48rem]/admin:grid @min-[48rem]/admin:grid-cols-12 @min-[48rem]/admin:gap-6">
          <div className="@min-[48rem]/admin:col-span-5">Student</div>

          <div className="@min-[48rem]/admin:col-span-3">Status</div>

          <div className="text-right @min-[48rem]/admin:col-span-4">
            Actions
          </div>
        </div>

        <SwitchOn>
          <Case predicate={filteredRoster.length === 0}>
            <p className="text-muted-foreground py-12 text-center">
              No students match your search yet.
            </p>
          </Case>

          <Case>
            <div className="divide-ink divide-y-2">
              <For data={filteredRoster} getKey={row => row.rosterStudentId}>
                {row => (
                  <RosterListRow
                    row={row}
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

function RosterInviteLink(props: {
  invitationId: string
  invitationStatus: RosterRow['invitationStatus']
}) {
  if (props.invitationStatus !== 'pending') {
    return <>—</>
  }

  const link = inviteRedirectTo(props.invitationId)

  return (
    <div className="grid gap-2 text-xs">
      <code className="border-ink bg-muted block overflow-x-auto rounded border p-2">
        {link}
      </code>

      <Button
        type="button"
        variant="brutal-outline"
        size="sm"
        onClick={() => void copyText(link)}
      >
        Copy link
      </Button>
    </div>
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
      <Button
        type="button"
        variant="brutal-outline"
        size="sm"
        onClick={() => props.onResend(props.invitationId)}
      >
        Resend
      </Button>

      <Button
        type="button"
        variant="brutal-outline"
        size="sm"
        onClick={() => props.onRevoke(props.invitationId)}
      >
        Revoke
      </Button>
    </>
  )
}

function RosterListRow(props: {
  row: RosterRow
  onResend: (invitationId: string) => void
  onRevoke: (invitationId: string) => void
  onRotate: (rosterStudentId: Id<'rosterStudents'>) => void
}) {
  const { row } = props
  const displayName = rosterRowDisplayName({
    resolvedName: row.resolvedName,
    email: row.email,
  })

  return (
    <article className="hover:bg-muted/40 grid gap-4 px-4 py-6 transition-colors @min-[48rem]/admin:grid-cols-12 @min-[48rem]/admin:items-center @min-[48rem]/admin:gap-6">
      <div className="grid grid-cols-[auto_1fr] items-center gap-4 @min-[48rem]/admin:col-span-5">
        <div className="border-ink bg-accent text-accent-foreground grid size-12 place-items-center border-2">
          <span className="text-lg font-bold">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        </div>

        <div>
          <p className="font-heading text-lg font-bold capitalize">
            {displayName}
          </p>

          <p className="text-muted-foreground text-sm font-bold">
            ID: #{row.externalStudentId}
          </p>
        </div>
      </div>

      <div className="grid gap-1 text-sm @min-[48rem]/admin:col-span-3">
        <p className="text-sm">
          <span className="font-bold">{`Roster: ${row.status}`}</span>
        </p>

        <p className="text-sm">
          <span className="font-bold">
            {`Invite: ${row.invitationStatus}${row.invitationIsExpired ? ' (expired)' : ''}`}
          </span>
        </p>

        <p className="truncate text-sm">
          <span className="font-bold">{`Pay token: ${row.payToken}`}</span>
        </p>
      </div>

      <div className="grid gap-2 @min-[48rem]/admin:col-span-4 @min-[48rem]/admin:justify-items-end">
        <RosterInviteLink
          invitationId={row.invitationId}
          invitationStatus={row.invitationStatus}
        />

        <div className="grid gap-2 @min-[22rem]/admin:grid-cols-[repeat(3,auto)]">
          <PendingInvitationActions
            invitationId={row.invitationId}
            invitationStatus={row.invitationStatus}
            onResend={props.onResend}
            onRevoke={props.onRevoke}
          />

          <Button
            type="button"
            variant="brutal"
            className="h-auto px-4 py-2 text-xs font-bold"
            onClick={() => props.onRotate(row.rosterStudentId)}
          >
            Rotate token
          </Button>
        </div>
      </div>
    </article>
  )
}

type RosterRow = FunctionReturnType<
  typeof api.features.invitations.listClassroomRoster
>[number]

type ClassroomTeacher = FunctionReturnType<
  typeof api.features.admin.context.listClassroomTeachers
>[number]
