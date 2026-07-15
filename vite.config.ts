import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import type { PluginOption } from 'vite'

const isStorybook =
  process.env.npm_lifecycle_event === 'storybook' ||
  process.env.npm_lifecycle_event === 'build-storybook'

// Netlify plugin only for `vite build`: in dev, Vite 8 multi-env loads its dev hook twice and @netlify/vite-plugin warns about duplicates.
// Dynamic import keeps Netlify's dependency tree (minimatch/brace-expansion) out of `vite dev` config loading.
export default defineConfig(async ({ command }) => {
  if (isStorybook) {
    const { default: storybookConfig } = await import('./vite.storybook')
    return storybookConfig
  }

  const plugins: Array<PluginOption> = [
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ]

  if (command === 'build') {
    const { default: netlify } =
      await import('@netlify/vite-plugin-tanstack-start')
    plugins.push(netlify())
  }

  return {
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins,
  }
})
