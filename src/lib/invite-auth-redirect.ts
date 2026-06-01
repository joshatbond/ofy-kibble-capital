import { pathnameOfRedirect } from '~/lib/auth-redirect'

export function invitePath(invitationId: string): string {
  return `/invite/${encodeURIComponent(invitationId)}`
}
export function inviteLoadingPath(invitationId: string): string {
  return `${invitePath(invitationId)}/loading`
}
export function isInvitePath(pathname: string): boolean {
  return pathname === '/invite' || pathname.startsWith('/invite/')
}
export function resolveInviteSignInRedirect(invitationId: string): string {
  const loadingPath = inviteLoadingPath(invitationId)

  if (typeof window === 'undefined') {
    return loadingPath
  }

  return new URL(loadingPath, window.location.origin).href
}
export function parseInviteLoadingSearch(
  search: Record<string, unknown>
): InviteLoadingSearch {
  const result: InviteLoadingSearch = {}

  if (typeof search.code === 'string' && search.code.length > 0) {
    result.code = search.code
  }

  return result
}
export function resolveInvitePostAcceptRedirect(serverPath: string): string {
  if (!serverPath.startsWith('/')) {
    return '/kibble/'
  }

  return serverPath
}
export function normalizeInviteReturnPath(
  invitationId: string,
  returnTo?: string
): string {
  if (returnTo === undefined) {
    return inviteLoadingPath(invitationId)
  }

  const pathname = pathnameOfRedirect(returnTo)

  if (isInviteLandingPath(pathname, invitationId)) {
    return inviteLoadingPath(invitationId)
  }

  return returnTo
}
export type InviteLoadingSearch = {
  code?: string
}
function isInviteLandingPath(pathname: string, invitationId: string): boolean {
  return pathname === invitePath(invitationId)
}
