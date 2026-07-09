import { useEffect, useState } from 'react'

/** `undefined` until the first client-side media query evaluation. */
export function useMinWidth(minWidthPx: number): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${minWidthPx}px)`)
    const update = () => setMatches(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [minWidthPx])

  return matches
}
