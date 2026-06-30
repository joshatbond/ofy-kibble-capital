import { useConvexAuth } from '@convex-dev/auth/react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useState } from 'react'

import { DevPasswordSignInForm } from '~/components/auth/dev-password-sign-in-form'
import { GoogleSignInButton } from '~/components/auth/google-sign-in-button'
import { SignOutButton } from '~/components/auth/sign-out-button'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { normalizeInviteEmail } from '~/convex/features/invitations/policy'
import { invitePath, inviteRedirectTo } from '~/lib/auth-redirect'

import type { FunctionReturnType } from 'convex/server'

export const Route = createFileRoute('/invite/$invitationId')({
  component: InviteAcceptPage,
})

function InviteAcceptPage() {
  if (!import.meta.env.VITE_CONVEX_URL) {
    return (
      <main>
        <p>Convex is not configured.</p>
      </main>
    )
  }

  return <InviteAcceptPageWithConvex />
}

function InviteAcceptPageWithConvex() {
  const { invitationId } = Route.useParams()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()
  const preview = useQuery(api.features.invitations.getInvitePreview, {
    invitationId,
  })
  const viewerEmail = useQuery(
    api.features.invitations.viewerEmail,
    isAuthenticated ? {} : 'skip'
  )
  const acceptInvitation = useMutation(
    api.features.invitations.acceptClassroomInvitation
  )
  const devPasswordAuth = useQuery(api.features.auth.devPassword.isEnabled)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [acceptPending, setAcceptPending] = useState(false)
  const [autoAcceptAttempted, setAutoAcceptAttempted] = useState(false)

  const previewLoading =
    preview === undefined || (isAuthenticated && viewerEmail === undefined)

  const emailMatches =
    preview !== undefined &&
    preview !== null &&
    viewerEmail !== undefined &&
    viewerEmail !== null &&
    normalizeInviteEmail(preview.inviteeIdentifier) ===
      normalizeInviteEmail(viewerEmail)

  const isPendingInvite =
    preview !== undefined &&
    preview !== null &&
    preview.status === 'pending' &&
    !preview.isExpired

  const handleAccept = useCallback(async () => {
    setAcceptError(null)
    setAcceptPending(true)

    try {
      const result = await acceptInvitation({ invitationId })
      void navigate({
        to: normalizeRedirectPath(result.redirectPath),
        replace: true,
      })
    } catch (error) {
      setAcceptError(
        error instanceof Error ? error.message : 'Could not accept invitation.'
      )
    } finally {
      setAcceptPending(false)
    }
  }, [acceptInvitation, invitationId, navigate])

  useEffect(() => {
    if (
      !isAuthenticated ||
      !isPendingInvite ||
      !emailMatches ||
      autoAcceptAttempted ||
      acceptPending
    ) {
      return
    }

    setAutoAcceptAttempted(true)
    void handleAccept()
  }, [
    acceptPending,
    autoAcceptAttempted,
    emailMatches,
    handleAccept,
    isAuthenticated,
    isPendingInvite,
  ])

  return (
    <SwitchOn>
      <Case predicate={previewLoading}>
        <main>
          <p>Loading invitation…</p>
        </main>
      </Case>

      <Case predicate={preview === null}>
        <main>
          <h1>Invitation</h1>

          <p>This invitation link is invalid.</p>
        </main>
      </Case>

      <Case predicate={preview?.status === 'cancelled'}>
        <main>
          <h1>Invitation revoked</h1>

          <p>This invitation was revoked. Ask your teacher for a new invite.</p>
        </main>
      </Case>

      <Case
        predicate={preview?.status === 'expired' || preview?.isExpired === true}
      >
        <main>
          <h1>Invitation expired</h1>

          <p>This invitation expired. Ask your teacher to resend it.</p>
        </main>
      </Case>

      <Case predicate={preview?.status === 'accepted'}>
        <main>
          <h1>Already accepted</h1>

          <p>You have already accepted this invitation.</p>

          <p>
            <Link to={acceptedDestination(preview)}>
              Continue to your dashboard
            </Link>
          </p>
        </main>
      </Case>

      <Case predicate={isPendingInvite}>
        <PendingInviteMain
          invitationId={invitationId}
          preview={preview}
          acceptError={acceptError}
          acceptPending={acceptPending}
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
          viewerEmail={viewerEmail ?? null}
          emailMatches={emailMatches}
          devPasswordAuth={devPasswordAuth}
          onAccept={() => void handleAccept()}
        />
      </Case>
    </SwitchOn>
  )
}

function PendingInviteMain(props: {
  invitationId: string
  preview?: InvitePreview | null
  acceptError: string | null
  acceptPending: boolean
  isLoading: boolean
  isAuthenticated: boolean
  viewerEmail: string | null
  emailMatches: boolean
  devPasswordAuth: boolean | undefined
  onAccept: () => void
}) {
  if (props.preview === undefined || props.preview === null) {
    return null
  }

  const preview = props.preview
  const expiresLabel = new Date(preview.expiresAt).toLocaleDateString()

  return (
    <main>
      <h1>Join {preview.organizationName}</h1>

      <p>
        You are invited as a <strong>{formatRole(preview.role)}</strong>.
      </p>

      <p>
        Invited email: <strong>{preview.inviteeIdentifier}</strong>
      </p>

      <p>Expires: {expiresLabel}</p>

      {props.acceptError !== null ? (
        <p role="alert">{props.acceptError}</p>
      ) : null}

      <SwitchOn>
        <Case
          predicate={props.isLoading || props.devPasswordAuth === undefined}
        >
          <p>Checking sign-in…</p>
        </Case>

        <Case predicate={!props.isAuthenticated}>
          {props.devPasswordAuth ? (
            <>
              <p>
                {`Sign in as ${preview.inviteeIdentifier} to join ${preview.organizationName}.`}
              </p>

              <DevPasswordSignInForm
                email={preview.inviteeIdentifier}
                emailReadOnly
              />
            </>
          ) : (
            <>
              <p>
                {`Sign in with your @ofy.org Google account (${preview.inviteeIdentifier}) to join ${preview.organizationName}.`}
              </p>

              <GoogleSignInButton
                redirectTo={inviteRedirectTo(props.invitationId)}
              />
            </>
          )}
        </Case>

        <Case predicate={props.viewerEmail !== null && !props.emailMatches}>
          <p role="alert">
            Sign in as <strong>{preview.inviteeIdentifier}</strong> to accept
            this invitation. You are signed in as
            <strong>{props.viewerEmail}</strong>.
          </p>

          <p>
            <SignOutButton landingTo={invitePath(props.invitationId)} />
          </p>

          {props.devPasswordAuth ? (
            <DevPasswordSignInForm
              email={preview.inviteeIdentifier}
              emailReadOnly
            />
          ) : (
            <p>
              <GoogleSignInButton
                redirectTo={inviteRedirectTo(props.invitationId)}
              />
            </p>
          )}
        </Case>

        <Case predicate={props.emailMatches}>
          <p>Signed in as {props.viewerEmail}.</p>

          <button
            type="button"
            disabled={props.acceptPending}
            onClick={props.onAccept}
          >
            {props.acceptPending ? 'Accepting…' : 'Accept invitation'}
          </button>
        </Case>
      </SwitchOn>
    </main>
  )
}

function acceptedDestination(
  preview: InvitePreview | null | undefined
): '/admin' | '/kibble' {
  if (preview?.role === 'student') {
    return '/kibble'
  }

  return '/admin'
}

function formatRole(role: string): string {
  if (role === 'student') {
    return 'student'
  }

  if (role === 'teacher' || role === 'owner' || role === 'admin') {
    return 'teacher'
  }

  return role
}

function normalizeRedirectPath(path: string): '/admin' | '/kibble' {
  if (path.startsWith('/admin')) {
    return '/admin'
  }

  return '/kibble'
}

type InvitePreview = NonNullable<
  FunctionReturnType<typeof api.features.invitations.getInvitePreview>
>
