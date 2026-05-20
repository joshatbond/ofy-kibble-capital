import { PawketMarkIcon } from '~/components/brand/pawket-mark-icon'
import { cn } from '~/lib/class-name-merge'

import {
  LOADER_COMPLETE_DURATION_MS,
  LOADER_LOAD_DURATION_MS,
  LOADER_LOAD_EASING,
  useLoaderProgress,
} from './use-loader-progress'

/**
 * The animated PawKet Exchange mark — no progress bar, no layout.
 * Use when you just need an inline spinner.
 */
export function PawketLoader(props: {
  /** Tailwind sizing class for the icon container. Defaults to `size-20`. */
  className?: string
}) {
  return (
    <div className="pawket-loader pawket-loader-pads">
      <PawketLoaderStyles />

      <div className={cn('relative size-20', props.className)}>
        <PawketMarkIcon />
      </div>
    </div>
  )
}

/**
 * Branded full-screen (or full-container) PawKet loading state. Same progress
 * bar mechanics as the Kibble loader, with PawKet's navy/teal/gold palette.
 */
export function PawketLoadingScreen(props: {
  /**
   * When `true`, the progress bar snaps from its current value to 100% in
   * 100ms. Flip this from `false` to `true` the moment the underlying work
   * (auth check, route data, etc.) finishes.
   */
  isReady?: boolean
  /** Status text rendered under the bar. */
  label?: string
  /** Show the "PawKet Exchange" wordmark above the icon. Default: true. */
  showWordmark?: boolean
  /**
   * When `true` (default), the screen fills the viewport (`min-h-dvh`).
   * Pass `false` to let a parent control the height.
   */
  fullScreen?: boolean
  /**
   * Optional callback fired ~100ms after `isReady` becomes `true`. Use this
   * to unmount the screen once the completion animation has played.
   */
  onComplete?: () => void
  className?: string
}) {
  const isReady = props.isReady ?? false
  const label = props.label ?? 'Loading your account…'

  const { progress, isCompleting } = useLoaderProgress({
    isReady,
    onComplete: props.onComplete,
  })

  return (
    <div
      className={cn(
        'bg-background text-foreground relative flex w-full flex-col items-center justify-center gap-10 overflow-hidden px-6 py-12',
        props.fullScreen !== false && 'min-h-dvh',
        props.className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--secondary)_1.5px,transparent_1.5px)] bg-size-[24px_24px] opacity-50"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-[320px] flex-col items-center gap-8">
        {props.showWordmark !== false ? (
          <div className="font-heading text-xl font-extrabold tracking-tight uppercase">
            <span className="text-(--logo-teal)">Paw</span>
            <span className="text-(--logo-navy-deep)">Ket</span>
            <span className="text-(--logo-navy-deep)"> Exchange</span>
          </div>
        ) : null}

        <PawketLoader className="size-24" />

        <div className="flex w-full flex-col items-center gap-3">
          <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="border-ink bg-card relative h-3 w-full overflow-hidden border-2"
          >
            <div
              className="h-full bg-(--logo-teal)"
              style={{
                width: `${progress}%`,
                transitionProperty: 'width',
                transitionDuration: isCompleting
                  ? `${LOADER_COMPLETE_DURATION_MS}ms`
                  : `${LOADER_LOAD_DURATION_MS}ms`,
                transitionTimingFunction: isCompleting
                  ? 'linear'
                  : LOADER_LOAD_EASING,
              }}
            />
          </div>

          <span className="text-[11px] font-semibold tracking-[0.25em] text-(--logo-navy-deep) uppercase">
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Scoped keyframes for the PawKet "pads" loader. Multiple instances mount
 * duplicate `<style>` tags but browsers collapse identical rules.
 */
function PawketLoaderStyles() {
  return (
    <style>{`
      .pawket-loader {
        display: inline-flex;
        transform-origin: center;
      }

      /* Central pad + four gold toes ripple in sequence. */
      .pawket-loader-pads .pawket-paw-toe,
      .pawket-loader-pads .pawket-paw-pad {
        opacity: 0.22;
        animation: pawket-pads 1.6s ease-in-out infinite;
      }
      .pawket-loader-pads .pawket-paw-pad   { animation-delay: 0s; }
      .pawket-loader-pads .pawket-paw-toe-1 { animation-delay: 0.15s; }
      .pawket-loader-pads .pawket-paw-toe-2 { animation-delay: 0.30s; }
      .pawket-loader-pads .pawket-paw-toe-3 { animation-delay: 0.45s; }
      .pawket-loader-pads .pawket-paw-toe-4 { animation-delay: 0.60s; }

      @keyframes pawket-pads {
        0%   { opacity: 0.22; }
        25%  { opacity: 1; }
        65%  { opacity: 1; }
        100% { opacity: 0.22; }
      }

      @media (prefers-reduced-motion: reduce) {
        .pawket-loader-pads .pawket-paw-toe,
        .pawket-loader-pads .pawket-paw-pad {
          animation: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  )
}
