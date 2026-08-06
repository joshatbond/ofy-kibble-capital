import { ConvexError } from 'convex/values'
import { describe, expect, test } from 'vitest'

import { userFacingErrorMessage } from './user-facing-error'

describe('userFacingErrorMessage', () => {
  test('reads string ConvexError data', () => {
    expect(
      userFacingErrorMessage(
        new ConvexError('Postpone date must be after today.'),
        'fallback'
      )
    ).toBe('Postpone date must be after today.')
  })

  test('reads message field from object ConvexError data', () => {
    expect(
      userFacingErrorMessage(
        new ConvexError({ message: 'Save failed.' }),
        'fallback'
      )
    ).toBe('Save failed.')
  })

  test('ignores plain Error messages (Convex wrappers / stacks)', () => {
    expect(
      userFacingErrorMessage(
        new Error(
          '[CONVEX M(features/payroll:ensureCurrentPayPeriod)] Uncaught Error: boom\n    at foo'
        ),
        'Could not load the current pay period.'
      )
    ).toBe('Could not load the current pay period.')
  })

  test('falls back for empty or whitespace ConvexError data', () => {
    expect(userFacingErrorMessage(new ConvexError(''), 'fallback')).toBe(
      'fallback'
    )
    expect(userFacingErrorMessage(new ConvexError('   '), 'fallback')).toBe(
      'fallback'
    )
    expect(
      userFacingErrorMessage(new ConvexError({ message: '   ' }), 'fallback')
    ).toBe('fallback')
    expect(
      userFacingErrorMessage(new ConvexError({ message: '' }), 'fallback')
    ).toBe('fallback')
  })

  test('falls back for unknown non-Error values', () => {
    expect(userFacingErrorMessage('raw string', 'fallback')).toBe('fallback')
    expect(userFacingErrorMessage({ foo: 1 }, 'fallback')).toBe('fallback')
    expect(userFacingErrorMessage(null, 'fallback')).toBe('fallback')
  })
})
