import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'

import { GoogleLogo } from '~/components/auth/google-logo'
import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { resolveTeacherSignInRedirect } from '~/lib/admin-auth-redirect'
import { cn } from '~/lib/class-name-merge'

import type { ComponentProps } from 'react'

export function TeacherSignInButton(props: {
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
      className={cn(
        'group inline-flex items-center justify-center gap-2.5',
        props.className
      )}
      disabled={pending}
      onClick={() => void handleClick()}
    >
      {pending ? (
        'Signing in…'
      ) : (
        <>
          <GoogleLogo className="transition-transform group-hover:scale-110 group-active:scale-95" />

          {props.children}
        </>
      )}
    </PawketBrutalButton>
  )

  async function handleClick() {
    setPending(true)

    try {
      await signIn('google', {
        redirectTo: resolveTeacherSignInRedirect(props.returnTo),
      })
    } finally {
      setPending(false)
    }
  }
}
