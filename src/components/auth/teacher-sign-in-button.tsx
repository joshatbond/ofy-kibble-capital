import { useAction } from 'convex/react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { resolveTeacherSignInRedirect } from '~/lib/admin-auth-redirect'
import { writePendingOAuthRedirectTo } from '~/lib/convex-auth-storage'

import { api } from '../../../convex/_generated/api'

import type { ComponentProps } from 'react'

export function TeacherSignInButton(props: {
  children: React.ReactNode
  className?: string
  large?: boolean
  returnTo?: string
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
        void (async () => {
          const redirectTo = resolveTeacherSignInRedirect(props.returnTo)

          writePendingOAuthRedirectTo(redirectTo)

          const result = await signIn({
            provider: 'google',
            params: { redirectTo },
          })

          if (result.redirect === undefined) {
            return
          }

          window.location.href = result.redirect
        })()
      }}
    >
      {props.children}
    </PawketBrutalButton>
  )
}
