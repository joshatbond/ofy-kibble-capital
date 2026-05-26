import { Button } from '~/components/ui/button'
import { sharedUiStoryParameters } from '~/lib/storybook-parameters'

import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: sharedUiStoryParameters,
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'brutal',
        'brutal-outline',
        'default',
        'outline',
        'secondary',
        'ghost',
        'destructive',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: [
        'default',
        'xs',
        'sm',
        'lg',
        'icon',
        'icon-xs',
        'icon-sm',
        'icon-lg',
      ],
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

/** Primary CTA — matches Stitch neo-brutal buttons on Kibble / PawKet landings. */
export const Brutal: Story = {
  args: {
    variant: 'brutal',
    size: 'lg',
    className: 'h-auto px-6 py-3 font-semibold',
    children: 'Continue',
  },
}

export const BrutalOutline: Story = {
  args: {
    variant: 'brutal-outline',
    size: 'lg',
    className: 'h-auto px-6 py-3 font-semibold',
    children: 'Learn more',
  },
}

export const BrutalLarge: Story = {
  args: {
    variant: 'brutal',
    size: 'lg',
    className:
      'shadow-brutal-lg active:shadow-brutal h-auto px-10 py-3 text-xl font-bold',
    children: 'Get started',
  },
}

/** Flat shadcn default (no brutal shadow) — admin / dense UI. */
export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Continue',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancel',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Remove',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="brutal"
        size="lg"
        className="h-auto px-6 py-3 font-semibold"
      >
        Brutal
      </Button>

      <Button
        variant="brutal-outline"
        size="lg"
        className="h-auto px-6 py-3 font-semibold"
      >
        Brutal outline
      </Button>

      <Button>Default</Button>

      <Button variant="secondary">Secondary</Button>

      <Button variant="outline">Outline</Button>

      <Button variant="ghost">Ghost</Button>

      <Button variant="destructive">Destructive</Button>

      <Button variant="link">Link</Button>
    </div>
  ),
}
