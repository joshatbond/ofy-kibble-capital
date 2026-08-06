import { useQueries } from 'convex/react'
import { useMemo } from 'react'

import { normalizeSafeQueryResult } from '~/lib/safe-query'
import type { SafeQueryResult } from '~/lib/safe-query'

import type { OptionalRestArgsOrSkip, RequestForQueries } from 'convex/react'
import type { FunctionReference } from 'convex/server'
import type { Value } from 'convex/values'

/**
 * Like Convex `useQuery`, but query failures become `{ status: 'error' }`
 * instead of throwing during render. Built on stable `useQueries`.
 */
export function useSafeQuery<TQuery extends FunctionReference<'query'>>(
  query: TQuery,
  ...args: OptionalRestArgsOrSkip<TQuery>
): SafeQueryResult<TQuery['_returnType']> {
  const skip = args[0] === 'skip'
  const argsKey = JSON.stringify(skip ? {} : (args[0] ?? {}))

  const queries = useMemo((): RequestForQueries => {
    if (skip) {
      return {}
    }
    return {
      query: {
        query,
        args: JSON.parse(argsKey) as Record<string, Value>,
      },
    }
  }, [argsKey, query, skip])

  const results = useQueries(queries)
  return normalizeSafeQueryResult<TQuery['_returnType']>(results.query)
}
