import { Button } from '~/components/ui/button'
import { cn } from '~/lib/class-name-merge'

export function PawketBrutalButton({
  large,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> & {
  large?: boolean
}) {
  return (
    <Button
      size="lg"
      {...props}
      className={cn(
        'border-ink touch-manipulation border-2 transition-[background-color,box-shadow,transform] select-none hover:brightness-105 active:translate-x-0.5! active:translate-y-0.5!',
        large
          ? 'shadow-brutal-lg active:shadow-brutal'
          : 'shadow-brutal active:shadow-[2px_2px_0_0_var(--ink)]',
        large
          ? 'h-auto px-10 py-3 text-xl font-bold'
          : 'h-auto px-6 py-3 text-sm font-semibold',
        className
      )}
    >
      {children}
    </Button>
  )
}
