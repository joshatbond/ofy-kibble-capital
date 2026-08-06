import { ConvexError } from 'convex/values'
import { describe, expect, test } from 'vitest'

import { toUserError, userError } from './appError'

describe('appError', () => {
  test('userError throws ConvexError with string data', () => {
    expect.assertions(2)
    try {
      userError('Sign in to continue.')
      expect.unreachable('expected userError to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      expect((error as ConvexError<string>).data).toBe('Sign in to continue.')
    }
  })

  test('toUserError maps known internal messages', () => {
    expect.assertions(2)
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
      expect.unreachable('expected toUserError to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      expect((error as ConvexError<string>).data).toBe(
        'Could not find a valid payday for this classroom schedule. Check Settings, then try again.'
      )
    }
  })

  test('toUserError passes through short plain Error messages', () => {
    expect.assertions(2)
    try {
      toUserError(
        new Error('Only an open pay period can be postponed.'),
        'fallback'
      )
      expect.unreachable('expected toUserError to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      expect((error as ConvexError<string>).data).toBe(
        'Only an open pay period can be postponed.'
      )
    }
  })

  test('toUserError uses fallback for long or Convex-wrapped messages', () => {
    expect.assertions(1)
    try {
      toUserError(
        new Error(
          '[CONVEX M(features/payroll:ensureCurrentPayPeriod)] Uncaught Error: boom\n    at foo'
        ),
        'Could not load the current pay period.'
      )
      expect.unreachable('expected toUserError to throw')
    } catch (error) {
      expect((error as ConvexError<string>).data).toBe(
        'Could not load the current pay period.'
      )
    }
  })

  test('toUserError uses fallback for unknown and non-Error values', () => {
    const values: Array<unknown> = [
      'plain string',
      { foo: 1 },
      null,
      undefined,
      42,
    ]
    expect.assertions(values.length)
    for (const value of values) {
      try {
        toUserError(value, 'Could not load payroll.')
        expect.unreachable('expected toUserError to throw')
      } catch (error) {
        expect((error as ConvexError<string>).data).toBe(
          'Could not load payroll.'
        )
      }
    }
  })

  test('toUserError rethrows existing ConvexError', () => {
    const original = new ConvexError('Keep me.')
    expect.assertions(1)
    try {
      toUserError(original, 'fallback')
      expect.unreachable('expected toUserError to throw')
    } catch (error) {
      expect(error).toBe(original)
    }
  })
})
