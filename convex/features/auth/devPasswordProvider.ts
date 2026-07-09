import Google from '@auth/core/providers/google'
import { Password } from '@convex-dev/auth/providers/Password'

import { normalizeInviteEmail } from '../invitations/policy'

import { isLocalDevDeployment } from './devOnly'

const devPassword = Password({
  profile(params) {
    assertDevPasswordAllowed()

    const email = normalizeInviteEmail(String(params.email ?? ''))
    const at = email.indexOf('@')

    if (at <= 0 || at === email.length - 1) {
      throw new Error('Enter a valid email address.')
    }

    return {
      email,
      name: email.slice(0, at),
    }
  },
  validatePasswordRequirements(password) {
    assertDevPasswordAllowed()

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters.')
    }
  },
})
export function authProvidersForDeployment() {
  if (isLocalDevDeployment()) {
    return [Google, devPassword]
  }

  return [Google]
}
function assertDevPasswordAllowed(): void {
  if (!isLocalDevDeployment()) {
    throw new Error('Password auth is only available in local development.')
  }
}
