import { useConvexAuth } from '@convex-dev/auth/react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { StudentSessionLoading } from '~/components/auth/student-session-loading'
import { useCurrentStudentApp } from '~/hooks/use-current-student-app'
import { useTeacherAccess } from '~/hooks/use-teacher-access'
import {
  adminLandingPath,
  protectedAdminRouteReturnTo,
} from '~/lib/admin-auth-redirect'
import { studentAppHomePath, studentAppLandingPath } from '~/lib/auth-redirect'
import { clearStoredConvexAuthTokens } from '~/lib/convex-auth-storage'

/**
 * Runtime guard for protected **Teacher admin** routes.
 *
 * Redirects signed-out users to the admin landing, students to their student
 * app, and unauthenticated teachers-without-org to the admin landing.
 */
export function RequireTeacherAuth(props: { children: React.ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { hasTeacherAccess, isLoading: teacherAccessLoading } =
    useTeacherAccess()
  const { studentApp, isLoading: studentAppLoading } = useCurrentStudentApp()
  const location = useLocation()
  const navigate = useNavigate()

  const accessStillLoading =
    authLoading || teacherAccessLoading || studentAppLoading

  const signedOutMidSession = !accessStillLoading && !isAuthenticated

  const studentOnly =
    !accessStillLoading && isAuthenticated && hasTeacherAccess === false

  useEffect(() => {
    if (signedOutMidSession) {
      clearStoredConvexAuthTokens()
      void navigate({
        to: adminLandingPath(),
        search: {
          returnTo: protectedAdminRouteReturnTo(location.pathname),
          signedOut: true,
        },
        replace: true,
      })
      return
    }

    if (!studentOnly) return

    const dest =
      studentApp === 'kibble' || studentApp === 'pawket'
        ? studentAppHomePath(studentApp)
        : studentAppLandingPath('kibble')

    void navigate({ to: dest, replace: true })
  }, [
    location.pathname,
    navigate,
    signedOutMidSession,
    studentOnly,
    studentApp,
  ])

  if (accessStillLoading || signedOutMidSession || studentOnly) {
    return <StudentSessionLoading app="kibble" label="Checking your access…" />
  }

  return props.children
}
