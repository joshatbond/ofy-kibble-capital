import { cn } from '~/lib/class-name-merge'
import type { AppThemeId } from '~/lib/themes'

import type { ComponentProps, ReactNode, Ref } from 'react'

export function AppTheme(
  props: {
    theme: AppThemeId
    children: ReactNode
    className?: string
    ref?: Ref<HTMLDivElement>
  } & Omit<ComponentProps<'div'>, 'children' | 'className'>
) {
  const { theme, children, className, ref, ...divProps } = props

  return (
    <div ref={ref} data-theme={theme} className={cn(className)} {...divProps}>
      {children}
    </div>
  )
}
