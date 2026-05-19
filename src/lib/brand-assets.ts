export const brandLogos = {
  kibble: {
    src: '/brand/kibble-capital.png',
    alt: 'Kibble Capital',
  },
  pawket: {
    src: '/brand/pawket-exchange.png',
    alt: 'PawKet Exchange',
  },
} as const

export type BrandKey = keyof typeof brandLogos
