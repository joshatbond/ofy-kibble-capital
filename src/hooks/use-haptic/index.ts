import { useCallback, useEffect } from 'react'

import {
  DEFAULT_HAPTIC_DURATION_MS,
  ensureHapticElements,
  triggerHaptic,
} from './trigger-haptic'

export { detectAndroid, detectiOS, detectMobile } from './utils'
export { DEFAULT_HAPTIC_DURATION_MS, ensureHapticElements, triggerHaptic }

/**
 * React hook for triggering haptic feedback on mobile devices.
 *
 * Uses a hidden `input[switch]` on iOS and the Vibration API elsewhere.
 * Ported from paloma-valley-show `useHaptic`.
 */
export function useHaptic(duration = DEFAULT_HAPTIC_DURATION_MS): {
  once: () => void
  pulse: (props: { count: number; gap: number }) => Promise<() => void>
} {
  useEffect(() => {
    ensureHapticElements()
  }, [])

  const once = useCallback(() => {
    triggerHaptic(duration)
  }, [duration])

  const pulse = useCallback(
    async (props: { count: number; gap: number }) => {
      let isMounted = true

      const internalPulseCb = () => {
        if (!isMounted) {
          return
        }

        triggerHaptic(duration)
      }

      await pulseSequence(props.count, duration + props.gap, internalPulseCb)

      return () => {
        isMounted = false
      }
    },
    [duration]
  )

  return { once, pulse }
}

async function delay(ms: number) {
  return await new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}

async function pulseSequence(times: number, gap: number, cb: () => void) {
  if (
    times < 0 ||
    gap < 0 ||
    !Number.isInteger(times) ||
    !Number.isInteger(gap)
  ) {
    return
  }

  for (let i = 0; i < times; i++) {
    cb()

    if (i < times - 1) {
      await delay(gap)
    }
  }
}
