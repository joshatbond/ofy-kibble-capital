import { useQuery } from 'convex/react'

import { DevPasswordSignInForm } from '~/components/auth/dev-password-sign-in-form'
import type { SignedOutClearTo } from '~/components/auth/dev-password-sign-in-form'
import { api } from '~/convex/_generated/api'

export function LandingDevSignIn(props: { signedOutClearTo: SignedOutClearTo }) {
  const devPasswordAuth = useQuery(api.features.auth.devPassword.isEnabled)

  if (devPasswordAuth !== true) {
    return null
  }

  return (
    <section className="border-ink bg-muted mx-auto max-w-[640px] space-y-3 rounded-xl border-2 p-6 text-left">
      <h2 className="font-heading text-lg font-bold">Dev test sign-in</h2>

      <p className="text-muted-foreground text-sm">
        Local development only. Use Google sign-in above in deployed
        environments.
      </p>

      <DevPasswordSignInForm
        emailReadOnly={false}
        signedOutClearTo={props.signedOutClearTo}
      />
    </section>
  )
}
