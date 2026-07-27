import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { omitSignedOutSearch } from '~/lib/auth-redirect'

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
      // Keep the race flag only until signOut finishes, then drop it so the
      // next password / OAuth sign-in can leave the landing page.
      void navigate({ to: props.landingTo, search: { signedOut: true } })
      await signOut()
      void navigate({
        to: props.landingTo,
        search: (prev: { signedOut?: boolean }) => omitSignedOutSearch(prev),
        replace: true,
      })
    } finally {
      setPending(false)
    }
  }
}
