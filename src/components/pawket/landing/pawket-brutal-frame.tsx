import { brutalBorder, brutalBorderLg } from '~/lib/brutal-chrome'
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
        props.large ? brutalBorderLg : brutalBorder,
        props.className
      )}
    >
      {props.children}
    </div>
  )
}
