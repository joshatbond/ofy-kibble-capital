import { AppTheme } from '~/components/theme/app-theme'
import { Button } from '~/components/ui/button'
import { appThemes } from '~/lib/themes'
import type { AppThemeId } from '~/lib/themes'

import type { Meta, StoryObj } from '@storybook/react'

const themeIds = Object.keys(appThemes) as Array<AppThemeId>

const meta = {
  title: 'Design System/Theme',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Production surfaces use `data-theme` on the route layout (`AppTheme`). Use the **Theme** toolbar above to switch the preview wrapper; shared UI stories inherit the same control.',
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** Toolbar-driven preview — switch Theme in the toolbar to change `data-theme`. */
export const ToolbarPreview: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">
        <span>
          Change <strong>Theme</strong> in the toolbar to update&nbsp;
        </span>
        
        <code className="text-foreground">data-theme</code>.
      </p>

      <Button
        variant="brutal"
        size="lg"
        className="h-auto px-6 py-3 font-semibold"
      >
        Primary action
      </Button>

      <Button
        variant="brutal-outline"
        size="lg"
        className="h-auto px-6 py-3 font-semibold"
      >
        Secondary
      </Button>
    </div>
  ),
}

/** All three themes at once (decorator disabled to avoid nested wrappers). */
export const AllSurfaces: Story = {
  parameters: { disableAppThemeDecorator: true },
  render: () => (
    <div className="grid gap-6 p-6 md:grid-cols-3">
      {themeIds.map(themeId => (
        <AppTheme
          key={themeId}
          theme={themeId}
          className="ring-border flex flex-col gap-3 rounded-xl p-4 ring-1"
        >
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {appThemes[themeId].label}
          </p>

          <code className="text-xs">data-theme=&quot;{themeId}&quot;</code>

          <Button
            variant="brutal"
            size="lg"
            className="h-auto px-4 py-2 text-sm font-semibold"
          >
            Primary
          </Button>

          <Button
            variant="brutal-outline"
            size="lg"
            className="h-auto px-4 py-2 text-sm font-semibold"
          >
            Outline
          </Button>
        </AppTheme>
      ))}
    </div>
  ),
}
