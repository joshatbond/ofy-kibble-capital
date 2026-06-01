/** Invitation links expire after 14 calendar days (CONTEXT.md — **Invitation**). */
export const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000

export const OFY_EMAIL_DOMAIN = '@ofy.org'

export function invitationExpiresAt(nowMs: number = Date.now()): number {
  return nowMs + INVITATION_TTL_MS
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase()
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
