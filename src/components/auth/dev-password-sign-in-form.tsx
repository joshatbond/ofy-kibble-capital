import { useAuthActions } from '@convex-dev/auth/react'
import { useEffect, useState } from 'react'

export function DevPasswordSignInForm(props: {
  email?: string
  emailReadOnly?: boolean
  className?: string
}) {
  const { signIn } = useAuthActions()
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
      className={props.className}
      onSubmit={event => {
        event.preventDefault()
        void handleSubmit()
      }}
    >
      <p>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            readOnly={emailReadOnly}
            required
          />
        </label>
      </p>

      <p>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            minLength={4}
            required
          />
        </label>
      </p>

      <p>Local dev only — creates a test account if one does not exist yet.</p>

      {error !== null ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in with password'}
      </button>
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
      return
    } catch (signInError) {
      try {
        await signIn('password', {
          email: normalizedEmail,
          password,
          flow: 'signUp',
        })
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
}
