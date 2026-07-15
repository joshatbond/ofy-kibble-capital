import { cn } from '~/lib/class-name-merge'

export function PawketIconTile(props: PawketIconTileProps) {
  return (
    <div
      className={cn(
        'border-ink flex size-12 items-center justify-center rounded-lg border-2',
        'shadow-[2px_2px_0_0_var(--ink)]',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
type PawketIconTileProps = {
  children: React.ReactNode
  className?: string
}
