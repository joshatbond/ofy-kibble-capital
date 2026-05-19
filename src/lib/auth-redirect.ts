export type StudentApp = 'kibble' | 'pawket'

const STUDENT_APP_BASE_PATH: Record<StudentApp, `/${string}`> = {
  kibble: '/kibble',
  pawket: '/pawket',
}

/** Public marketing landing for a student surface. */
export function studentAppLandingPath(app: StudentApp): string {
  return `${STUDENT_APP_BASE_PATH[app]}/landing`
}

/** Protected app home — trailing slash matches TanStack index routes (`/pawket/`). */
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

function isStudentAppLandingPath(pathname: string, app: StudentApp): boolean {
  return pathname === studentAppLandingPath(app)
}

/** Where OAuth / sign-in should send the user after auth completes. */
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

/**
 * OAuth `redirectTo` — absolute URL on the current site so Convex Auth returns
 * here after Google sign-in (not to `SITE_URL` on the deployment alone).
 */
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

/** `returnTo` stored when bouncing unauthenticated users to a landing page. */
export function protectedRouteReturnTo(
  app: StudentApp,
  pathname: string
): string {
  return resolvePostAuthRedirect(app, pathname)
}

export type StudentLandingSearch = {
  returnTo?: string
}

export function parseStudentLandingSearch(
  search: Record<string, unknown>
): StudentLandingSearch {
  const returnTo =
    typeof search.returnTo === 'string' ? search.returnTo : undefined

  if (returnTo === undefined || !isAllowedStudentAppRedirect(returnTo)) {
    return {}
  }

  const app = studentAppFromPathname(pathnameOfRedirect(returnTo))

  if (app === null) {
    return {}
  }

  return { returnTo: resolvePostAuthRedirect(app, returnTo) }
}
