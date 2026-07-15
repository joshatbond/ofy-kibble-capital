import type { Preview } from '@storybook/react'

import '~/styles/app.css'

import { appThemeGlobalType, initialAppThemeGlobals } from './app-theme'
import { withAppTheme } from './decorators'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  globalTypes: appThemeGlobalType,
  initialGlobals: initialAppThemeGlobals,
  decorators: [withAppTheme],
}

export default preview
