import { cn } from '~/lib/class-name-merge'

type PawketBrutalFrameProps = {
  children: React.ReactNode
  className?: string
  id?: string
  large?: boolean
}

export function PawketBrutalFrame(props: PawketBrutalFrameProps) {
  return (
    <div
      id={props.id}
      className={cn(
        'border-ink border-2',
        props.large ? 'shadow-brutal-lg' : 'shadow-brutal',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
