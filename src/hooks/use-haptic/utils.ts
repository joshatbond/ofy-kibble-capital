/**
 * Utility functions for device detection.
 */

export function detectiOS(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const toMatch = [/iPhone/i, /iPad/i, /iPod/i]

  return toMatch.some(toMatchItem => {
    return RegExp(toMatchItem).exec(navigator.userAgent)
  })
}

export function detectAndroid(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  const toMatch = [/Android/i, /webOS/i, /BlackBerry/i, /Windows Phone/i]

  return toMatch.some(toMatchItem => {
    return RegExp(toMatchItem).exec(navigator.userAgent)
  })
}

export function detectMobile(): boolean {
  return detectiOS() || detectAndroid()
}
