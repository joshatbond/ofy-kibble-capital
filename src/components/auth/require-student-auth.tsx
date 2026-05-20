import { useConvexAuth } from '@convex-dev/auth/react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { StudentSessionLoading } from '~/components/auth/student-session-loading'
import { useCurrentStudentApp } from '~/hooks/use-current-student-app'
import {
  protectedRouteReturnTo,
  studentAppLandingPath,
} from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

/**
 * Thin runtime guard for protected app pages.
 *
 * The route's `beforeLoad` already gated entry on a stored auth token, so on
 * mount we can assume the user is authenticated for *some* app. This guard
 * only handles two runtime conditions:
 *
 * 1. Session was bound to a different app — redirect to that app's landing.
 * 2. Token disappeared mid-session (refresh failed, sign-out from another tab,
 *    server invalidation) — redirect to this app's landing.
 *
 * While either redirect is in flight, render the branded session loader.
 */
export function RequireStudentAuth(props: {
  app: StudentApp
  children: React.ReactNode
}) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { studentApp: sessionApp, isLoading: sessionAppLoading } =
    useCurrentStudentApp()
  const location = useLocation()
  const navigate = useNavigate()

  const sessionStillLoading = authLoading || sessionAppLoading

  const signedOutMidSession = !sessionStillLoading && !isAuthenticated

  const wrongAppRedirectTarget: StudentApp | null =
    !sessionStillLoading &&
    isAuthenticated &&
    sessionApp !== null &&
    sessionApp !== undefined &&
    sessionApp !== props.app
      ? sessionApp
      : null

  useEffect(() => {
    if (signedOutMidSession) {
      void navigate({
        to: studentAppLandingPath(props.app),
        search: {
          returnTo: protectedRouteReturnTo(props.app, location.pathname),
        },
        replace: true,
      })
      return
    }

    if (wrongAppRedirectTarget !== null) {
      void navigate({
        to: studentAppLandingPath(wrongAppRedirectTarget),
        replace: true,
      })
    }
  }, [
    location.pathname,
    navigate,
    props.app,
    signedOutMidSession,
    wrongAppRedirectTarget,
  ])

  if (
    sessionStillLoading ||
    signedOutMidSession ||
    wrongAppRedirectTarget !== null
  ) {
    return (
      <StudentSessionLoading app={props.app} label="Checking your session…" />
    )
  }

  return props.children
}
