import { COLORS } from './constants'

const toKebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

// Exposes every colour in COLORS as a CSS custom property on :root.
export function applyColorPalette() {
  const root = document.documentElement
  Object.entries(COLORS).forEach(([key, value]) => {
    root.style.setProperty(`--${toKebab(key)}`, value)
  })
}
