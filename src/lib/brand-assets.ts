import KibbleCapitalLogo from '~/assets/kibble_capital.svg?react'
import PawketExchangeLogo from '~/assets/pawket_exchange.svg?react'

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
