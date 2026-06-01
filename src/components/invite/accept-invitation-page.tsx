import { useConvexAuth } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'

import { InviteSignInButton } from '~/components/auth/invite-sign-in-button'
import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { PawketBrutalFrame } from '~/components/pawket/landing/pawket-brutal-frame'
import { Case, SwitchOn } from '~/components/switch-on'
import { OFY_EMAIL_DOMAIN } from '~/lib/invitation-policy'
import { resolveInvitePostAcceptRedirect } from '~/lib/invite-auth-redirect'

import { api } from '../../../convex/_generated/api'

import type { FunctionReturnType } from 'convex/server'

export function AcceptInvitationPage(props: { invitationId: string }) {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const preview = useQuery(api.features.invitations.getInvitePreview, {
    invitationId: props.invitationId,
  })
  const viewerEmail = useQuery(
    api.features.invitations.viewerEmail,
    isAuthenticated ? {} : 'skip'
  )
  const acceptInvitation = useMutation(
    api.features.invitations.acceptClassroomInvitation
  )

  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  const previewLoading = preview === undefined
  const emailMismatch =
    preview !== null &&
    preview !== undefined &&
    viewerEmail !== null &&
    viewerEmail !== undefined &&
    viewerEmail.toLowerCase() !== preview.inviteeIdentifier.toLowerCase()

  const showAcceptForm =
    preview !== null &&
    preview !== undefined &&
    !previewLoading &&
    !authLoading &&
    preview.status !== 'cancelled' &&
    !preview.isExpired &&
    preview.status !== 'expired' &&
    preview.status !== 'accepted'

  async function handleAccept() {
    setAccepting(true)
    setAcceptError(null)

    try {
      const result = await acceptInvitation({
        invitationId: props.invitationId,
      })
      void navigate({
        to: resolveInvitePostAcceptRedirect(result.redirectPath),
        replace: true,
      })
    } catch (error) {
      setAcceptError(
        error instanceof Error ? error.message : 'Could not accept invitation.'
      )
    } finally {
      setAccepting(false)
    }
  }

  return (
    <SwitchOn>
      <Case predicate={previewLoading || authLoading}>
        <InviteStatusCard title="Loading invitation…" />
      </Case>

      <Case predicate={!previewLoading && preview === null}>
        <InviteStatusCard
          title="Invitation not found"
          body="This link may be invalid or was removed. Ask your teacher for a new invite."
        />
      </Case>

      <Case predicate={preview?.status === 'cancelled'}>
        <InviteStatusCard
          title="Invitation revoked"
          body="Your teacher cancelled this invite. Ask them to send a new one."
        />
      </Case>

      <Case
        predicate={preview?.isExpired === true || preview?.status === 'expired'}
      >
        <InviteStatusCard
          title="Invitation expired"
          body="Invitations last 14 days. Ask your teacher to resend yours."
        />
      </Case>

      <Case predicate={preview?.status === 'accepted'}>
        <InviteStatusCard
          title="Already accepted"
          body={`You are already a member of ${preview?.organizationName ?? 'this classroom'}.`}
          action={
            <PawketBrutalButton
              type="button"
              onClick={() => {
                void navigate({
                  to: resolveInvitePostAcceptRedirect(
                    preview?.role === 'student' ? '/kibble/' : '/admin/'
                  ),
                  replace: true,
                })
              }}
            >
              Continue
            </PawketBrutalButton>
          }
        />
      </Case>

      <Case predicate={showAcceptForm}>
        <InviteAcceptForm
          invitationId={props.invitationId}
          preview={preview}
          isAuthenticated={isAuthenticated}
          emailMismatch={emailMismatch}
          viewerEmail={viewerEmail ?? undefined}
          acceptError={acceptError}
          accepting={accepting}
          onAccept={() => void handleAccept()}
        />
      </Case>
    </SwitchOn>
  )
}

type InvitePreview = NonNullable<
  FunctionReturnType<typeof api.features.invitations.getInvitePreview>
>

function InviteAcceptForm(props: {
  invitationId: string
  preview: InvitePreview
  isAuthenticated: boolean
  emailMismatch: boolean
  viewerEmail: string | undefined
  acceptError: string | null
  accepting: boolean
  onAccept: () => void
}) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-12">
      <PawketBrutalFrame className="w-full max-w-lg p-8 md:p-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Join {props.preview.organizationName}
        </h1>

        <p className="text-muted-foreground mt-3 text-base leading-relaxed">
          {`You were invited as a ${props.preview.role === 'student' ? 'student' : 'teacher'} with ${props.preview.inviteeIdentifier}.`}
        </p>

        <p className="text-muted-foreground mt-2 text-sm">
          Sign in with your school Google account ({OFY_EMAIL_DOMAIN}) using
          that exact email.
        </p>

        <SwitchOn>
          <Case predicate={!props.isAuthenticated}>
            <div className="mt-8 flex flex-col gap-3">
              <InviteSignInButton
                invitationId={props.invitationId}
                large
                className="w-full"
              >
                Sign in with Google
              </InviteSignInButton>
            </div>
          </Case>

          <Case predicate={props.isAuthenticated && props.emailMismatch}>
            <p className="text-destructive mt-6 text-sm font-medium">
              {`You are signed in as ${props.viewerEmail}, but this invite was sent to ${props.preview.inviteeIdentifier}. Sign out and try again with the invited account.`}
            </p>
          </Case>

          <Case predicate={props.isAuthenticated && !props.emailMismatch}>
            <div className="mt-8 flex flex-col gap-3">
              {props.acceptError !== null ? (
                <p className="text-destructive text-sm font-medium">
                  {props.acceptError}
                </p>
              ) : null}

              <PawketBrutalButton
                type="button"
                large
                className="w-full"
                disabled={props.accepting}
                onClick={props.onAccept}
              >
                {props.accepting ? 'Accepting…' : 'Accept invitation'}
              </PawketBrutalButton>
            </div>
          </Case>
        </SwitchOn>
      </PawketBrutalFrame>
    </div>
  )
}

function InviteStatusCard(props: {
  title: string
  body?: string
  action?: React.ReactNode
}) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-12">
      <PawketBrutalFrame className="w-full max-w-lg p-8 md:p-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {props.title}
        </h1>

        {props.body !== undefined ? (
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            {props.body}
          </p>
        ) : null}

        {props.action !== undefined ? (
          <div className="mt-8">{props.action}</div>
        ) : null}
      </PawketBrutalFrame>
    </div>
  )
}
