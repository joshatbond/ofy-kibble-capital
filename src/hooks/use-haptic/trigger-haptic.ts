import { detectMobile, detectiOS } from './utils'

const HAPTIC_SWITCH_ID = 'haptic-switch'
const HAPTIC_LABEL_ID = 'haptic-label'
let inputEl: HTMLInputElement | null = null
let labelEl: HTMLLabelElement | null = null
let isIOS: boolean | null = null
export const DEFAULT_HAPTIC_DURATION_MS = 100
export function ensureHapticElements(): void {
  if (typeof document === 'undefined') {
    return
  }

  inputEl =
    (document.getElementById(HAPTIC_SWITCH_ID) as HTMLInputElement | null) ??
    inputEl

  if (inputEl === null) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = HAPTIC_SWITCH_ID
    input.setAttribute('switch', '')
    input.style.display = 'none'
    document.body.appendChild(input)
    inputEl = input
  }

  labelEl =
    (document.getElementById(HAPTIC_LABEL_ID) as HTMLLabelElement | null) ??
    labelEl

  if (labelEl === null) {
    const label = document.createElement('label')
    label.htmlFor = HAPTIC_SWITCH_ID
    label.id = HAPTIC_LABEL_ID
    label.style.display = 'none'
    document.body.appendChild(label)
    labelEl = label
  }
}
export function triggerHaptic(duration = DEFAULT_HAPTIC_DURATION_MS): void {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') {
    return
  }

  if (!detectMobile()) {
    return
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  ensureHapticElements()
  isIOS ??= detectiOS()

  if (!isIOS && typeof navigator.vibrate === 'function') {
    navigator.vibrate(duration)
    return
  }

  labelEl?.click()
}
