const OAUTH_VERIFIER_KEY = '__convexAuthOAuthVerifier'
const PENDING_OAUTH_REDIRECT_KEY = '__ofy.pendingOAuthRedirectTo'
const CONVEX_AUTH_JWT_KEY = '__convexAuthJWT'
const REFRESH_TOKEN_STORAGE_KEY = '__convexAuthRefreshToken'
export function convexAuthStorageNamespace(): string {
  return (import.meta.env.VITE_CONVEX_URL ?? '').replace(/[^a-zA-Z0-9]/g, '')
}
export function readConvexOAuthVerifierId(): string | null {
  if (typeof window === 'undefined') return null

  return window.localStorage.getItem(convexAuthStorageKey(OAUTH_VERIFIER_KEY))
}
export function writeConvexOAuthVerifierId(verifierId: string): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    convexAuthStorageKey(OAUTH_VERIFIER_KEY),
    verifierId
  )
}
export function clearConvexOAuthVerifierId(): void {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(convexAuthStorageKey(OAUTH_VERIFIER_KEY))
}
export function readPendingOAuthRedirectTo(): string | null {
  if (typeof window === 'undefined') return null

  return window.sessionStorage.getItem(PENDING_OAUTH_REDIRECT_KEY)
}
export function writePendingOAuthRedirectTo(redirectTo: string): void {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(PENDING_OAUTH_REDIRECT_KEY, redirectTo)
}
export function clearPendingOAuthRedirectTo(): void {
  if (typeof window === 'undefined') return

  window.sessionStorage.removeItem(PENDING_OAUTH_REDIRECT_KEY)
}
export function clearStoredConvexAuthTokens(): void {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(convexAuthStorageKey(CONVEX_AUTH_JWT_KEY))
  window.localStorage.removeItem(
    convexAuthStorageKey(REFRESH_TOKEN_STORAGE_KEY)
  )
  clearConvexOAuthVerifierId()
  clearPendingOAuthRedirectTo()
}
export function hasConvexAuthToken(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.localStorage.getItem(convexAuthStorageKey(CONVEX_AUTH_JWT_KEY)) !==
    null
  )
}
function convexAuthStorageKey(key: string): string {
  return `${key}_${convexAuthStorageNamespace()}`
}
