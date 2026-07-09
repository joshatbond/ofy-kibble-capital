import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { resolveStudentSignInRedirect } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

import type { ComponentProps } from 'react'

export function StudentSignInButton(props: {
  app: StudentApp
  children: React.ReactNode
  className?: string
  large?: boolean
  returnTo?: string
  variant?: ComponentProps<typeof PawketBrutalButton>['variant']
}) {
  const { signIn } = useAuthActions()
  const [pending, setPending] = useState(false)

  return (
    <PawketBrutalButton
      type="button"
      variant={props.variant}
      large={props.large}
      className={props.className}
      disabled={pending}
      onClick={() => void handleClick()}
    >
      {pending ? 'Signing in…' : props.children}
    </PawketBrutalButton>
  )

  async function handleClick() {
    setPending(true)

    try {
      await signIn('google', {
        redirectTo: resolveStudentSignInRedirect(props.app, props.returnTo),
      })
    } finally {
      setPending(false)
    }
  }
}
