import { useEffect, useRef, useState } from 'react'

/** Easing that climbs fast then crawls — feels like exponential decay. */
export const LOADER_LOAD_EASING = 'cubic-bezier(0.1, 0.7, 0.1, 1)'
export const LOADER_LOAD_DURATION_MS = 4500
export const LOADER_COMPLETE_DURATION_MS = 100

type UseLoaderProgressOptions = {
  /**
   * Flip to `true` the moment the underlying work finishes. The bar will snap
   * from wherever it is to 100% in {@link LOADER_COMPLETE_DURATION_MS}ms.
   */
  isReady: boolean
  /**
   * Fires ~{@link LOADER_COMPLETE_DURATION_MS}ms after `isReady` becomes
   * `true`, i.e. after the bar finishes snapping. Use this to unmount the
   * loading screen.
   */
  onComplete?: () => void
}

type UseLoaderProgressResult = {
  /** Width % to feed into the bar's `width` style. */
  progress: number
  /** `true` once the bar is in the snap-to-100% phase. */
  isCompleting: boolean
}

/**
 * Drives a "tracking-style" loading bar: 0 → 80% over ~4.5s with a decay-style
 * easing (hangs visibly at 80%), then 80 → 100% in 100ms when `isReady` flips
 * to `true`. Apply the returned `progress` to a CSS `width` and pair with the
 * exported easing constants for the matching transition.
 */
export function useLoaderProgress(
  options: UseLoaderProgressOptions
): UseLoaderProgressResult {
  const { isReady, onComplete } = options

  const [progress, setProgress] = useState(() => (isReady ? 100 : 0))
  const [isCompleting, setIsCompleting] = useState(() => isReady)
  const hasMounted = useRef(false)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      if (isReady) return
      // Two RAFs so the browser commits the initial 0% width before
      // transitioning — otherwise the bar can pop straight to 80%.
      let rid = requestAnimationFrame(() => {
        rid = requestAnimationFrame(() => setProgress(80))
      })
      return () => cancelAnimationFrame(rid)
    }

    if (isReady && !isCompleting) {
      setIsCompleting(true)
      setProgress(100)
    }
  }, [isReady, isCompleting])

  useEffect(() => {
    if (!isCompleting) return
    const id = window.setTimeout(() => {
      onCompleteRef.current?.()
    }, LOADER_COMPLETE_DURATION_MS)
    return () => window.clearTimeout(id)
  }, [isCompleting])

  return { progress, isCompleting }
}
