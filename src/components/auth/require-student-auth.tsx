import { useConvexAuth } from '@convex-dev/auth/react'
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { useCurrentStudentApp } from '~/hooks/use-current-student-app'
import {
  protectedRouteReturnTo,
  studentAppLandingPath,
} from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

export function RequireStudentAuth(props: {
  app: StudentApp
  children: React.ReactNode
}) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { studentApp: sessionApp, isLoading: sessionAppLoading } =
    useCurrentStudentApp()
  const location = useLocation()
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const completingOAuth = isOAuthCallbackInProgress(search)
  const signInRedirectStarted = useRef(false)
  const wrongAppRedirectStarted = useRef(false)
  const unboundSessionRedirectStarted = useRef(false)
  const hasAppAccess = isAuthenticated && sessionApp === props.app

  useEffect(() => {
    if (isLoading || completingOAuth || isAuthenticated) {
      signInRedirectStarted.current = false
      return
    }

    const landingPath = studentAppLandingPath(props.app)

    if (location.pathname === landingPath) {
      return
    }

    if (signInRedirectStarted.current) {
      return
    }

    signInRedirectStarted.current = true

    void navigate({
      to: landingPath,
      search: {
        returnTo: protectedRouteReturnTo(props.app, location.pathname),
      },
      replace: true,
    })
  }, [
    completingOAuth,
    isAuthenticated,
    isLoading,
    location.pathname,
    navigate,
    props.app,
  ])

  useEffect(() => {
    if (isLoading || sessionAppLoading || completingOAuth || !isAuthenticated) {
      wrongAppRedirectStarted.current = false
      return
    }

    if (
      sessionApp === null ||
      sessionApp === undefined ||
      sessionApp === props.app
    ) {
      return
    }

    if (wrongAppRedirectStarted.current) {
      return
    }

    wrongAppRedirectStarted.current = true

    void navigate({
      to: studentAppLandingPath(sessionApp),
      replace: true,
    })
  }, [
    completingOAuth,
    isAuthenticated,
    isLoading,
    navigate,
    sessionApp,
    sessionAppLoading,
  ])

  useEffect(() => {
    if (isLoading || sessionAppLoading || completingOAuth || !isAuthenticated) {
      unboundSessionRedirectStarted.current = false
      return
    }

    if (sessionApp !== null) {
      return
    }

    if (unboundSessionRedirectStarted.current) {
      return
    }

    unboundSessionRedirectStarted.current = true

    void navigate({
      to: studentAppLandingPath(props.app),
      replace: true,
    })
  }, [
    completingOAuth,
    isAuthenticated,
    isLoading,
    navigate,
    props.app,
    sessionApp,
    sessionAppLoading,
  ])

  if (isLoading || completingOAuth || sessionAppLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-8 text-center text-sm font-medium">
        Checking your session…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-8 text-center text-sm font-medium">
        Redirecting to sign in…
      </div>
    )
  }

  if (!hasAppAccess) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-8 text-center text-sm font-medium">
        Redirecting…
      </div>
    )
  }

  return props.children
}

function isOAuthCallbackInProgress(search: Record<string, unknown>): boolean {
  return typeof search.code === 'string' && search.code.length > 0
}
