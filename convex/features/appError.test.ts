import { ConvexError } from 'convex/values'
import { describe, expect, test } from 'vitest'

import { toUserError, userError } from './appError'

describe('appError', () => {
  test('userError throws ConvexError with string data', () => {
    expect(() => userError('Sign in to continue.')).toThrow(ConvexError)
    try {
      userError('Sign in to continue.')
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      expect((error as ConvexError<string>).data).toBe('Sign in to continue.')
    }
  })

  test('toUserError maps known internal messages', () => {
    try {
      toUserError(
        new Error('Could not find a pay date within search horizon.'),
        'fallback',
        [
          {
            pattern: /search horizon/i,
            message:
              'Could not find a valid payday for this classroom schedule. Check Settings, then try again.',
          },
        ]
      )
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      expect((error as ConvexError<string>).data).toBe(
        'Could not find a valid payday for this classroom schedule. Check Settings, then try again.'
      )
    }
  })

  test('toUserError passes through short plain Error messages', () => {
    try {
      toUserError(
        new Error('Only an open pay period can be postponed.'),
        'fallback'
      )
    } catch (error) {
      expect((error as ConvexError<string>).data).toBe(
        'Only an open pay period can be postponed.'
      )
    }
  })

  test('toUserError uses fallback for long or Convex-wrapped messages', () => {
    try {
      toUserError(
        new Error(
          '[CONVEX M(features/payroll:ensureCurrentPayPeriod)] Uncaught Error: boom\n    at foo'
        ),
        'Could not load the current pay period.'
      )
    } catch (error) {
      expect((error as ConvexError<string>).data).toBe(
        'Could not load the current pay period.'
      )
    }
  })

  test('toUserError rethrows existing ConvexError', () => {
    const original = new ConvexError('Keep me.')
    try {
      toUserError(original, 'fallback')
    } catch (error) {
      expect(error).toBe(original)
    }
  })
})
