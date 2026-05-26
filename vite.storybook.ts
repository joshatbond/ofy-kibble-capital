import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Minimal Vite config for Storybook — avoids TanStack Start + Netlify plugins. */
export default defineConfig({
  cacheDir: 'node_modules/.vite-storybook',
  resolve: {
    tsconfigPaths: true,
    // Vite 8 dep-pre-bundle resolves `storybook/preview-api`, which is not exported
    // under Storybook's custom conditions; alias to the real package.
    alias: {
      'storybook/preview-api': '@storybook/preview-api',
    },
  },
  optimizeDeps: {
    exclude: ['storybook'],
  },
  plugins: [tailwindcss(), viteReact()],
})
