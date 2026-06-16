import { useConvexAuth } from '@convex-dev/auth/react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'

import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { studentAppHomePath } from '~/lib/auth-redirect'
import type { StudentApp } from '~/lib/auth-redirect'

import { api } from '../../../convex/_generated/api'

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

  const isLanding = pathname === props.landingPath
  const authPending = isLoading || viewer === undefined
  const isAuthed = isAuthenticated && viewer !== null

  useEffect(() => {
    if (isLanding) return
    if (authPending) {
      phaseAssign('checking')
      return
    }
    if (!isAuthed) {
      void navigate({ to: props.landingPath, replace: true })
      return
    }
    if (intentApplied) {
      phaseAssign('completing')
      return
    }

    void applyStudentApp({
      fallbackPathname: studentAppHomePath(props.app),
    }).then(() => {
      intentAppliedAssign(true)
      phaseAssign('completing')
    })
  }, [
    applyStudentApp,
    authPending,
    intentApplied,
    isAuthed,
    isLanding,
    navigate,
    props.app,
    props.landingPath,
  ])

  if (isLanding || phase === 'ready') return <Outlet />

  const isRedirecting = !isAuthed && !authPending
  const loaderLabel = isRedirecting
    ? 'Redirecting…'
    : authPending
      ? 'Loading your dashboard…'
      : 'Checking your session…'
  const loaderReady =
    !isRedirecting && phase === 'completing' && isAuthed && intentApplied

  return (
    <KibbleLoadingScreen
      label={loaderLabel}
      isReady={loaderReady}
      onComplete={() => phaseAssign('ready')}
      fullScreen
    />
  )
}
