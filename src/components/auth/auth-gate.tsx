import { useConvexAuth } from '@convex-dev/auth/react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { PawketLoadingScreen } from '~/components/loading/pawket-loader'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { protectedRouteReturnTo, studentAppHomePath } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

import type { ReactNode } from 'react'

export function AuthGate(props: {
  app: StudentApp
  landingPath: string
  authenticatedShell?: (children: ReactNode) => ReactNode
}) {
  if (!import.meta.env.VITE_CONVEX_URL) return <Outlet />

  return <AuthGateWithConvex {...props} />
}

function AuthGateWithConvex(props: {
  app: StudentApp
  landingPath: string
  authenticatedShell?: (children: ReactNode) => ReactNode
}) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const viewer = useQuery(api.features.users.viewer)
  const applyStudentApp = useMutation(
    api.features.auth.studentAuth.applyOAuthStudentApp
  )
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })
  const signedOut = useRouterState({
    select: state => {
      const value = state.location.search.signedOut

      return value === true || (typeof value === 'string' && value === 'true')
    },
  })
  const [phase, phaseAssign] = useState<'checking' | 'completing' | 'ready'>(
    'checking'
  )
  const [intentApplied, intentAppliedAssign] = useState(false)

  const homePath = studentAppHomePath(props.app)
  const isLanding = pathname === props.landingPath
  const authPending = isLoading || viewer === undefined
  const isAuthed = isAuthenticated && viewer !== null

  useEffect(() => {
    if (authPending) {
      phaseAssign('checking')
      return
    }

    if (isLanding) {
      if (isAuthenticated && !signedOut) {
        void navigate({ to: homePath, replace: true })
      }

      return
    }

    if (!isAuthenticated) {
      void navigate({
        to: props.landingPath,
        search: {
          returnTo: protectedRouteReturnTo(props.app, pathname),
        },
        replace: true,
      })
      return
    }

    if (intentApplied) {
      phaseAssign('completing')
      return
    }

    void applyStudentApp({
      fallbackPathname: homePath,
    }).then(() => {
      intentAppliedAssign(true)
      phaseAssign('completing')
    })
  }, [
    applyStudentApp,
    authPending,
    homePath,
    intentApplied,
    isAuthenticated,
    isLanding,
    navigate,
    pathname,
    props.app,
    props.landingPath,
    signedOut,
  ])

  const isRedirecting = !isAuthenticated && !authPending
  const loaderLabel = isRedirecting
    ? 'Redirecting…'
    : authPending
      ? 'Loading your dashboard…'
      : 'Checking your session…'
  const loaderReady =
    !isRedirecting && phase === 'completing' && isAuthed && intentApplied

  const LoadingScreen =
    props.app === 'pawket' ? PawketLoadingScreen : KibbleLoadingScreen

  return (
    <SwitchOn>
      <Case
        predicate={
          isLanding && (authPending || (isAuthenticated && !signedOut))
        }
      >
        <LoadingScreen
          label={isAuthenticated ? 'Redirecting…' : 'Loading…'}
          isReady={false}
          onComplete={() => {}}
          fullScreen
        />
      </Case>

      <Case predicate={isLanding}>
        <Outlet />
      </Case>

      <Case predicate={phase === 'ready'}>
        {props.authenticatedShell ? (
          props.authenticatedShell(<Outlet />)
        ) : (
          <Outlet />
        )}
      </Case>

      <Case>
        <LoadingScreen
          label={loaderLabel}
          isReady={loaderReady}
          onComplete={() => phaseAssign('ready')}
          fullScreen
        />
      </Case>
    </SwitchOn>
  )
}
