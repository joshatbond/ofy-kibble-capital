import { useConvexAuth } from '@convex-dev/auth/react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PawketLoadingScreen } from '~/components/loading/pawket-loader'
import { useCurrentStudentApp } from '~/hooks/use-current-student-app'
import {
  parseStudentLoadingSearch,
  studentAppHomePath,
  studentAppLandingPath,
} from '~/lib/auth-redirect'
import {
  hasConvexAuthToken,
  readPendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

export const Route = createFileRoute('/pawket/loading')({
  validateSearch: parseStudentLoadingSearch,
  beforeLoad: ({ search }) => {
    // See the matching comment in src/routes/kibble/loading.tsx — the
    // sessionStorage check is what prevents TanStack's beforeLoad from
    // bouncing the user to landing during the brief window where Convex
    // Auth's `replaceURL` has stripped `?code` but `signIn(code)` hasn't
    // yet stored the token.
    if (hasConvexAuthToken()) return
    if (search.code !== undefined) return
    if (readPendingOAuthRedirectTo() !== null) return

    throw redirect({
      to: studentAppLandingPath('pawket'),
      replace: true,
    })
  },
  head: () => ({
    meta: [{ title: 'PawKet Exchange' }],
  }),
  component: PawketLoadingRoute,
})

function PawketLoadingRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { studentApp, isLoading: sessionLoading } = useCurrentStudentApp()

  const dest = search.returnTo ?? studentAppHomePath('pawket')

  const sessionResolved = !authLoading && !sessionLoading

  useEffect(() => {
    if (!sessionResolved) return
    if (!isAuthenticated) return
    if (studentApp === null || studentApp === undefined) return
    if (studentApp === 'pawket') return

    void navigate({
      to: studentAppLandingPath(studentApp),
      replace: true,
    })
  }, [sessionResolved, isAuthenticated, studentApp, navigate])

  const ready = sessionResolved && isAuthenticated && studentApp === 'pawket'

  return (
    <PawketLoadingScreen
      label="Loading your account…"
      isReady={ready}
      onComplete={() => {
        void navigate({ to: dest, replace: true })
      }}
    />
  )
}
