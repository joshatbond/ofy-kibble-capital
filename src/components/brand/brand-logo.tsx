import { brandLogos } from '~/lib/brand-assets'
import type { BrandKey } from '~/lib/brand-assets'
import { cn } from '~/lib/class-name-merge'

export function BrandLogo(props: { brand: BrandKey; className?: string }) {
  const logo = brandLogos[props.brand]
  const Logo = logo.Component

  return (
    <Logo
      role="img"
      aria-label={logo.alt}
      className={cn('h-10 w-auto max-w-[min(100%,280px)]', props.className)}
    />
  )
}
