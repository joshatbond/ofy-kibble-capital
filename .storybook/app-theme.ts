import { sharedUiStoryParameters } from '~/lib/storybook-parameters'
import { appThemes } from '~/lib/themes'

import type { AppThemeId } from '~/lib/themes'
import type { Parameters, Preview } from '@storybook/react'

/** Storybook global: drives `data-theme` on the preview wrapper (same as `AppTheme`). */
export const appThemeGlobalType: Preview['globalTypes'] = {
  appTheme: {
    name: 'Theme',
    description:
      'Surface theme — sets `data-theme` on the preview root (Kibble, PawKet, or Admin).',
    toolbar: {
      title: 'Theme',
      icon: 'paintbrush',
      items: Object.values(appThemes).map(theme => ({
        value: theme.id,
        title: theme.label,
      })),
      dynamicTitle: true,
    },
  },
}

export const defaultAppTheme: AppThemeId = 'kibble'

export const initialAppThemeGlobals = {
  appTheme: defaultAppTheme,
}

/** Per-story default when a file targets one surface (e.g. loaders). Toolbar still overrides. */
export type AppThemeParameters = {
  /** Suggested `data-theme` when this story is selected; overridden by the Theme toolbar. */
  appTheme?: AppThemeId
  /** Skip the global `AppTheme` wrapper (e.g. side-by-side theme comparison stories). */
  disableAppThemeDecorator?: boolean
}

export function resolveAppTheme(
  globals: Record<string, unknown>,
  parameters: AppThemeParameters
): AppThemeId {
  const fromToolbar = globals.appTheme
  if (
    fromToolbar === 'kibble' ||
    fromToolbar === 'pawket' ||
    fromToolbar === 'admin'
  ) {
    return fromToolbar
  }
  return parameters.appTheme ?? defaultAppTheme
}

/** Docs blurb for shared UI primitives — point authors at the Theme toolbar. */
export const sharedUiParameters = sharedUiStoryParameters satisfies Parameters
