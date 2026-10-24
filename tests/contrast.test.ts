import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../app/assets/css/tokens.css', import.meta.url), 'utf8')
function luminance(rgb: number[]) {
  const linear = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
}
function rgb(hex: string) {
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
}
function contrast(foreground: string, background: string, opacity = 1) {
  const bg = rgb(background)
  const fg = rgb(foreground).map((value, index) => value * opacity + bg[index]! * (1 - opacity))
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (light! + 0.05) / (dark! + 0.05)
}

for (const theme of ['light', 'dark']) {
  describe(`${theme} semantic text pairs`, () => {
    const block = css.match(
      theme === 'light' ? /:root\s*\{([^}]+)\}/ : /:root\.dark\s*\{([^}]+)\}/,
    )![1]!
    const tokens = Object.fromEntries(
      [...block.matchAll(/--([\w-]+):\s*#([0-9a-f]{6});/g)].map((match) => [match[1], match[2]]),
    )
    for (const background of ['bg', 'raised']) {
      for (const text of ['ink', 'body', 'muted', 'accent']) {
        it(`${text} on ${background} meets normal-text AA contrast`, () => {
          expect(contrast(tokens[text]!, tokens[background]!)).toBeGreaterThanOrEqual(4.5)
        })
      }
      for (const text of ['ink', 'body', 'muted']) {
        it(`dimmed ${text} remains readable on ${background}`, () => {
          expect(contrast(tokens[text]!, tokens[background]!, 0.9)).toBeGreaterThanOrEqual(4.5)
        })
      }
    }
  })
}
