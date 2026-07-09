import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export function SignOutButton(props: {
  landingTo: string
  className?: string
}) {
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      className={props.className}
      disabled={pending}
      onClick={() => void handleClick()}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )

  async function handleClick() {
    setPending(true)

    try {
      void navigate({ to: props.landingTo, search: { signedOut: true } })
      await signOut()
    } finally {
      setPending(false)
    }
  }
}
