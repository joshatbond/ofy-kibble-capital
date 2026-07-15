import { Button } from '~/components/ui/button'
import { cn } from '~/lib/class-name-merge'

export function PawketBrutalButton({
  large,
  className,
  variant,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size' | 'variant'> & {
  large?: boolean
  variant?: 'default' | 'outline'
}) {
  const brutalVariant = variant === 'outline' ? 'brutal-outline' : 'brutal'

  return (
    <Button
      variant={brutalVariant}
      size="lg"
      {...props}
      className={cn(
        'transition-all hover:-translate-x-0.5 hover:-translate-y-0.5',
        large
          ? 'shadow-brutal-lg active:shadow-brutal h-auto px-10 py-3 text-xl font-bold'
          : 'hover:shadow-brutal-lg h-auto px-6 py-3 text-sm font-semibold',
        className
      )}
    >
      {children}
    </Button>
  )
}
