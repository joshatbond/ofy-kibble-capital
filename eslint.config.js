// @ts-check
import convexPlugin from '@convex-dev/eslint-plugin'
import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  ...convexPlugin.configs.recommended,
  {
    ignores: ['convex/_generated/**'],
  },
  {
    rules: {
      // Disable import ordering - handled by Prettier plugin
      'import/order': 'off',
    },
  },
]
