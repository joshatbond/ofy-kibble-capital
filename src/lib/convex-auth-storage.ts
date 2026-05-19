const OAUTH_VERIFIER_KEY = '__convexAuthOAuthVerifier'
const PENDING_OAUTH_REDIRECT_KEY = '__ofy.pendingOAuthRedirectTo'

function convexAuthStorageNamespace(): string {
  return (import.meta.env.VITE_CONVEX_URL ?? '').replace(/[^a-zA-Z0-9]/g, '')
}

function convexAuthStorageKey(key: string): string {
  return `${key}_${convexAuthStorageNamespace()}`
}

/** OAuth PKCE verifier id stored by Convex Auth between sign-in redirect and callback. */
export function readConvexOAuthVerifierId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(convexAuthStorageKey(OAUTH_VERIFIER_KEY))
}

/** Match Convex Auth client storage so apply can read the verifier after callback. */
export function writeConvexOAuthVerifierId(verifierId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(convexAuthStorageKey(OAUTH_VERIFIER_KEY), verifierId)
}

export function clearConvexOAuthVerifierId(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(convexAuthStorageKey(OAUTH_VERIFIER_KEY))
}

export function readPendingOAuthRedirectTo(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage.getItem(PENDING_OAUTH_REDIRECT_KEY)
}

export function writePendingOAuthRedirectTo(redirectTo: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(PENDING_OAUTH_REDIRECT_KEY, redirectTo)
}

export function clearPendingOAuthRedirectTo(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(PENDING_OAUTH_REDIRECT_KEY)
}
