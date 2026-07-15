import type { AppThemeId } from '~/lib/themes'

declare module '@storybook/react' {
  interface StorybookGlobals {
    appTheme: AppThemeId
  }

  interface Parameters {
    /** Suggested `data-theme` when this story is selected (toolbar `appTheme` takes precedence). */
    appTheme?: AppThemeId
    /** Skip the global `AppTheme` wrapper (e.g. side-by-side theme comparison). */
    disableAppThemeDecorator?: boolean
  }
}
