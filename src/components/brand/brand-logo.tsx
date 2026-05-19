import { brandLogos } from '~/lib/brand-assets'
import type { BrandKey } from '~/lib/brand-assets'
import { cn } from '~/lib/class-name-merge'

type BrandLogoProps = {
  brand: BrandKey
  className?: string
}

export function BrandLogo(props: BrandLogoProps) {
  const logo = brandLogos[props.brand]

  return (
    <img
      src={logo.src}
      alt={logo.alt}
      className={cn(
        'h-10 w-auto max-w-[min(100%,280px)] object-contain',
        props.className
      )}
    />
  )
}
