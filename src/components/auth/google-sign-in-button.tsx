import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'

export function GoogleSignInButton(props: {
  redirectTo: string
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
        redirectTo: props.redirectTo,
      })
    } finally {
      setPending(false)
    }
  }
}
