import { useLayoutEffect, useRef, useState } from 'react'

export function useNavTabIndicator(props: {
  current: string
  orientation: 'horizontal' | 'vertical'
  /** Remeasure when surrounding layout changes (e.g. classroom context). */
  layoutKey?: string
}) {
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const metricsRef = useRef<NavMetrics | null>(null)
  const committedTabRef = useRef<string | null>(null)
  const animationRef = useRef<Animation | null>(null)
  const [indicatorReady, setIndicatorReady] = useState(false)
  const isHorizontal = props.orientation === 'horizontal'

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return

    function clearIndicator() {
      setIndicatorReady(false)
      metricsRef.current = null
    }

    function isNavMeasurable() {
      const navElement = navRef.current
      if (!navElement) {
        return false
      }

      const rect = navElement.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    }

    function measureActiveTab() {
      const navElement = navRef.current
      if (!navElement) return null

      const tab = navElement.querySelector<HTMLAnchorElement>(
        `[data-nav-tab="${props.current}"]`
      )

      if (!tab) return null

      const navRect = navElement.getBoundingClientRect()
      const tabRect = tab.getBoundingClientRect()

      if (isHorizontal) {
        return {
          offset: tabRect.left - navRect.left,
          size: tabRect.width,
          crossOffset: tabRect.top - navRect.top,
          crossSize: tabRect.height,
        }
      }

      return {
        offset: tabRect.top - navRect.top,
        size: tabRect.height,
        crossOffset: tabRect.left - navRect.left,
        crossSize: tabRect.width,
      }
    }

    function applyMetrics(metrics: NavMetrics) {
      const el = indicatorRef.current
      if (!el) return

      if (isHorizontal) {
        el.style.left = `${metrics.offset}px`
        el.style.width = `${metrics.size}px`
        el.style.top = `${metrics.crossOffset}px`
        el.style.height = `${metrics.crossSize}px`
      } else {
        el.style.top = `${metrics.offset}px`
        el.style.height = `${metrics.size}px`
        el.style.left = `${metrics.crossOffset}px`
        el.style.width = `${metrics.crossSize}px`
      }

      metricsRef.current = metrics
      setIndicatorReady(true)
    }

    function animateRubberBand(from: NavMetrics, to: NavMetrics) {
      const el = indicatorRef.current
      if (!el) return

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches

      if (reducedMotion) {
        applyMetrics(to)
        committedTabRef.current = props.current
        return
      }

      const goingForward = to.offset >= from.offset
      const stretch = goingForward
        ? {
            ...from,
            size: to.offset + to.size - from.offset,
          }
        : {
            ...to,
            size: from.offset + from.size - to.offset,
          }

      animationRef.current?.cancel()

      const stretchKeyframes = isHorizontal
        ? [
            {
              left: `${from.offset}px`,
              width: `${from.size}px`,
              top: `${from.crossOffset}px`,
              height: `${from.crossSize}px`,
            },
            {
              left: `${stretch.offset}px`,
              width: `${stretch.size}px`,
              top: `${stretch.crossOffset}px`,
              height: `${stretch.crossSize}px`,
            },
          ]
        : [
            {
              top: `${from.offset}px`,
              height: `${from.size}px`,
              left: `${from.crossOffset}px`,
              width: `${from.crossSize}px`,
            },
            {
              top: `${stretch.offset}px`,
              height: `${stretch.size}px`,
              left: `${stretch.crossOffset}px`,
              width: `${stretch.crossSize}px`,
            },
          ]

      const stretchAnimation = el.animate(stretchKeyframes, {
        duration: 90,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
        fill: 'forwards',
      })

      animationRef.current = stretchAnimation

      void stretchAnimation.finished
        .then(() => {
          const snapKeyframes = isHorizontal
            ? [
                {
                  left: `${stretch.offset}px`,
                  width: `${stretch.size}px`,
                  top: `${stretch.crossOffset}px`,
                  height: `${stretch.crossSize}px`,
                },
                {
                  left: `${to.offset}px`,
                  width: `${to.size}px`,
                  top: `${to.crossOffset}px`,
                  height: `${to.crossSize}px`,
                },
              ]
            : [
                {
                  top: `${stretch.offset}px`,
                  height: `${stretch.size}px`,
                  left: `${stretch.crossOffset}px`,
                  width: `${stretch.crossSize}px`,
                },
                {
                  top: `${to.offset}px`,
                  height: `${to.size}px`,
                  left: `${to.crossOffset}px`,
                  width: `${to.crossSize}px`,
                },
              ]

          const snapAnimation = el.animate(snapKeyframes, {
            duration: 110,
            easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
            fill: 'forwards',
          })

          animationRef.current = snapAnimation
          return snapAnimation.finished
        })
        .then(() => {
          applyMetrics(to)
          committedTabRef.current = props.current
          animationRef.current = null
        })
        .catch(() => {
          applyMetrics(to)
          committedTabRef.current = props.current
          animationRef.current = null
        })
    }

    function syncIndicatorLayout() {
      if (animationRef.current) {
        return
      }

      if (!isNavMeasurable()) {
        clearIndicator()
        return
      }

      const target = measureActiveTab()
      if (!target) {
        return
      }

      applyMetrics(target)
    }

    function runTabTransition() {
      if (!isNavMeasurable()) {
        clearIndicator()
        return
      }

      const previousTab = committedTabRef.current
      const fromMetrics = metricsRef.current
      const target = measureActiveTab()

      if (!target) {
        return
      }

      const isTabChange =
        previousTab !== null &&
        previousTab !== props.current &&
        fromMetrics !== null

      if (isTabChange) {
        animateRubberBand(fromMetrics, target)
        return
      }

      animationRef.current?.cancel()
      animationRef.current = null
      applyMetrics(target)
      committedTabRef.current = props.current
    }

    runTabTransition()

    let resizeFrame = 0
    function handleWindowResize() {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          syncIndicatorLayout()
        })
      })
    }
    window.addEventListener('resize', handleWindowResize)

    return () => {
      animationRef.current?.cancel()
      window.removeEventListener('resize', handleWindowResize)
      cancelAnimationFrame(resizeFrame)
    }
  }, [isHorizontal, props.current, props.layoutKey])

  return { navRef, indicatorRef, indicatorReady }
}
type NavMetrics = {
  offset: number
  size: number
  crossOffset: number
  crossSize: number
}
