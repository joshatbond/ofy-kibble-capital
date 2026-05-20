import { v } from 'convex/values'

export const studentAppValidator = v.union(
  v.literal('kibble'),
  v.literal('pawket')
)

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

export function studentAppFromRedirectTo(
  redirectTo: string
): StudentApp | null {
  return studentAppFromPathname(pathnameOfRedirect(redirectTo))
}

export type StudentApp = 'kibble' | 'pawket'
