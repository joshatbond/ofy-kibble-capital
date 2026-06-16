import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'

import { studentAppRedirectTo } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

export function StudentSignInButton(props: {
  app: StudentApp
  className?: string
}) {
  const { signIn } = useAuthActions()
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      className={props.className}
      disabled={pending}
      onClick={() => void handleClick()}
    >
      {pending ? 'Signing in…' : 'Sign in with Google'}
    </button>
  )

  async function handleClick() {
    setPending(true)

    try {
      await signIn('google', {
        redirectTo: studentAppRedirectTo(props.app),
      })
    } finally {
      setPending(false)
    }
  }
}
