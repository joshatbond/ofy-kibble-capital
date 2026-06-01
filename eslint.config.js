// @ts-check

import convexPlugin from '@convex-dev/eslint-plugin'
import { tanstackConfig } from '@tanstack/eslint-config'
import reactPlugin from 'eslint-plugin-react'

import moduleOrderingPlugin from './eslint/plugins/module-ordering-plugin.mjs'

export default [
  {
    ignores: [
      '.output/**',
      '.storybook/**',
      '.tanstack/**',
      '.turbo/**',
      'convex/_generated/**',
      'storybook-static/**',
    ],
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/jsx-newline': ['error', { prevent: false }],
    },
  },
  ...tanstackConfig,
  ...convexPlugin.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'module-ordering': moduleOrderingPlugin,
    },
    rules: {
      'module-ordering/module-ordering': 'warn',
      // Align with Prettier-era grouping: packages → ~/ alias → relative parents → siblings,
      // with blank lines between groups (TanStack omits `newlines-between` by default).
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '~/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]
