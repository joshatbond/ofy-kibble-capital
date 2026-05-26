import { Badge } from '~/components/ui/badge'
import { sharedUiStoryParameters } from '~/lib/storybook-parameters'

import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: sharedUiStoryParameters,
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Pay period open',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>

      <Badge variant="secondary">Secondary</Badge>

      <Badge variant="outline">Outline</Badge>

      <Badge variant="destructive">Overdue</Badge>

      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
}
