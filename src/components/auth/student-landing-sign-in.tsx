import { useQuery } from 'convex/react'

import { DevPasswordSignInForm } from '~/components/auth/dev-password-sign-in-form'
import { GoogleSignInButton } from '~/components/auth/google-sign-in-button'
import { api } from '~/convex/_generated/api'
import { studentAppRedirectTo } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

export function StudentLandingSignIn(props: { app: StudentApp }) {
  const devPasswordAuth = useQuery(api.features.auth.devPassword.isEnabled)

  if (devPasswordAuth === undefined) {
    return <p>Loading sign-in…</p>
  }

  return (
    <>
      {devPasswordAuth ? (
        <section>
          <h2>Dev test sign-in</h2>

          <DevPasswordSignInForm emailReadOnly={false} />

          <p>Or sign in with Google (@ofy.org):</p>
        </section>
      ) : null}

      <GoogleSignInButton redirectTo={studentAppRedirectTo(props.app)} />
    </>
  )
}
