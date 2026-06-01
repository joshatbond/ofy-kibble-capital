const STUDENT_APP_BASE_PATH: Record<StudentApp, `/${string}`> = {
  kibble: '/kibble',
  pawket: '/pawket',
}
export function studentAppLandingPath(app: StudentApp): string {
  return `${STUDENT_APP_BASE_PATH[app]}/landing`
}
export function studentAppLoadingPath(app: StudentApp): string {
  return `${STUDENT_APP_BASE_PATH[app]}/loading`
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
  const finalDest = resolvePostAuthRedirect(app, returnTo)
  const loadingPath = studentAppLoadingPath(app)
  const homePath = studentAppHomePath(app)

  // If the final destination is just the app home, no `returnTo` is needed —
  // `/loading` defaults to the app home anyway.
  const path =
    finalDest === homePath
      ? loadingPath
      : `${loadingPath}?returnTo=${encodeURIComponent(finalDest)}`

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
export function parseStudentLoadingSearch(
  search: Record<string, unknown>
): StudentLoadingSearch {
  const result: StudentLoadingSearch = {}

  const returnTo =
    typeof search.returnTo === 'string' ? search.returnTo : undefined

  if (returnTo !== undefined && isAllowedStudentAppRedirect(returnTo)) {
    const app = studentAppFromPathname(pathnameOfRedirect(returnTo))

    if (app !== null) {
      result.returnTo = resolvePostAuthRedirect(app, returnTo)
    }
  }

  if (typeof search.code === 'string' && search.code.length > 0) {
    result.code = search.code
  }

  return result
}
export type StudentApp = 'kibble' | 'pawket'
export type StudentLandingSearch = {
  returnTo?: string
  /**
   * Set by the sign-out flow so the landing route's `beforeLoad` skips its
   * "you're authenticated, redirect to the dashboard" check for the brief
   * window between `navigate(landing)` and `signOut()` finishing.
   */
  signedOut?: boolean
}
export type StudentLoadingSearch = {
  /** Where to send the user once auth + session have resolved. */
  returnTo?: string
  /** OAuth code, present when arriving here from a provider callback. */
  code?: string
}
function isStudentAppLandingPath(pathname: string, app: StudentApp): boolean {
  return pathname === studentAppLandingPath(app)
}
