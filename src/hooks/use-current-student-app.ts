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
} {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const studentApp = useQuery(
    api.studentAuth.currentStudentApp,
    isAuthenticated ? {} : 'skip'
  )
  const applyOAuthStudentApp = useMutation(api.studentAuth.applyOAuthStudentApp)
  const [optimisticApp, setOptimisticApp] = useState<StudentApp | null>(null)
  const applyStarted = useRef(false)
  const [applyFinished, setApplyFinished] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      applyStarted.current = false
      setApplyFinished(false)
      setOptimisticApp(null)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (studentApp !== null && studentApp !== undefined) {
      setOptimisticApp(null)
    }
  }, [studentApp])

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    if (studentApp !== null) {
      return
    }

    if (studentApp === undefined || applyStarted.current) {
      return
    }

    applyStarted.current = true
    setApplyFinished(false)

    const verifierId = readConvexOAuthVerifierId()
    const fallbackRedirectTo = readPendingOAuthRedirectTo()
    const fallbackPathname =
      typeof window !== 'undefined' ? window.location.pathname : undefined

    void applyOAuthStudentApp({
      verifierId:
        verifierId !== null ? (verifierId as Id<'authVerifiers'>) : undefined,
      fallbackRedirectTo: fallbackRedirectTo ?? undefined,
      fallbackPathname,
    })
      .then(app => {
        if (app !== null) {
          setOptimisticApp(app)
        }
      })
      .finally(() => {
        setApplyFinished(true)
        clearConvexOAuthVerifierId()
        clearPendingOAuthRedirectTo()
      })
  }, [applyOAuthStudentApp, authLoading, isAuthenticated, studentApp])

  const effectiveStudentApp = studentApp ?? optimisticApp
  const queryLoading = isAuthenticated && studentApp === undefined
  const bindingSession =
    isAuthenticated &&
    effectiveStudentApp === null &&
    (!applyFinished || studentApp === undefined)

  return {
    studentApp: effectiveStudentApp,
    isLoading: authLoading || queryLoading || bindingSession,
  }
}
