/**
 * Client post-OAuth redirect helpers. Paths must stay aligned with
 * `convex/features/auth/redirect.ts` allowlist.
 */

const STUDENT_APP_BASE_PATH: Record<StudentApp, `/${string}`> = {
  kibble: '/kibble',
  pawket: '/pawket',
}
const ALLOWED_APP_BASE_PATHS = [
  '/kibble',
  '/pawket',
  '/admin',
  '/invite',
] as const
export function studentAppLandingPath(app: StudentApp): string {
  return `${STUDENT_APP_BASE_PATH[app]}/landing`
}
export function studentAppHomePath(app: StudentApp): string {
  return `${STUDENT_APP_BASE_PATH[app]}/`
}
export function pathnameOfRedirect(redirectTo: string): string {
  return redirectTo.startsWith('http')
    ? new URL(redirectTo).pathname
    : (redirectTo.split('?')[0] ?? redirectTo)
}
export function studentAppFromPathname(pathname: string): StudentApp | null {
  if (pathname === '/pawket' || pathname.startsWith('/pawket/')) {
    return 'pawket'
  }

  if (pathname === '/kibble' || pathname.startsWith('/kibble/')) {
    return 'kibble'
  }

  return null
}
export function isAllowedStudentAppRedirect(redirectTo: string): boolean {
  const path = pathnameOfRedirect(redirectTo)

  return studentAppFromPathname(path) !== null
}
export function isAllowedAppPath(pathname: string): boolean {
  return ALLOWED_APP_BASE_PATHS.some(
    base => pathname === base || pathname.startsWith(`${base}/`)
  )
}
export function resolvePostAuthRedirect(
  app: StudentApp,
  returnTo?: string
): string {
  if (returnTo === undefined || !isAllowedStudentAppRedirect(returnTo)) {
    return studentAppHomePath(app)
  }

  const pathname = pathnameOfRedirect(returnTo)

  if (isStudentAppLandingPath(pathname, app)) {
    return studentAppHomePath(app)
  }

  if (pathname === STUDENT_APP_BASE_PATH[app]) {
    return studentAppHomePath(app)
  }

  return returnTo
}
export function resolveStudentSignInRedirect(
  app: StudentApp,
  returnTo?: string
): string {
  const path = resolvePostAuthRedirect(app, returnTo)

  if (typeof window === 'undefined') {
    return path
  }

  return new URL(path, window.location.origin).href
}
export function protectedRouteReturnTo(
  app: StudentApp,
  pathname: string
): string {
  return resolvePostAuthRedirect(app, pathname)
}
export function parseStudentLandingSearch(
  search: Record<string, unknown>
): StudentLandingSearch {
  const result: StudentLandingSearch = {}

  const returnTo =
    typeof search.returnTo === 'string' ? search.returnTo : undefined

  if (returnTo !== undefined && isAllowedStudentAppRedirect(returnTo)) {
    const app = studentAppFromPathname(pathnameOfRedirect(returnTo))

    if (app !== null) {
      result.returnTo = resolvePostAuthRedirect(app, returnTo)
    }
  }

  if (search.signedOut === true || search.signedOut === 'true') {
    result.signedOut = true
  }

  return result
}
export function studentAppRedirectTo(app: StudentApp): string {
  return resolveStudentSignInRedirect(app)
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
export type { StudentApp, StudentLandingSearch }
function isStudentAppLandingPath(pathname: string, app: StudentApp): boolean {
  return pathname === studentAppLandingPath(app)
}
type StudentApp = 'kibble' | 'pawket'
type StudentLandingSearch = {
  returnTo?: string
  /**
   * Set by the sign-out flow so the landing route skips its
   * "you're authenticated, redirect to the dashboard" check for the brief
   * window between `navigate(landing)` and `signOut()` finishing.
   */
  signedOut?: boolean
}
