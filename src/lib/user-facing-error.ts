import { ConvexError } from 'convex/values'

/**
 * Message safe to show in UI. Prefer `ConvexError.data` from the API;
 * never surface Convex wrapper text / stacks from plain `Error.message`.
 */
export function userFacingErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof ConvexError) {
    const data: unknown = error.data
    if (typeof data === 'string' && data.trim().length > 0) {
      return data
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string' &&
      data.message.trim().length > 0
    ) {
      return data.message
    }
  }

  return fallback
}
