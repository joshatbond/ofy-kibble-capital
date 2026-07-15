import { useQuery } from 'convex/react'

import { useOnlineStatus } from '~/hooks/use-online-status'

import type { OptionalRestArgsOrSkip } from 'convex/react'
import type { FunctionReference } from 'convex/server'

/** Convex query that skips offline and falls back to `readCache`. */
export function useOfflineQuery<TQuery extends FunctionReference<'query'>>(
  query: TQuery,
  args: TQuery['_args'],
  readCache: () => TQuery['_returnType']
): {
  data: TQuery['_returnType'] | undefined
  live: TQuery['_returnType'] | undefined
  isOnline: boolean
} {
  const isOnline = useOnlineStatus()
  const queryArgs = (
    isOnline ? args : 'skip'
  ) as OptionalRestArgsOrSkip<TQuery>[number]
  const live = useQuery(query, queryArgs)
  const data = resolveOfflineQueryValue({
    isOnline,
    live,
    readCache,
  })

  return { data, live, isOnline }
}

export function resolveOfflineQueryValue<TValue>(props: {
  isOnline: boolean
  live: TValue | undefined
  readCache: () => TValue
}): TValue | undefined {
  if (props.isOnline || props.live !== undefined) {
    return props.live
  }

  return props.readCache()
}

export function resolveOfflineList<TItem>(props: {
  isOnline: boolean
  live: Array<TItem>
  readCache: () => Array<TItem>
}): Array<TItem> {
  if (props.isOnline || props.live.length > 0) {
    return props.live
  }

  return props.readCache()
}
