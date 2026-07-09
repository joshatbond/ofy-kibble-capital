import { usePaginatedQuery } from 'convex/react'
import { useEffect } from 'react'

import { api } from '~/convex/_generated/api'
import { resolveOfflineList, useOfflineQuery } from '~/hooks/use-offline-query'
import {
  readCachedActivityRows,
  readPawketOfflineSnapshot,
  writePawketOfflineSnapshot,
} from '~/lib/pawket-offline-cache'
import type { PawketOfflineActivityRow } from '~/lib/pawket-offline-cache'

export function usePawketBankingData(props: {
  activityPageSize: number
  accountKind?: PawketOfflineActivityRow['accountKind']
}) {
  const {
    data: balances,
    live: liveBalances,
    isOnline,
  } = useOfflineQuery(
    api.features.banking.getMyBalances,
    {},
    () => readPawketOfflineSnapshot()?.balances ?? null
  )

  const activityQueryArgs =
    props.accountKind === undefined ? {} : { accountKind: props.accountKind }

  const activity = usePaginatedQuery(
    api.features.banking.listMyActivityHistory,
    isOnline ? activityQueryArgs : 'skip',
    { initialNumItems: props.activityPageSize }
  )

  const activityRows = resolveOfflineList({
    isOnline,
    live: activity.results,
    readCache: () => readCachedActivityRows(props.accountKind),
  })

  const syncActivity = props.accountKind === undefined

  useEffect(() => {
    if (!isOnline || liveBalances === undefined) {
      return
    }

    const existing = readPawketOfflineSnapshot()
    writePawketOfflineSnapshot({
      syncedAt: Date.now(),
      balances: liveBalances,
      activity: syncActivity ? activity.results : (existing?.activity ?? []),
    })
  }, [activity.results, isOnline, liveBalances, syncActivity])

  return {
    isOnline,
    balances,
    activity,
    activityRows,
  }
}
