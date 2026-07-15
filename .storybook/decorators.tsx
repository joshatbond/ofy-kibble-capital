import type { Decorator } from '@storybook/react'

import { AppTheme } from '~/components/theme/app-theme'

import { resolveAppTheme, type AppThemeParameters } from './app-theme'

export const withAppTheme: Decorator = (Story, context) => {
  const parameters = context.parameters as AppThemeParameters

  if (parameters.disableAppThemeDecorator) {
    return <Story />
  }

  const theme = resolveAppTheme(context.globals, parameters)

  return (
    <AppTheme theme={theme} className="p-6">
      <Story />
    </AppTheme>
  )
}
