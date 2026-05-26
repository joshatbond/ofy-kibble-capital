import { useEffect, useState } from 'react'

import {
  KibbleLoader,
  KibbleLoadingScreen,
} from '~/components/loading/kibble-loader'

import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Loading/Kibble',
  component: KibbleLoader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  globals: {
    appTheme: 'kibble',
  },
} satisfies Meta<typeof KibbleLoader>

export default meta

type Story = StoryObj<typeof meta>

export const InlineMark: Story = {
  name: 'Inline loader',
  render: () => <KibbleLoader />,
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
      <KibbleLoadingScreen
        isReady={isReady}
        label={isReady ? 'Ready' : 'Signing you in…'}
        fullScreen
      />
    )
  },
}
