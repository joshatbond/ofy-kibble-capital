import { KibbleCapitalLogo } from '~/components/brand/kibble-capital-logo'
import { PawketExchangeLogo } from '~/components/brand/pawket-exchange-logo'

import type { FC, SVGProps } from 'react'

export type BrandLogoComponent = FC<SVGProps<SVGSVGElement>>

export const brandLogos = {
  kibble: {
    Component: KibbleCapitalLogo,
    alt: 'Kibble Capital',
  },
  pawket: {
    Component: PawketExchangeLogo,
    alt: 'PawKet Exchange',
  },
} as const

export type BrandKey = keyof typeof brandLogos
