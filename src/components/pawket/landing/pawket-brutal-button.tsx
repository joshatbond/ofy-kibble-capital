import { Button } from '~/components/ui/button'
import type { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/class-name-merge'

import type { VariantProps } from 'class-variance-authority'

type PawketBrutalButtonProps = {
  children: React.ReactNode
  className?: string
  large?: boolean
  variant?: VariantProps<typeof buttonVariants>['variant']
}

export function PawketBrutalButton(props: PawketBrutalButtonProps) {
  return (
    <Button
      size="lg"
      variant={props.variant}
      className={cn(
        'border-ink touch-manipulation border-2 transition-[background-color,box-shadow,transform] select-none hover:brightness-105 active:translate-x-0.5! active:translate-y-0.5!',
        props.large
          ? 'shadow-brutal-lg active:shadow-brutal'
          : 'shadow-brutal active:shadow-[2px_2px_0_0_var(--ink)]',
        props.large
          ? 'h-auto px-10 py-3 text-xl font-bold'
          : 'h-auto px-6 py-3 text-sm font-semibold',
        props.className
      )}
    >
      {props.children}
    </Button>
  )
}
