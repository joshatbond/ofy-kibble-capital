import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'

import { AdminNav } from '~/components/admin/admin-nav'
import { Case, SwitchOn } from '~/components/switch-on'
import { For } from '~/components/ui/for'
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'
import { inviteRedirectTo } from '~/lib/auth-redirect'

import type { FunctionReturnType } from 'convex/server'

export const Route = createFileRoute('/admin/$orgId/$classId/')({
  component: AdminClassPage,
})

function AdminClassPage() {
  const params = Route.useParams()
  const context = useQuery(
    api.features.admin.context.getTeacherClassroomContext
  )
  const roster = useQuery(api.features.invitations.listClassroomRoster, {
    organizationId: params.orgId,
  })
  const teachers = useQuery(api.features.admin.context.listClassroomTeachers, {
    organizationId: params.orgId,
  })

  const classroomMismatch =
    context !== undefined &&
    context !== null &&
    (context.organizationId !== params.orgId ||
      context.classroomId !== params.classId)

  return (
    <SwitchOn>
      <Case
        predicate={
          context === undefined ||
          roster === undefined ||
          teachers === undefined
        }
      >
        <main>
          <p>Loading classroom roster…</p>
        </main>
      </Case>

      <Case predicate={context === null}>
        <main>
          <p>No classroom found for your account.</p>
        </main>
      </Case>

      <Case predicate={classroomMismatch}>
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
    api.features.admin.context.getTeacherClassroomContext
  )
  const roster = useQuery(api.features.invitations.listClassroomRoster, {
    organizationId: params.orgId,
  })
  const teachers = useQuery(api.features.admin.context.listClassroomTeachers, {
    organizationId: params.orgId,
  })

  const inviteStudent = useMutation(api.features.invitations.inviteStudent)
  const inviteCoTeacher = useMutation(api.features.invitations.inviteCoTeacher)
  const resendInvitation = useMutation(
    api.features.invitations.resendClassroomInvitation
  )
  const revokeInvitation = useMutation(
    api.features.invitations.revokeClassroomInvitation
  )
  const rotatePayToken = useMutation(api.features.invitations.rotatePayToken)

  const [studentEmail, setStudentEmail] = useState('')
  const [externalStudentId, setExternalStudentId] = useState('')
  const [grade, setGrade] = useState<7 | 8>(7)
  const [coTeacherEmail, setCoTeacherEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formPending, setFormPending] = useState(false)
  const [successLink, setSuccessLink] = useState<string | null>(null)
  const [rowActionError, setRowActionError] = useState<string | null>(null)

  if (
    context === undefined ||
    context === null ||
    roster === undefined ||
    teachers === undefined
  ) {
    return null
  }

  return (
    <main>
      <h1>Classroom roster &amp; invitations</h1>

      <p>
        <strong>{context.classroomName}</strong>
      </p>

      <AdminNav
        organizationId={context.organizationId}
        classroomId={context.classroomId}
        current="classroom"
      />

      <section>
        <h2>How invitations work</h2>

        <ul>
          <li>
            Checking and Savings accounts are provisioned when you send a
            student invite (empty until they earn).
          </li>

          <li>
            Students stay pending on the roster until they accept; they are
            excluded from pay runs and POS until active.
          </li>

          <li>
            A pay token is created at invite send so you can print ID cards
            immediately. Rotate it if a QR is compromised.
          </li>

          <li>Invitation links expire after 14 days. Resend to refresh.</li>

          <li>Co-teachers have equal teacher permissions on this classroom.</li>
        </ul>
      </section>

      <InvitationSentSection link={successLink} />

      <AlertMessage message={formError} />

      <AlertMessage message={rowActionError} />

      <section>
        <h2>Invite student</h2>

        <form
          onSubmit={event => {
            event.preventDefault()
            void handleInviteStudent()
          }}
        >
          <p>
            <label>
              {import.meta.env.DEV ? 'Email' : 'School email'}

              <input
                type="email"
                value={studentEmail}
                onChange={event => setStudentEmail(event.target.value)}
                required
              />
            </label>
          </p>

          {import.meta.env.DEV ? (
            <p>
              Local dev: invite alias emails and accept with password sign-in on
              the invite link.
            </p>
          ) : null}

          <p>
            <label>
              External student ID
              <input
                type="number"
                value={externalStudentId}
                onChange={event => setExternalStudentId(event.target.value)}
                required
              />
            </label>
          </p>

          <p>
            <label>
              Grade
              <select
                value={grade}
                onChange={event =>
                  setGrade(Number(event.target.value) as 7 | 8)
                }
              >
                <option value={7}>7</option>

                <option value={8}>8</option>
              </select>
            </label>
          </p>

          <button type="submit" disabled={formPending}>
            {formPending ? 'Sending…' : 'Invite student'}
          </button>
        </form>
      </section>

      <section>
        <h2>Invite co-teacher</h2>

        <form
          onSubmit={event => {
            event.preventDefault()
            void handleInviteCoTeacher()
          }}
        >
          <p>
            <label>
              {import.meta.env.DEV ? 'Email' : 'School email'}

              <br />

              <input
                type="email"
                value={coTeacherEmail}
                onChange={event => setCoTeacherEmail(event.target.value)}
                required
              />
            </label>
          </p>

          <button type="submit" disabled={formPending}>
            {formPending ? 'Sending…' : 'Invite co-teacher'}
          </button>
        </form>
      </section>

      <section>
        <h2>Co-teachers</h2>

        <SwitchOn>
          <Case predicate={teachers.length === 0}>
            <p>No co-teachers yet.</p>
          </Case>

          <Case>
            <ul>
              <For data={teachers} getKey={teacher => teacher.userId}>
                {teacher => (
                  <li>
                    {`${teacher.name ?? teacher.email} (${teacher.role}) — ${teacher.email}`}
                  </li>
                )}
              </For>
            </ul>
          </Case>
        </SwitchOn>
      </section>

      <section>
        <h2>Roster</h2>

        <SwitchOn>
          <Case predicate={roster.length === 0}>
            <p>No students invited yet.</p>
          </Case>

          <Case>
            <table>
              <thead>
                <tr>
                  <th>Email</th>

                  <th>Student ID</th>

                  <th>Grade</th>

                  <th>Roster status</th>

                  <th>Invitation</th>

                  <th>Pay token</th>

                  <th>Invite link</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <For data={roster} getKey={row => row.rosterStudentId}>
                  {row => (
                    <RosterTableRow
                      row={row}
                      onResend={handleResend}
                      onRevoke={handleRevoke}
                      onRotate={handleRotate}
                    />
                  )}
                </For>
              </tbody>
            </table>
          </Case>
        </SwitchOn>
      </section>
    </main>
  )

  async function handleInviteStudent() {
    setFormError(null)
    setSuccessLink(null)
    setFormPending(true)

    try {
      const parsedId = Number(externalStudentId)
      if (!Number.isFinite(parsedId)) {
        throw new Error('External student ID must be a number.')
      }

      const result = await inviteStudent({
        organizationId: params.orgId,
        email: studentEmail,
        externalStudentId: parsedId,
        grade,
      })

      setStudentEmail('')
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

  async function handleInviteCoTeacher() {
    setFormError(null)
    setSuccessLink(null)
    setFormPending(true)

    try {
      const result = await inviteCoTeacher({
        organizationId: params.orgId,
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

  async function handleResend(invitationId: string) {
    setRowActionError(null)

    try {
      const result = await resendInvitation({
        organizationId: params.orgId,
        invitationId,
      })
      setSuccessLink(inviteRedirectTo(result.invitationId))
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
        organizationId: params.orgId,
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
        organizationId: params.orgId,
        rosterStudentId,
      })
    } catch (error) {
      setRowActionError(
        error instanceof Error ? error.message : 'Could not rotate pay token.'
      )
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
    <section>
      <h2>Invitation sent</h2>

      <p>Share this link with the invitee (email delivery comes later):</p>

      <p>
        <code>{link}</code>

        <button type="button" onClick={() => void copyText(link)}>
          Copy link
        </button>
      </p>
    </section>
  )
}

function AlertMessage(props: { message: string | null }) {
  if (props.message === null) {
    return null
  }

  return <p role="alert">{props.message}</p>
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
    <>
      <code>{link}</code>

      <button type="button" onClick={() => void copyText(link)}>
        Copy link
      </button>
    </>
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
      <button type="button" onClick={() => props.onResend(props.invitationId)}>
        Resend
      </button>

      <button type="button" onClick={() => props.onRevoke(props.invitationId)}>
        Revoke
      </button>
    </>
  )
}

function RosterTableRow(props: {
  row: RosterRow
  onResend: (invitationId: string) => void
  onRevoke: (invitationId: string) => void
  onRotate: (rosterStudentId: Id<'rosterStudents'>) => void
}) {
  const { row } = props

  return (
    <tr>
      <td>{row.email}</td>

      <td>{row.externalStudentId}</td>

      <td>{row.grade}</td>

      <td>{row.status}</td>

      <td>
        {row.invitationStatus}

        {row.invitationIsExpired ? ' (expired)' : ''}
      </td>

      <td>
        <code>{row.payToken}</code>
      </td>

      <td>
        <RosterInviteLink
          invitationId={row.invitationId}
          invitationStatus={row.invitationStatus}
        />
      </td>

      <td>
        <PendingInvitationActions
          invitationId={row.invitationId}
          invitationStatus={row.invitationStatus}
          onResend={props.onResend}
          onRevoke={props.onRevoke}
        />

        <button
          type="button"
          onClick={() => props.onRotate(row.rosterStudentId)}
        >
          Rotate pay token
        </button>
      </td>
    </tr>
  )
}

type RosterRow = FunctionReturnType<
  typeof api.features.invitations.listClassroomRoster
>[number]
