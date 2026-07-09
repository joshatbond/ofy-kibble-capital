import { isLocalDevDeployment } from '../auth/devOnly'

export const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000
export const OFY_EMAIL_DOMAIN = '@ofy.org'
export function invitationExpiresAt(nowMs: number = Date.now()): number {
  return nowMs + INVITATION_TTL_MS
}
export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase()
}
export function isDevInvitePolicyRelaxed(): boolean {
  return isLocalDevDeployment()
}
export function isOfyOrgEmail(email: string): boolean {
  const normalized = normalizeInviteEmail(email)
  return (
    normalized.endsWith(OFY_EMAIL_DOMAIN) &&
    normalized.length > OFY_EMAIL_DOMAIN.length
  )
}
export function assertOfyOrgEmail(email: string): string {
  const normalized = normalizeInviteEmail(email)

  if (isDevInvitePolicyRelaxed()) {
    assertValidEmailFormat(normalized)
    return normalized
  }

  if (!isOfyOrgEmail(normalized)) {
    throw new Error(
      `Invitations require a school Google account (${OFY_EMAIL_DOMAIN}).`
    )
  }

  return normalized
}
export function emailsMatch(inviteeEmail: string, userEmail: string): boolean {
  return normalizeInviteEmail(inviteeEmail) === normalizeInviteEmail(userEmail)
}
function assertValidEmailFormat(email: string): void {
  const at = email.indexOf('@')
  if (at <= 0 || at === email.length - 1) {
    throw new Error('Enter a valid email address.')
  }
}
