/**
 * Client post-OAuth redirect helpers. Paths must stay aligned with
 * `convex/features/auth/redirect.ts` allowlist.
 */

const ALLOWED_APP_BASE_PATHS = [
  '/kibble',
  '/pawket',
  '/admin',
  '/invite',
] as const
export function studentAppHomePath(app: StudentApp): string {
  return `/${app}/`
}
export function studentAppLandingPath(app: StudentApp): string {
  return `/${app}/landing`
}
export function studentAppRedirectTo(app: StudentApp): string {
  const path = studentAppHomePath(app)

  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}
export function isAllowedAppPath(pathname: string): boolean {
  return ALLOWED_APP_BASE_PATHS.some(
    base => pathname === base || pathname.startsWith(`${base}/`)
  )
}
export function adminAppHomePath(): string {
  return '/admin'
}
export function adminAppLandingPath(): string {
  return '/admin/landing'
}
export function adminAppRedirectTo(): string {
  const path = adminAppHomePath()

  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}
export function invitePath(invitationId: string): string {
  return `/invite/${invitationId}`
}
export function inviteRedirectTo(invitationId: string): string {
  const path = invitePath(invitationId)

  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}
export type StudentApp = 'kibble' | 'pawket'
