import { test, expect, waitForHydration } from './test-utils'

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test.describe(`${theme} ${width}px visuals`, () => {
      test.use({ colorScheme: theme, viewport: { width, height: 1000 } })
      for (const view of ['journal', 'article', 'finder']) {
        test(view, async ({ page }) => {
          await page.goto(view === 'article' ? '/blog/voice-agent-embodied-harness' : '/')
          await waitForHydration(page)
          await page.evaluate(() => document.fonts.ready)
          if (view === 'finder') {
            await page.keyboard.press('/')
            await expect(page.getByRole('combobox')).toBeFocused()
            await page.getByRole('combobox').fill('麦克风')
            await expect(page.getByRole('option').first()).toBeVisible()
          }
          await expect(page).toHaveScreenshot(`${view}-${theme}-${width}.png`, {
            animations: 'disabled',
            maxDiffPixelRatio: 0.001,
          })
        })
      }
    })
  }
}
