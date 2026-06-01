import { useMutation, useQuery } from 'convex/react'
import { useMemo, useState } from 'react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { Case, SwitchOn } from '~/components/switch-on'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { OFY_EMAIL_DOMAIN } from '~/lib/invitation-policy'
import { invitePath } from '~/lib/invite-auth-redirect'

import { api } from '../../../convex/_generated/api'

import type { FunctionReturnType } from 'convex/server'

export function ClassroomRosterPanel(props: { organizationId: string }) {
  return (
    <div className="flex flex-col gap-10">
      <ClassroomInviteSection organizationId={props.organizationId} />

      <RosterSection organizationId={props.organizationId} />
    </div>
  )
}

function ClassroomInviteSection(props: { organizationId: string }) {
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null)

  return (
    <>
      <InviteStudentForm
        organizationId={props.organizationId}
        onInviteLink={setLastInviteLink}
      />

      <InviteCoTeacherForm
        organizationId={props.organizationId}
        onInviteLink={setLastInviteLink}
      />

      <InviteLinkBanner inviteLink={lastInviteLink} />
    </>
  )
}

function InviteStudentForm(props: {
  organizationId: string
  onInviteLink: (link: string) => void
}) {
  const inviteStudent = useMutation(api.features.invitations.inviteStudent)
  const [studentEmail, setStudentEmail] = useState('')
  const [externalStudentId, setExternalStudentId] = useState('')
  const [grade, setGrade] = useState<ClassroomRosterRow['grade']>(7)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Invite student
        </h2>

        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          School email ({OFY_EMAIL_DOMAIN}), external student ID, and grade.
          Checking and savings accounts are created when you send the invite.
        </p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={event => {
          event.preventDefault()
          void runConvexAction({ setBusy, setFormError }, async () => {
            const externalId = Number.parseInt(externalStudentId, 10)
            if (!Number.isFinite(externalId) || externalId <= 0) {
              throw new Error('External student ID must be a positive number.')
            }

            const result = await inviteStudent({
              organizationId: props.organizationId,
              email: studentEmail,
              externalStudentId: externalId,
              grade,
            })

            props.onInviteLink(inviteUrl(result.invitationId))
            setStudentEmail('')
            setExternalStudentId('')
          })
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="student-email">Student email</Label>

          <Input
            id="student-email"
            type="email"
            autoComplete="email"
            placeholder={`name${OFY_EMAIL_DOMAIN}`}
            value={studentEmail}
            onChange={event => setStudentEmail(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="external-id">External student ID</Label>

          <Input
            id="external-id"
            inputMode="numeric"
            placeholder="12345"
            value={externalStudentId}
            onChange={event => setExternalStudentId(event.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="grade">Grade</Label>

          <select
            id="grade"
            className="border-ink bg-card h-10 w-full rounded-md border-2 px-3 text-base"
            value={grade}
            onChange={event => {
              const next = Number(event.target.value)
              if (next === 7 || next === 8) {
                setGrade(next)
              }
            }}
          >
            <option value={7}>7</option>

            <option value={8}>8</option>
          </select>
        </div>

        <div className="flex items-end">
          <PawketBrutalButton
            type="submit"
            disabled={busy}
            className="w-full"
          >
            Send student invite
          </PawketBrutalButton>
        </div>
      </form>

      <FormErrorMessage error={formError} />
    </section>
  )
}

function InviteCoTeacherForm(props: {
  organizationId: string
  onInviteLink: (link: string) => void
}) {
  const inviteCoTeacher = useMutation(api.features.invitations.inviteCoTeacher)
  const [coTeacherEmail, setCoTeacherEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Invite co-teacher
        </h2>

        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Co-teachers have the same classroom permissions as you.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 md:flex-row md:items-end"
        onSubmit={event => {
          event.preventDefault()
          void runConvexAction({ setBusy, setFormError }, async () => {
            const result = await inviteCoTeacher({
              organizationId: props.organizationId,
              email: coTeacherEmail,
            })

            props.onInviteLink(inviteUrl(result.invitationId))
            setCoTeacherEmail('')
          })
        }}
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="co-teacher-email">Teacher email</Label>

          <Input
            id="co-teacher-email"
            type="email"
            autoComplete="email"
            placeholder={`teacher${OFY_EMAIL_DOMAIN}`}
            value={coTeacherEmail}
            onChange={event => setCoTeacherEmail(event.target.value)}
            required
          />
        </div>

        <PawketBrutalButton type="submit" disabled={busy}>
          Send co-teacher invite
        </PawketBrutalButton>
      </form>

      <FormErrorMessage error={formError} />
    </section>
  )
}

function InviteLinkBanner(props: { inviteLink: string | null }) {
  if (props.inviteLink === null) {
    return null
  }

  return (
    <p className="text-muted-foreground text-sm leading-relaxed">
      Invite link (14-day expiry):{' '}

      <a
        className="text-foreground font-medium underline"
        href={props.inviteLink}
      >
        {props.inviteLink}
      </a>
    </p>
  )
}

function RosterSection(props: { organizationId: string }) {
  const roster = useQuery(api.features.invitations.listClassroomRoster, {
    organizationId: props.organizationId,
  })

  const pendingCount = useMemo(
    () =>
      roster?.filter(
        row =>
          row.status === 'pending' &&
          row.invitationStatus === 'pending' &&
          !row.invitationIsExpired
      ).length ?? 0,
    [roster]
  )

  if (roster === undefined) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Roster
        </h2>

        <p className="text-muted-foreground text-base leading-relaxed">
          Loading roster…
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Roster
        </h2>

        <p className="text-muted-foreground text-sm">
          {`${pendingCount} pending · ${roster.length} total`}
        </p>
      </div>

      <SwitchOn>
        <Case predicate={roster.length === 0}>
          <p className="text-muted-foreground text-base leading-relaxed">
            No students invited yet.
          </p>
        </Case>

        <Case predicate={roster.length > 0}>
          <ul className="flex flex-col gap-3">
            {roster.map(row => (
              <RosterRow
                key={row.rosterStudentId}
                organizationId={props.organizationId}
                row={row}
              />
            ))}
          </ul>
        </Case>
      </SwitchOn>
    </section>
  )
}

function RosterRow(props: { organizationId: string; row: ClassroomRosterRow }) {
  const resendInvitation = useMutation(
    api.features.invitations.resendClassroomInvitation
  )
  const revokeInvitation = useMutation(
    api.features.invitations.revokeClassroomInvitation
  )
  const rotatePayToken = useMutation(api.features.invitations.rotatePayToken)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { row } = props
  const inviteLink = inviteUrl(row.invitationId)
  const statusLabel = rosterStatusLabel(row)
  const invitationPending =
    row.status === 'pending' && row.invitationStatus === 'pending'

  return (
    <li className="border-ink bg-card shadow-brutal rounded-lg border-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.email}</p>

          <p className="text-muted-foreground text-sm">
            {`ID ${row.externalStudentId} · Grade ${row.grade} · ${statusLabel}`}
          </p>

          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Pay token: {row.payToken}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {invitationPending ? (
            <>
              <PawketBrutalButton
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runConvexAction({ setBusy, setFormError }, async () => {
                    await resendInvitation({
                      organizationId: props.organizationId,
                      invitationId: row.invitationId,
                    })
                  })
                }
              >
                Resend
              </PawketBrutalButton>

              <PawketBrutalButton
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runConvexAction({ setBusy, setFormError }, async () => {
                    await revokeInvitation({
                      organizationId: props.organizationId,
                      invitationId: row.invitationId,
                    })
                  })
                }
              >
                Revoke
              </PawketBrutalButton>
            </>
          ) : null}

          <PawketBrutalButton
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runConvexAction({ setBusy, setFormError }, async () => {
                const result = await rotatePayToken({
                  organizationId: props.organizationId,
                  rosterStudentId: row.rosterStudentId,
                })
                void navigator.clipboard.writeText(result.payToken)
              })
            }
          >
            Rotate pay token
          </PawketBrutalButton>
        </div>
      </div>

      <FormErrorMessage error={formError} />

      {invitationPending ? (
        <p className="text-muted-foreground mt-3 text-xs">
          <a className="underline" href={inviteLink}>
            {inviteLink}
          </a>
        </p>
      ) : null}
    </li>
  )
}

function FormErrorMessage(props: { error: string | null }) {
  if (props.error === null) {
    return null
  }

  return (
    <p className="text-destructive text-sm font-medium">{props.error}</p>
  )
}

function inviteUrl(invitationId: string): string {
  const path = invitePath(invitationId)

  if (typeof window === 'undefined') {
    return path
  }

  return new URL(path, window.location.origin).href
}

function rosterStatusLabel(row: ClassroomRosterRow): string {
  if (row.status === 'active') {
    return 'Active'
  }

  if (row.status === 'revoked') {
    return 'Revoked'
  }

  if (row.invitationIsExpired || row.invitationStatus === 'expired') {
    return 'Expired'
  }

  if (row.invitationStatus === 'cancelled') {
    return 'Revoked'
  }

  return 'Pending'
}

async function runConvexAction(
  ui: {
    setBusy: (busy: boolean) => void
    setFormError: (error: string | null) => void
  },
  action: () => Promise<void>
) {
  ui.setBusy(true)
  ui.setFormError(null)

  try {
    await action()
  } catch (error) {
    ui.setFormError(
      error instanceof Error ? error.message : 'Something went wrong.'
    )
  } finally {
    ui.setBusy(false)
  }
}

type ClassroomRosterRow = FunctionReturnType<
  typeof api.features.invitations.listClassroomRoster
>[number]
