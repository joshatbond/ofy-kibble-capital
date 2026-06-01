import { cn } from '~/lib/class-name-merge'

export function KibbleShieldIcon(props: KibbleShieldIconProps) {
  return (
    <svg
      viewBox="0 0 387.35972 432.92905"
      role="img"
      aria-label="Kibble Capital"
      className={cn('block h-full w-full overflow-visible', props.className)}
    >
      <g
        className="stroke-ink stroke-30 [paint-order:fill_markers_stroke] [stroke-linecap:round] [stroke-linejoin:round]"
        transform="translate(0.60967472,1.209271)"
      >
        <path
          className={cn('kibble-shield fill-primary', props.shieldClassName)}
          d="M 14.989923,13.790729 H 371.75007 l -1.19919,214.655691 c 0,0 -7.42017,62.7808 -64.38308,115.51596 -59.12937,54.74082 -113.0976,72.75746 -113.0976,72.75746 0,0 -46.99126,-12.92225 -104.758941,-62.56302 C 24.465436,299.29298 14.390325,222.45045 14.390325,222.45045 Z"
        />

        {props.hideMark ? null : (
          <path
            className={cn(
              'kibble-mark fill-primary-foreground',
              props.markClassName
            )}
            d="M 68.983772,14.947311 68.499529,333.23039 133.81298,385.84943 134.66094,253.44139 155.95545,231.7229 283.24561,364.52479 330.832,317.36238 202.09428,182.68896 362.43502,15.564558 H 272.24194 L 134.26708,157.35524 V 14.668818 Z"
            pathLength={1}
          />
        )}
      </g>
    </svg>
  )
}
type KibbleShieldIconProps = {
  className?: string
  /** Extra classes for the red shield path. */
  shieldClassName?: string
  /** Extra classes for the white K mark path. */
  markClassName?: string
  /** Hide the K so loaders can render the mark separately if needed. */
  hideMark?: boolean
}
