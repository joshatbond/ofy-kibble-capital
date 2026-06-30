import { useConvexAuth } from '@convex-dev/auth/react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { Case, SwitchOn } from '~/components/switch-on'
import { api } from '~/convex/_generated/api'
import { studentAppHomePath } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

export function AuthGate(props: { app: StudentApp; landingPath: string }) {
  if (!import.meta.env.VITE_CONVEX_URL) return <Outlet />

  return <AuthGateWithConvex {...props} />
}

function AuthGateWithConvex(props: { app: StudentApp; landingPath: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const viewer = useQuery(api.features.users.viewer)
  const applyStudentApp = useMutation(
    api.features.auth.studentAuth.applyOAuthStudentApp
  )
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: state => state.location.pathname,
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

    if (isLanding && isAuthenticated) {
      void navigate({ to: homePath, replace: true })
      return
    }

    if (!isLanding && !isAuthenticated) {
      void navigate({ to: props.landingPath, replace: true })
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
    props.landingPath,
  ])

  const isRedirecting = !isAuthenticated && !authPending
  const loaderLabel = isRedirecting
    ? 'Redirecting…'
    : authPending
      ? 'Loading your dashboard…'
      : 'Checking your session…'
  const loaderReady =
    !isRedirecting && phase === 'completing' && isAuthed && intentApplied

  return (
    <SwitchOn>
      <Case predicate={isLanding && (authPending || isAuthenticated)}>
        <KibbleLoadingScreen
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
        <Outlet />
      </Case>

      <Case>
        <KibbleLoadingScreen
          label={loaderLabel}
          isReady={loaderReady}
          onComplete={() => phaseAssign('ready')}
          fullScreen
        />
      </Case>
    </SwitchOn>
  )
}
