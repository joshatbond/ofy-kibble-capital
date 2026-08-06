import { KibbleShieldIcon } from '~/components/brand/kibble-shield-icon'
import { cn } from '~/lib/class-name-merge'

import {
  LOADER_COMPLETE_DURATION_MS,
  LOADER_LOAD_DURATION_MS,
  LOADER_LOAD_EASING,
  useLoaderProgress,
} from './use-loader-progress'

/**
 * The animated Kibble Capital shield mark — no progress bar, no layout.
 * Use when you just need a small inline spinner.
 */
export function KibbleLoader(props: {
  /** Tailwind sizing class for the icon container. Defaults to `size-20`. */
  className?: string
}) {
  return (
    <div className="kibble-loader kibble-loader-mint">
      <KibbleLoaderStyles />

      <div className={cn('relative size-20', props.className)}>
        <KibbleShieldIcon />
      </div>
    </div>
  )
}

/**
 * Branded full-screen (or full-container) loading state.
 *
 * The bar ramps from 0% → 80% over ~{@link LOADER_LOAD_DURATION_MS}ms with a
 * decay-style easing — it gets near 80% quickly and then visibly stalls.
 * When `isReady` flips to `true`, the bar transitions from wherever it is to
 * 100% in {@link LOADER_COMPLETE_DURATION_MS}ms.
 */
export function KibbleLoadingScreen(props: {
  /**
   * When `true`, the progress bar snaps from its current value to 100% in
   * 100ms. Flip this from `false` to `true` the moment the underlying work
   * (auth check, route data, etc.) finishes.
   */
  isReady?: boolean
  /** Status text rendered above the bar. */
  label?: string
  /** Show the "Kibble Capital" wordmark above the icon. Default: true. */
  showWordmark?: boolean
  /**
   * When `true` (default), the screen fills the viewport (`min-h-dvh`).
   * Pass `false` to let a parent control the height (e.g. a preview frame).
   */
  fullScreen?: boolean
  /**
   * Optional callback fired ~100ms after `isReady` becomes `true`, i.e.
   * after the bar finishes snapping to 100%. Use this to unmount the screen
   * once the completion animation has played.
   */
  onComplete?: () => void
  className?: string
}) {
  const isReady = props.isReady ?? false
  const label = props.label ?? 'Loading your dashboard…'

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
          <div className="font-heading text-foreground text-xl font-extrabold tracking-tight uppercase">
            Kibble <span className="text-primary">Capital</span>
          </div>
        ) : null}

        <KibbleLoader className="size-24" />

        <div className="flex w-full flex-col items-center gap-3">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.25em] uppercase">
            {label}
          </span>

          <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="border-ink bg-card relative h-3 w-full overflow-hidden border-2"
          >
            <div
              className="bg-primary h-full"
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
        </div>
      </div>
    </div>
  )
}

/**
 * Scoped keyframes for the Kibble loader. Multiple instances mount duplicate
 * `<style>` tags but browsers collapse identical rules.
 */
function KibbleLoaderStyles() {
  return (
    <style>{`
      .kibble-loader {
        display: inline-flex;
        transform-origin: center;
      }

      .kibble-loader-mint .kibble-mark {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        fill-opacity: 0;
        animation: kibble-mint 2.4s ease-in-out infinite;
      }
      @keyframes kibble-mint {
        0%   { stroke-dashoffset: 1; fill-opacity: 0; }
        40%  { stroke-dashoffset: 0; fill-opacity: 0; }
        55%  { stroke-dashoffset: 0; fill-opacity: 1; }
        85%  { stroke-dashoffset: 0; fill-opacity: 1; }
        100% { stroke-dashoffset: 1; fill-opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .kibble-loader-mint .kibble-mark {
          animation: none !important;
          stroke-dashoffset: 0 !important;
          fill-opacity: 1 !important;
        }
      }
    `}</style>
  )
}
