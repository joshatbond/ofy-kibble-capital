/** Post-OAuth paths allowed for student surfaces (must match client `~/lib/auth-redirect`). */
const STUDENT_APP_BASE_PATHS = ['/kibble', '/pawket'] as const

const LANDING_SUFFIX = '/landing'

function normalizeStudentAppPathname(pathname: string): string {
  if (pathname === '/kibble' || pathname === '/pawket') {
    return `${pathname}/`
  }

  if (pathname.endsWith(LANDING_SUFFIX)) {
    const base = pathname.slice(0, -LANDING_SUFFIX.length)
    if (base === '/kibble' || base === '/pawket') {
      return `${base}/`
    }
  }

  return pathname
}

function resolveStudentAppPath(redirectTo: string | undefined | null): string {
  const safe = redirectTo ?? '/kibble/'

  const path = safe.startsWith('http')
    ? new URL(safe).pathname
    : (safe.split('?')[0] ?? safe)

  const allowed = STUDENT_APP_BASE_PATHS.some(
    base => path === base || path.startsWith(`${base}/`)
  )

  if (!allowed) {
    return '/kibble/'
  }

  const normalized = normalizeStudentAppPathname(path)

  if (safe.startsWith('http')) {
    const url = new URL(safe)
    return `${normalized}${url.search}`
  }

  const query = safe.includes('?') ? safe.slice(safe.indexOf('?')) : ''
  return `${normalized}${query}`
}

/**
 * Convex Auth `callbacks.redirect` must return an absolute URL (see
 * `setURLSearchParam` in @convex-dev/auth). Relative paths crash OAuth callback.
 */
export function resolveStudentAppRedirect(
  redirectTo: string | undefined | null
): string {
  const path = resolveStudentAppPath(redirectTo)
  const baseUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '')

  if (!baseUrl) {
    throw new Error('SITE_URL is not configured on the Convex deployment')
  }

  return `${baseUrl}${path}`
}
