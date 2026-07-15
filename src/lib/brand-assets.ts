import { KibbleCapitalLogo } from '~/components/brand/kibble-capital-logo'
import { PawketChangeLogo } from '~/components/brand/pawket-change-logo'

import type { FC, SVGProps } from 'react'

export const brandLogos = {
  kibble: {
    Component: KibbleCapitalLogo,
    alt: 'Kibble Capital',
  },
  pawket: {
    Component: PawketChangeLogo,
    alt: 'PawKet Change',
  },
} as const
export type BrandLogoComponent = FC<SVGProps<SVGSVGElement>>
export type BrandKey = keyof typeof brandLogos
