import { useEffect, useState } from 'react'

import {
  PawketLoader,
  PawketLoadingScreen,
} from '~/components/loading/pawket-loader'

import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Loading/PawKet',
  component: PawketLoader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  globals: {
    appTheme: 'pawket',
  },
} satisfies Meta<typeof PawketLoader>
export default meta
export const InlineMark: Story = {
  name: 'Inline loader',
  render: () => <PawketLoader />,
}
export const LoadingScreen: Story = {
  name: 'Full loading screen',
  parameters: {
    layout: 'fullscreen',
  },
  render: function LoadingScreenStory() {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
      const timer = window.setTimeout(() => setIsReady(true), 2200)
      return () => window.clearTimeout(timer)
    }, [])

    return (
      <PawketLoadingScreen
        isReady={isReady}
        label={isReady ? 'Ready' : 'Loading your accounts…'}
        fullScreen
      />
    )
  },
}
type Story = StoryObj<typeof meta>
