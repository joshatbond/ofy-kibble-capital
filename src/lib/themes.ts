export const appThemes = {
  kibble: 'Kibble Capital',
  pawket: 'PawKet Exchange',
} as const

export type AppThemeId = keyof typeof appThemes
