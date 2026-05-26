import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { sharedUiStoryParameters } from '~/lib/storybook-parameters'

import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: sharedUiStoryParameters,
  argTypes: {
    variant: {
      control: 'select',
      options: ['brutal', 'brutal-lg', 'default'],
    },
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

/** Stitch neo-brutal card — matches Kibble / PawKet landing feature panels. */
export const Brutal: Story = {
  render: () => (
    <Card variant="brutal" className="w-sm">
      <CardHeader>
        <CardTitle>Checking balance</CardTitle>

        <CardDescription>Available to spend at the store.</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">$124.50</p>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="brutal-outline" size="sm">
          History
        </Button>

        <Button variant="brutal" size="sm" className="px-4 py-2">
          Transfer
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const BrutalLarge: Story = {
  render: () => (
    <Card variant="brutal-lg" className="max-w-md gap-6 p-8">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl">Track every dollar</CardTitle>

        <CardDescription className="text-base">
          Paystubs, deductions, and net pay — built for the classroom economy.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <p className="text-muted-foreground text-sm">
          Large feature cards on marketing landings use the brutal-lg shadow.
        </p>
      </CardContent>
    </Card>
  ),
}

/** Flat card (ring only) — admin / dense UI. */
export const Default: Story = {
  render: () => (
    <Card className="w-sm">
      <CardHeader>
        <CardTitle>Checking balance</CardTitle>

        <CardDescription>Available to spend at the store.</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">$124.50</p>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm">
          History
        </Button>

        <Button size="sm">Transfer</Button>
      </CardFooter>
    </Card>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <Card variant="brutal" className="w-64">
        <CardHeader>
          <CardTitle>Brutal</CardTitle>

          <CardDescription>Standard neo-brutal shadow.</CardDescription>
        </CardHeader>
      </Card>

      <Card variant="brutal-lg" className="w-64 p-6">
        <CardHeader className="px-0">
          <CardTitle>Brutal large</CardTitle>

          <CardDescription>Feature-panel shadow.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-64">
        <CardHeader>
          <CardTitle>Default</CardTitle>

          <CardDescription>Subtle ring, no offset shadow.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
}
