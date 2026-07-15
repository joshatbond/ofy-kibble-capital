import {
  adminAppHomePath,
  adminAppLandingPath,
  pathnameOfRedirect,
} from '~/lib/auth-redirect'

export const ADMIN_BASE_PATH = '/admin'
export function isAdminPath(pathname: string): boolean {
  return (
    pathname === ADMIN_BASE_PATH || pathname.startsWith(`${ADMIN_BASE_PATH}/`)
  )
}
export function resolveTeacherPostAuthRedirect(returnTo?: string): string {
  if (returnTo === undefined || !isAdminPath(pathnameOfRedirect(returnTo))) {
    return adminAppHomePath()
  }

  const pathname = pathnameOfRedirect(returnTo)

  if (pathname === adminAppLandingPath()) {
    return adminAppHomePath()
  }

  if (pathname === ADMIN_BASE_PATH) {
    return adminAppHomePath()
  }

  return returnTo
}
export function resolveTeacherSignInRedirect(returnTo?: string): string {
  const path = resolveTeacherPostAuthRedirect(returnTo)

  if (typeof window === 'undefined') {
    return path
  }

  return new URL(path, window.location.origin).href
}
export function protectedAdminRouteReturnTo(pathname: string): string {
  return resolveTeacherPostAuthRedirect(pathname)
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
export type AdminLandingSearch = {
  returnTo?: string
  signedOut?: boolean
  /** Signed in but no teacher org membership — do not bounce to `/admin/`. */
  accessDenied?: boolean
}
