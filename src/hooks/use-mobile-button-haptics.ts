import { useEffect } from 'react'

import {
  ensureHapticElements,
  triggerHaptic,
} from '~/hooks/use-haptic/trigger-haptic'
import { detectMobile } from '~/hooks/use-haptic/utils'

/**
 * Fires haptic feedback on touch presses for every native `<button>` in the app.
 * Mount once near the root (see `__root.tsx`).
 */
export function useMobileButtonHaptics() {
  useEffect(() => {
    ensureHapticElements()
  }, [])

  useEffect(() => {
    if (!detectMobile()) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== 'touch') {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const button = target.closest('button')
      if (button === null || button.disabled) {
        return
      }

      if (button.hasAttribute('data-no-haptic')) {
        return
      }

      triggerHaptic()
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])
}
