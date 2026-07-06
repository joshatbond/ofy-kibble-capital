import { useEffect, useRef, useState } from 'react'

import { cn } from '~/lib/class-name-merge'

import { buttonVariants } from './button'

import type { VariantProps } from 'class-variance-authority'

const DEFAULT_REVEAL_DELAY_MS = 250

export function RevealLabelButton(props: {
  label: string
  icon: React.ReactNode
  onClick?: React.ComponentProps<'button'>['onClick']
  onCollapse?: () => void
  type?: React.ComponentProps<'button'>['type']
  variant?: VariantProps<typeof buttonVariants>['variant']
  className?: string
  disabled?: boolean
  revealDelayMs?: number
}) {
  const [revealed, setRevealed] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  }, [])

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  function clearHoverTimer() {
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  function reveal() {
    if (props.disabled) {
      return
    }

    setRevealed(true)
  }

  function collapse() {
    clearHoverTimer()
    setRevealed(false)
    props.onCollapse?.()
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    reveal()
    clearHoverTimer()
    props.onClick?.(event)
  }

  function handlePointerEnter() {
    if (props.disabled) {
      return
    }

    clearHoverTimer()

    if (reducedMotionRef.current) {
      reveal()
      return
    }

    hoverTimerRef.current = setTimeout(() => {
      reveal()
      hoverTimerRef.current = null
    }, props.revealDelayMs ?? DEFAULT_REVEAL_DELAY_MS)
  }

  function handleFocus() {
    reveal()
    clearHoverTimer()
  }

  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={collapse}
      onFocus={handleFocus}
      onBlur={collapse}
      aria-label={revealed ? undefined : props.label}
      className={cn(
        buttonVariants({ variant: props.variant ?? 'brutal' }),
        'inline-flex h-7 w-fit min-w-7 items-center justify-center gap-0 overflow-hidden p-0 text-xs font-bold',
        revealed && 'pr-2',
        props.className
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center [&_svg]:size-3.5">
        {props.icon}
      </span>

      <span
        className={cn(
          'grid min-w-0 transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none',
          revealed ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
        )}
      >
        <span className="min-w-0 overflow-hidden">
          <span
            className={cn(
              'inline-block whitespace-nowrap transition-[transform,opacity,padding] duration-300 ease-out motion-reduce:transition-none',
              revealed
                ? 'translate-x-0 pr-0 pl-1.5 opacity-100'
                : '-translate-x-2 pr-0 pl-0 opacity-0'
            )}
          >
            {props.label}
          </span>
        </span>
      </span>
    </button>
  )
}
