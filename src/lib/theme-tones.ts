/**
 * Tonal palettes from Stitch (T000–T100). Not returned by list_design_systems;
 * copied from the Stitch design-system UI.
 */
export type ToneStep =
  | 'default'
  | '000'
  | '010'
  | '020'
  | '030'
  | '040'
  | '050'
  | '060'
  | '070'
  | '080'
  | '090'
  | '095'
  | '100'

export type ToneScale = Record<ToneStep, string>

export type ThemeTones = {
  primary: ToneScale
  secondary: ToneScale
  tertiary: ToneScale
  neutral: ToneScale
}

export const kineticLedgerTones = {
  primary: {
    default: '#E31837',
    '000': '#000000',
    '010': '#410007',
    '020': '#680011',
    '030': '#92001D',
    '040': '#BF0029',
    '050': '#E81E3A',
    '060': '#FF525B',
    '070': '#FF8888',
    '080': '#FFB3B1',
    '090': '#FFDAD8',
    '095': '#FFEDEB',
    '100': '#FFFFFF',
  },
  tertiary: {
    default: '#00808C',
    '000': '#000000',
    '010': '#001F23',
    '020': '#00363C',
    '030': '#004F57',
    '040': '#006973',
    '050': '#0C838F',
    '060': '#3A9EAA',
    '070': '#59B9C5',
    '080': '#77D4E1',
    '090': '#93F1FE',
    '095': '#CDF8FF',
    '100': '#FFFFFF',
  },
  secondary: {
    default: '#1A1A1A',
    '000': '#000000',
    '010': '#1C1B1B',
    '020': '#313030',
    '030': '#474746',
    '040': '#5F5E5E',
    '050': '#787776',
    '060': '#929090',
    '070': '#ADABAA',
    '080': '#C8C6C5',
    '090': '#E5E2E1',
    '095': '#F3F0EF',
    '100': '#FFFFFF',
  },
  neutral: {
    default: '#FFFFFF',
    '000': '#000000',
    '010': '#1A1C1C',
    '020': '#2F3131',
    '030': '#454747',
    '040': '#5D5F5F',
    '050': '#767777',
    '060': '#909191',
    '070': '#AAABAB',
    '080': '#C6C6C7',
    '090': '#E2E2E2',
    '095': '#F0F1F1',
    '100': '#FFFFFF',
  },
} satisfies ThemeTones

export const vibrantScholarTones = {
  primary: {
    default: '#2D5BFF',
    '000': '#000000',
    '010': '#001355',
    '020': '#002387',
    '030': '#0035BD',
    '040': '#104AF0',
    '050': '#4269FF',
    '060': '#6D88FF',
    '070': '#93A6FF',
    '080': '#B8C3FF',
    '090': '#DDE1FF',
    '095': '#F0EFFF',
    '100': '#FFFFFF',
  },
  secondary: {
    default: '#00F5A0',
    '000': '#000000',
    '010': '#002111',
    '020': '#003921',
    '030': '#005232',
    '040': '#006C44',
    '050': '#008857',
    '060': '#00A56B',
    '070': '#00C37F',
    '080': '#00E293',
    '090': '#50FFAF',
    '095': '#C0FFD7',
    '100': '#FFFFFF',
  },
  tertiary: {
    default: '#FFF066',
    '000': '#000000',
    '010': '#1F1C00',
    '020': '#363100',
    '030': '#4E4800',
    '040': '#686000',
    '050': '#837900',
    '060': '#9F9301',
    '070': '#BBAE28',
    '080': '#D7C943',
    '090': '#F4E55D',
    '095': '#FFF393',
    '100': '#FFFFFF',
  },
  neutral: {
    default: '#1A1A1A',
    '000': '#000000',
    '010': '#1C1B1B',
    '020': '#313030',
    '030': '#474746',
    '040': '#5F5E5E',
    '050': '#787776',
    '060': '#929090',
    '070': '#ADABAA',
    '080': '#C8C6C5',
    '090': '#E5E2E1',
    '095': '#F3F0EF',
    '100': '#FFFFFF',
  },
} satisfies ThemeTones

/** Stitch T010 → CSS/Tailwind suffix `10` (e.g. `primary-10`). */
export function toneStepToSuffix(step: Exclude<ToneStep, 'default'>): string {
  return String(Number.parseInt(step, 10))
}
