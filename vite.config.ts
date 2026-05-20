import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'
import svgr from 'vite-plugin-svgr'

// Netlify plugin only for `vite build`: in dev, Vite 8 multi-env loads its dev hook twice and @netlify/vite-plugin warns about duplicates.
// Dynamic import keeps Netlify's dependency tree (minimatch/brace-expansion) out of `vite dev` config loading.
export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [
    svgr({
      include: '**/*.svg?react',
      svgrOptions: {
        dimensions: false,
      },
    }),
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
