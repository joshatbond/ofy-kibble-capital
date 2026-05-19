import { useConvexAuth } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useRef, useState } from 'react'

import type { StudentApp } from '~/lib/auth-redirect'
import {
  clearConvexOAuthVerifierId,
  clearPendingOAuthRedirectTo,
  readConvexOAuthVerifierId,
  readPendingOAuthRedirectTo,
} from '~/lib/convex-auth-storage'

import { api } from '../../convex/_generated/api'

import type { Id } from '../../convex/_generated/dataModel'

export function useCurrentStudentApp(): {
  studentApp: StudentApp | null | undefined
  isLoading: boolean
  isResolvingApp: boolean
} {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const studentApp = useQuery(
    api.studentAuth.currentStudentApp,
    isAuthenticated ? {} : 'skip'
  )
  const applyOAuthStudentApp = useMutation(api.studentAuth.applyOAuthStudentApp)
  const [isResolvingApp, setIsResolvingApp] = useState(false)
  const applyStarted = useRef(false)

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      applyStarted.current = false
      setIsResolvingApp(false)
      return
    }

    if (studentApp !== null) {
      setIsResolvingApp(false)
      return
    }

    if (studentApp === undefined || applyStarted.current) {
      return
    }

    applyStarted.current = true
    setIsResolvingApp(true)

    const verifierId = readConvexOAuthVerifierId()
    const fallbackRedirectTo = readPendingOAuthRedirectTo()
    const fallbackPathname =
      typeof window !== 'undefined' ? window.location.pathname : undefined

    void applyOAuthStudentApp({
      verifierId:
        verifierId !== null ? (verifierId as Id<'authVerifiers'>) : undefined,
      fallbackRedirectTo: fallbackRedirectTo ?? undefined,
      fallbackPathname,
    }).finally(() => {
      clearConvexOAuthVerifierId()
      clearPendingOAuthRedirectTo()
      setIsResolvingApp(false)
    })
  }, [applyOAuthStudentApp, authLoading, isAuthenticated, studentApp])

  const queryLoading = isAuthenticated && studentApp === undefined

  return {
    studentApp,
    isResolvingApp,
    isLoading: authLoading || queryLoading || isResolvingApp,
  }
}
