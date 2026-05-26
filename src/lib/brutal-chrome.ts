import { cn } from '~/lib/class-name-merge'

/** Stitch neo-brutal surfaces (Kibble + PawKet). Requires `--ink` / `shadow-brutal*` theme tokens. */

export const brutalBorder = 'border-ink border-2 shadow-brutal'

export const brutalBorderLg = 'border-ink border-2 shadow-brutal-lg'

/** Buttons and other pressable controls. */
export const brutalChromeInteractive = cn(
  brutalBorder,
  'touch-manipulation transition-[background-color,box-shadow,transform] hover:brightness-105 active:translate-x-0.5! active:translate-y-0.5! active:shadow-[2px_2px_0_0_var(--ink)]'
)
