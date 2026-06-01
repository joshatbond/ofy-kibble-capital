import {
  writeConvexOAuthVerifierId,
  writePendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

export async function beginGoogleOAuthSignIn(props: {
  signIn: GoogleOAuthSignIn
  redirectTo: string
  afterVerifierCreated?: (verifierId: string) => Promise<void>
}) {
  writePendingOAuthRedirectTo(props.redirectTo)

  const result = await props.signIn({
    provider: 'google',
    params: { redirectTo: props.redirectTo },
  })

  if (result.redirect === undefined) {
    return
  }

  if (result.verifier !== undefined) {
    writeConvexOAuthVerifierId(result.verifier)
    await props.afterVerifierCreated?.(result.verifier)
  }

  window.location.href = result.redirect
}
type GoogleOAuthSignIn = (args: {
  provider: 'google'
  params: { redirectTo: string }
}) => Promise<{ redirect?: string; verifier?: string }>
