import { useConvexAuth } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { useCurrentStudentApp } from '~/hooks/use-current-student-app'
import { studentAppHomePath } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

export function RedirectAuthenticatedFromLanding(props: {
  app: StudentApp
  children: React.ReactNode
}) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { studentApp: sessionApp, isLoading: sessionAppLoading } =
    useCurrentStudentApp()
  const navigate = useNavigate()
  const redirectStarted = useRef(false)
  const shouldOpenApp = isAuthenticated && sessionApp === props.app

  useEffect(() => {
    if (isLoading || sessionAppLoading || !shouldOpenApp) {
      redirectStarted.current = false
      return
    }

    if (redirectStarted.current) {
      return
    }

    redirectStarted.current = true

    void navigate({
      to: studentAppHomePath(props.app),
      replace: true,
    })
  }, [isLoading, navigate, props.app, sessionAppLoading, shouldOpenApp])

  if (isLoading || sessionAppLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-8 text-center text-sm font-medium">
        Checking your session…
      </div>
    )
  }

  if (shouldOpenApp) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center p-8 text-center text-sm font-medium">
        Opening your dashboard…
      </div>
    )
  }

  return props.children
}
