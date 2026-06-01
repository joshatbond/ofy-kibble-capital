import { useAction } from 'convex/react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { beginGoogleOAuthSignIn } from '~/lib/begin-google-oauth-sign-in'
import { resolveInviteSignInRedirect } from '~/lib/invite-auth-redirect'

import { api } from '../../../convex/_generated/api'

import type { ComponentProps } from 'react'

export function InviteSignInButton(props: {
  invitationId: string
  children: React.ReactNode
  className?: string
  large?: boolean
  variant?: ComponentProps<typeof PawketBrutalButton>['variant']
}) {
  const signIn = useAction(api.auth.signIn)

  return (
    <PawketBrutalButton
      type="button"
      variant={props.variant}
      large={props.large}
      className={props.className}
      onClick={() => {
        void beginGoogleOAuthSignIn({
          signIn,
          redirectTo: resolveInviteSignInRedirect(props.invitationId),
        })
      }}
    >
      {props.children}
    </PawketBrutalButton>
  )
}
