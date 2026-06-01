import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, it } from 'node:test'

import moduleOrderingPlugin from './module-ordering-plugin.mjs'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
})

describe('module-ordering', () => {
  it('flags export type before a later export function', () => {
    ruleTester.run('module-ordering', moduleOrderingPlugin.rules['module-ordering'], {
      valid: [
        {
          filename: 'src/example.ts',
          code: `
export const X = 1
export function f() {}
export type T = { a: string }
`,
        },
      ],
      invalid: [
        {
          filename: 'src/example.ts',
          code: `
export const X = 1
export type T = { a: string }
export function f() {}
`,
          errors: [
            { messageId: 'wrongOrderBefore' },
            { messageId: 'wrongOrder' },
          ],
        },
      ],
    })
  })
})
