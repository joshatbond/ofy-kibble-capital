import { useMutation, useAction } from 'convex/react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { resolveStudentSignInRedirect } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'
import { beginGoogleOAuthSignIn } from '~/lib/begin-google-oauth-sign-in'

import { api } from '../../../convex/_generated/api'

import type { Id } from '../../../convex/_generated/dataModel'
import type { ComponentProps } from 'react'

export function StudentSignInButton(props: {
  app: StudentApp
  children: React.ReactNode
  className?: string
  large?: boolean
  returnTo?: string
  variant?: ComponentProps<typeof PawketBrutalButton>['variant']
}) {
  const signIn = useAction(api.auth.signIn)
  const recordOAuthStudentApp = useMutation(
    api.features.auth.studentAuth.recordOAuthStudentApp
  )

  return (
    <PawketBrutalButton
      type="button"
      variant={props.variant}
      large={props.large}
      className={props.className}
      onClick={() => {
        void (async () => {
          const redirectTo = resolveStudentSignInRedirect(
            props.app,
            props.returnTo
          )

          await beginGoogleOAuthSignIn({
            signIn,
            redirectTo,
            afterVerifierCreated: async verifierId => {
              await recordOAuthStudentApp({
                verifierId: verifierId as Id<'authVerifiers'>,
                redirectTo,
              })
            },
          })
        })()
      }}
    >
      {props.children}
    </PawketBrutalButton>
  )
}
