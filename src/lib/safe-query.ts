/** Result shape for Convex queries that surface errors as data instead of throwing. */
export function normalizeSafeQueryResult<T>(
  result: T | undefined | Error
): SafeQueryResult<T> {
  if (result instanceof Error) {
    return { status: 'error', error: result }
  }
  if (result === undefined) {
    return { status: 'pending' }
  }
  return { status: 'success', data: result }
}
export type SafeQueryResult<T> =
  | { status: 'pending' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
