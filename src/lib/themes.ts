/**
 * Route-level themes mapped to Stitch design systems.
 *
 * Stitch sources (repo only, not used at runtime):
 * - kibble: design/stitch/student-payroll-tracker/kinetic-ledger
 * - pawket: design/stitch/student-payroll-tracker/vibrant-scholar
 */
export const appThemes = {
  kibble: {
    id: 'kibble',
    label: 'Kinetic Ledger',
    themeColor: '#e31837',
  },
  pawket: {
    id: 'pawket',
    label: 'Vibrant Scholar',
    themeColor: '#2d5bff',
  },
} as const

export type AppThemeId = keyof typeof appThemes
