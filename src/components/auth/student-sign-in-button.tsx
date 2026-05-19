import { useAction, useMutation } from 'convex/react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { resolveStudentSignInRedirect } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'
import {
  writeConvexOAuthVerifierId,
  writePendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

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
    api.studentAuth.recordOAuthStudentApp
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

          writePendingOAuthRedirectTo(redirectTo)

          const result = await signIn({
            provider: 'google',
            params: { redirectTo },
          })

          if (result.redirect === undefined) {
            return
          }

          if (result.verifier !== undefined) {
            writeConvexOAuthVerifierId(result.verifier)
            await recordOAuthStudentApp({
              verifierId: result.verifier as Id<'authVerifiers'>,
              redirectTo,
            })
          }

          window.location.href = result.redirect
        })()
      }}
    >
      {props.children}
    </PawketBrutalButton>
  )
}
