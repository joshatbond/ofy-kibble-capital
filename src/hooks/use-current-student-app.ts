import { useConvexAuth } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'

import type { StudentApp } from '~/lib/auth-redirect'

import { api } from '../../convex/_generated/api'

/**
 * Reactive read of the student app bound to the current Convex Auth session.
 *
 * Returns:
 * - `studentApp` — `'kibble'`/`'pawket'` once the session is bound,
 *   `null` if signed in but not yet bound, `undefined` while the auth or
 *   session-app query is still resolving.
 * - `isLoading` — `true` while auth or the initial session-app query is in
 *   flight. Does **not** stay `true` across the bind-in-flight window; gate
 *   on `studentApp === 'kibble' | 'pawket'` if you need to wait for a bound
 *   app.
 */
export function useCurrentStudentApp(): {
  studentApp: StudentApp | null | undefined
  isLoading: boolean
} {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const studentApp = useQuery(
    api.studentAuth.currentStudentApp,
    isAuthenticated ? {} : 'skip'
  )

  const queryLoading = isAuthenticated && studentApp === undefined

  return {
    studentApp,
    isLoading: authLoading || queryLoading,
  }
}
