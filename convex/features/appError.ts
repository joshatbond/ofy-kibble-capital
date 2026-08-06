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
 * Keeps an existing ConvexError; maps known internal messages; otherwise uses fallback.
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

  // Plain single-line product errors thrown deeper in helpers.
  if (
    raw.length > 0 &&
    raw.length <= 180 &&
    !raw.includes('\n') &&
    !raw.includes('[CONVEX')
  ) {
    throw new ConvexError(raw)
  }

  throw new ConvexError(fallback)
}
