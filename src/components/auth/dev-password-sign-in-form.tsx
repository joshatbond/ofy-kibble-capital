import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PawketBrutalButton } from '~/components/pawket/landing/pawket-brutal-button'
import { omitSignedOutSearch } from '~/lib/auth-redirect'

export function DevPasswordSignInForm(props: {
  email?: string
  emailReadOnly?: boolean
}) {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const emailReadOnly = props.emailReadOnly ?? props.email !== undefined
  const [email, setEmail] = useState(props.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (props.email !== undefined) {
      setEmail(props.email)
    }
  }, [props.email])

  return (
    <form
      className="space-y-2"
      onSubmit={event => {
        event.preventDefault()
        void handleSubmit()
      }}
    >
      <fieldset>
        <label className="space-x-2">
          <span>Email</span>

          <input
            type="email"
            className="bg-background rounded px-2 py-1"
            value={email}
            onChange={event => setEmail(event.target.value)}
            readOnly={emailReadOnly}
            required
          />
        </label>
      </fieldset>

      <fieldset>
        <label className="space-x-2">
          <span>Password</span>

          <input
            type="password"
            className="bg-background rounded px-2 py-1"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            minLength={4}
            required
          />
        </label>
      </fieldset>

      <p>Local dev only — creates a test account if one does not exist yet.</p>

      {error !== null ? <p role="alert">{error}</p> : null}

      <PawketBrutalButton
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground w-full sm:w-auto"
      >
        {pending ? 'Signing in…' : 'Sign in with password'}
      </PawketBrutalButton>
    </form>
  )

  async function handleSubmit() {
    setError(null)
    setPending(true)

    const normalizedEmail = email.trim().toLowerCase()

    try {
      await signIn('password', {
        email: normalizedEmail,
        password,
        flow: 'signIn',
      })
      clearSignedOutFlag()
      return
    } catch (signInError) {
      try {
        await signIn('password', {
          email: normalizedEmail,
          password,
          flow: 'signUp',
        })
        clearSignedOutFlag()
      } catch (signUpError) {
        setError(
          signUpError instanceof Error
            ? signUpError.message
            : signInError instanceof Error
              ? signInError.message
              : 'Sign in failed.'
        )
      }
    } finally {
      setPending(false)
    }
  }

  function clearSignedOutFlag() {
    void navigate({
      search: (prev: { signedOut?: boolean }) => omitSignedOutSearch(prev),
      replace: true,
    })
  }
}
