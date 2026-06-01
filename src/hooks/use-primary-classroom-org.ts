import { useConvexAuth } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'

import { isTeacherMemberRole } from '~/lib/teacher-member-role'

import { api } from '../../convex/_generated/api'

/**
 * v1: first teacher-capable organization (single-classroom operator model).
 */
export function usePrimaryClassroomOrg(): {
  organizationId: string | undefined
  organizationName: string | undefined
  isLoading: boolean
} {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const orgs = useQuery(
    api.features.tenants.listOrganizations,
    isAuthenticated ? {} : 'skip'
  )

  const teacherOrg = orgs?.find(org => isTeacherMemberRole(org.role))

  return {
    organizationId: teacherOrg?._id,
    organizationName: teacherOrg?.name,
    isLoading: authLoading || (isAuthenticated && orgs === undefined),
  }
}
