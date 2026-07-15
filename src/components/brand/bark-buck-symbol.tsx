import type { SVGProps } from 'react'

/**
 * Bark Bucks currency mark.
 *
 * Source: `src/assets/bark_bucks.svg`. Inlined for SSR — see `PawketChangeLogo`.
 * Path data is kept identical to the asset; only `stroke` uses `currentColor`.
 */
export function BarkBuckSymbol(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        stroke="currentColor"
        d="M3.3667 2.99232H1.71118M0 2.99232H1.71118M0 5.84253H3.3667M5.57403 4.28502H4.57277M5.57403 4.28502C5.57403 4.28502 7.5054 4.22021 7.5054 2.39253M5.57403 4.28502C5.57403 4.28502 7.97204 4.31094 7.97204 6.22935M5.57403 4.28502C5.57403 4.28502 7.97204 4.28502 7.97204 6.22935M5.57403 4.28502C5.57403 4.28502 7.5054 4.28504 7.5054 2.39253M5.57403 8.19922H5.69069C5.69069 8.19922 7.97204 8.14776 7.97204 6.22935M5.57403 8.19922H1.71118V5.84253M5.57403 8.19922C5.57403 8.19922 7.97204 8.17369 7.97204 6.22935M5.57403 0.5C5.57403 0.5 7.5054 0.564857 7.5054 2.39253M1.71118 2.99232V0.5H5.57403C5.57403 0.5 7.5054 0.500023 7.5054 2.39253M1.85718 4.91869V3.95508"
      />
    </svg>
  )
}
