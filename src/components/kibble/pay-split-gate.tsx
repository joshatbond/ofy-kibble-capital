import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useEffect } from 'react'

import { KibbleLoadingScreen } from '~/components/loading/kibble-loader'
import { api } from '~/convex/_generated/api'

import type { ReactNode } from 'react'

const PAY_SPLIT_PATH = '/kibble/pay-split'

/**
 * Blocks other Kibble routes until the student has configured Pay split.
 * Landing is handled by AuthGate and never reaches this shell.
 */
export function PaySplitGate(props: { children: ReactNode }) {
  const paySplit = useQuery(api.features.paySplit.getMyPaySplit)
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: state => state.location.pathname,
  })

  const onWizard =
    pathname === PAY_SPLIT_PATH || pathname === `${PAY_SPLIT_PATH}/`
  const loading = paySplit === undefined
  // No roster → not a student; allow through without forcing the wizard.
  const needsWizard =
    paySplit != null && paySplit.isConfigured === false

  useEffect(() => {
    if (loading) {
      return
    }

    if (needsWizard && !onWizard) {
      void navigate({ to: PAY_SPLIT_PATH, replace: true })
    }
  }, [loading, navigate, needsWizard, onWizard])

  if (loading) {
    return (
      <KibbleLoadingScreen
        label="Loading your pay split…"
        isReady={false}
        onComplete={() => {}}
        fullScreen
      />
    )
  }

  if (needsWizard && !onWizard) {
    return (
      <KibbleLoadingScreen
        label="Setting up pay split…"
        isReady={false}
        onComplete={() => {}}
        fullScreen
      />
    )
  }

  return props.children
}
