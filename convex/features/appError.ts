import { ConvexError } from 'convex/values'

/**
 * Expected failure visible to clients. Prefer this over `throw new Error(...)`
 * in public query/mutation handlers so the UI can read a clean `error.data`
 * string instead of a Convex wrapper + stack.
 */
export function userError(message: string): never {
  throw new ConvexError(message)
}

/**
 * Re-throw as {@link ConvexError} for public API boundaries.
 *
 * Safe by default: only existing {@link ConvexError}s (e.g. from {@link userError})
 * and explicitly mapped `known` patterns reach clients. Unknown plain Error
 * messages — including IDs and implementation details — map to `fallback`.
 */
export function toUserError(
  error: unknown,
  fallback: string,
  known: Array<{ pattern: RegExp; message: string }> = []
): never {
  if (error instanceof ConvexError) {
    throw error
  }

  const raw = error instanceof Error ? error.message : ''
  for (const entry of known) {
    if (entry.pattern.test(raw)) {
      throw new ConvexError(entry.message)
    }
  }

  throw new ConvexError(fallback)
}
