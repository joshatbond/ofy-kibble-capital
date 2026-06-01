import { cn } from '~/lib/class-name-merge'
import type { AppThemeId } from '~/lib/themes'

export function AppTheme(props: AppThemeProps) {
  return (
    <div
      data-theme={props.theme}
      className={cn(
        'bg-background text-foreground min-h-dvh font-sans',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
type AppThemeProps = {
  theme: AppThemeId
  children: React.ReactNode
  className?: string
}
