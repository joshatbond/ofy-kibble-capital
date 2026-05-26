import { useConvexAuth } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'

import { isTeacherMemberRole } from '~/lib/teacher-member-role'

import { api } from '../../convex/_generated/api'

/**
 * Whether the signed-in user has a teacher-capable role in any classroom org.
 *
 * - `hasTeacherAccess` — `true`/`false` once orgs are loaded; `undefined` while
 *   auth or the org list query is still resolving.
 */
export function useTeacherAccess(): {
  hasTeacherAccess: boolean | undefined
  isLoading: boolean
} {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const orgs = useQuery(
    api.tenants.listOrganizations,
    isAuthenticated ? {} : 'skip'
  )

  const orgsLoading = isAuthenticated && orgs === undefined

  const hasTeacherAccess =
    orgs === undefined
      ? undefined
      : orgs.some(org => isTeacherMemberRole(org.role))

  return {
    hasTeacherAccess,
    isLoading: authLoading || orgsLoading,
  }
}
