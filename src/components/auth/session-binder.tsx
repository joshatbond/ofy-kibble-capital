import { useConvexAuth } from '@convex-dev/auth/react'
import { useMutation } from 'convex/react'
import { useEffect, useRef } from 'react'

import {
  clearConvexOAuthVerifierId,
  clearPendingOAuthRedirectTo,
  readConvexOAuthVerifierId,
  readPendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

import { api } from '../../../convex/_generated/api'

import type { Id } from '../../../convex/_generated/dataModel'

type ApplyOAuthStudentApp = ReturnType<
  typeof useMutation<typeof api.studentAuth.applyOAuthStudentApp>
>

/**
 * On the rising edge of `isAuthenticated` (sign-in), runs
 * `applyOAuthStudentApp` once to bind the current Convex Auth session to a
 * student app.
 *
 * Renders nothing. Mount inside `ConvexAuthProvider`.
 */
export function SessionBinder() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const applyOAuthStudentApp = useMutation(api.studentAuth.applyOAuthStudentApp)
  const previouslyAuthenticated = useRef(false)

  useEffect(() => {
    if (isLoading) return

    const wasAuthenticated = previouslyAuthenticated.current
    previouslyAuthenticated.current = isAuthenticated

    if (wasAuthenticated || !isAuthenticated) return

    void bindSessionStudentApp(applyOAuthStudentApp)
  }, [applyOAuthStudentApp, isAuthenticated, isLoading])

  return null
}

async function bindSessionStudentApp(
  applyOAuthStudentApp: ApplyOAuthStudentApp
): Promise<void> {
  const verifierId = readConvexOAuthVerifierId()
  const fallbackRedirectTo = readPendingOAuthRedirectTo()
  const fallbackPathname =
    typeof window !== 'undefined' ? window.location.pathname : undefined

  try {
    await applyOAuthStudentApp({
      verifierId:
        verifierId !== null ? (verifierId as Id<'authVerifiers'>) : undefined,
      fallbackRedirectTo: fallbackRedirectTo ?? undefined,
      fallbackPathname,
    })
  } catch (error) {
    // Swallow: failed bind leaves the session unbound, surfaced as
    // `currentStudentApp === null` to consumers.
    console.error('Failed to bind session student app after sign-in', error)
  } finally {
    clearConvexOAuthVerifierId()
    clearPendingOAuthRedirectTo()
  }
}
