import { pathnameOfRedirect } from '~/lib/auth-redirect'

export const ADMIN_BASE_PATH = '/admin'

/** Public sign-in entry for teachers. */
export function adminLandingPath(): string {
  return `${ADMIN_BASE_PATH}/landing`
}

/** OAuth bridge before the protected admin home. */
export function adminLoadingPath(): string {
  return `${ADMIN_BASE_PATH}/loading`
}

/** Protected teacher admin home (trailing slash matches TanStack index routes). */
export function adminHomePath(): string {
  return `${ADMIN_BASE_PATH}/`
}

export function isAdminPath(pathname: string): boolean {
  return (
    pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`)
  )
}

function isAdminLandingPath(pathname: string): boolean {
  return pathname === adminLandingPath()
}

/** Where OAuth / sign-in should send teachers after auth completes. */
export function resolveTeacherPostAuthRedirect(returnTo?: string): string {
  if (returnTo === undefined || !isAdminPath(pathnameOfRedirect(returnTo))) {
    return adminHomePath()
  }

  const pathname = pathnameOfRedirect(returnTo)

  if (isAdminLandingPath(pathname)) {
    return adminHomePath()
  }

  if (pathname === ADMIN_BASE_PATH) {
    return adminHomePath()
  }

  return returnTo
}

/**
 * OAuth `redirectTo` — absolute URL of `/admin/loading?returnTo=<final>`.
 * Same bridge pattern as student surfaces (`~/lib/auth-redirect`).
 */
export function resolveTeacherSignInRedirect(returnTo?: string): string {
  const finalDest = resolveTeacherPostAuthRedirect(returnTo)
  const loadingPath = adminLoadingPath()
  const homePath = adminHomePath()

  const path =
    finalDest === homePath
      ? loadingPath
      : `${loadingPath}?returnTo=${encodeURIComponent(finalDest)}`

  if (typeof window === 'undefined') {
    return path
  }

  return new URL(path, window.location.origin).href
}

export function protectedAdminRouteReturnTo(pathname: string): string {
  return resolveTeacherPostAuthRedirect(pathname)
}

export type AdminLandingSearch = {
  returnTo?: string
  signedOut?: boolean
  /** Signed in but no teacher org membership — do not bounce to `/admin/`. */
  accessDenied?: boolean
}

export function parseAdminLandingSearch(
  search: Record<string, unknown>
): AdminLandingSearch {
  const result: AdminLandingSearch = {}

  const returnTo =
    typeof search.returnTo === 'string' ? search.returnTo : undefined

  if (returnTo !== undefined && isAdminPath(pathnameOfRedirect(returnTo))) {
    result.returnTo = resolveTeacherPostAuthRedirect(returnTo)
  }

  if (search.signedOut === true || search.signedOut === 'true') {
    result.signedOut = true
  }

  if (search.accessDenied === true || search.accessDenied === 'true') {
    result.accessDenied = true
  }

  return result
}

export type AdminLoadingSearch = {
  returnTo?: string
  code?: string
}

export function parseAdminLoadingSearch(
  search: Record<string, unknown>
): AdminLoadingSearch {
  const result: AdminLoadingSearch = {}

  const returnTo =
    typeof search.returnTo === 'string' ? search.returnTo : undefined

  if (returnTo !== undefined && isAdminPath(pathnameOfRedirect(returnTo))) {
    result.returnTo = resolveTeacherPostAuthRedirect(returnTo)
  }

  if (typeof search.code === 'string' && search.code.length > 0) {
    result.code = search.code
  }

  return result
}
