import AxeBuilder from '@axe-core/playwright'
import { test, expect, waitForHydration } from './test-utils'
import { a11yScenarios } from './a11y-scenarios'

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 390]) {
    test.describe(`${theme} ${width}px accessibility`, () => {
      test.use({ colorScheme: theme, viewport: { width, height: 1000 } })
      for (const scenario of a11yScenarios) {
        test(scenario.name, async ({ page }, testInfo) => {
          await page.goto(scenario.route)
          await waitForHydration(page)
          if (scenario.name === 'finder') {
            await page.keyboard.press('/')
            await expect(page.getByRole('combobox')).toBeFocused()
            await expect(page.locator('.finder-input')).toHaveCSS('outline-style', 'solid')
            await expect(page.locator('.finder-input')).toHaveCSS('outline-width', '2px')
            await page.getByRole('combobox').fill('麦克风')
            await expect(page.getByRole('option').first()).toBeVisible()
          }
          for (const [component, selector] of Object.entries(scenario.components)) {
            const element = page.locator(selector).first()
            await expect(element, `${component} must actually render in this audit`).toBeAttached()
            if (!(component === 'ArticleRail.vue' && width === 390))
              await expect(element).toBeVisible()
          }
          await page.evaluate(() => document.fonts.ready)
          const audit = async (state: string) => {
            const results = await new AxeBuilder({ page }).analyze()
            await testInfo.attach(`axe-${state}`, {
              body: JSON.stringify(results, null, 2),
              contentType: 'application/json',
            })
            expect(
              results.violations.map(({ id, nodes }) => ({
                id,
                nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
              })),
              `${scenario.name}: ${state}`,
            ).toEqual([])
          }
          await audit('initial')
          if (scenario.name === 'journal') {
            if (width === 390) {
              await page.getByRole('button', { name: 'Navigation menu' }).click()
              await expect(
                page.getByRole('navigation', { name: 'Mobile navigation' }),
              ).toBeVisible()
              await audit('mobile-menu')
              await page.getByRole('button', { name: 'Navigation menu' }).click()
              await page.getByRole('button', { name: 'More categories' }).click()
              await expect(page.getByRole('menu')).toBeVisible()
              await audit('category-menu')
              await page.keyboard.press('Escape')
            }
            await page.getByRole('button', { name: 'Search posts' }).click()
            await page.getByRole('searchbox').fill('nothingmatchesxyz')
            await audit('empty-inline-search')
            await page.getByRole('tab', { name: /GauzMem/ }).focus()
            await page.keyboard.press('Enter')
            await audit('focused-workbench')
          }
          if (scenario.name === 'finder') {
            await page.getByRole('combobox').fill('nothingmatchesxyz')
            await expect(page.getByRole('option')).toHaveCount(0)
            await audit('empty-finder')
          }
        })
      }
    })
  }
}

test('axe detects an unlabeled control (negative control)', async ({ page }) => {
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>Audit probe</title></head><body><main><h1>Probe</h1><button></button></main></body></html>',
  )
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map(({ id }) => id)).toContain('button-name')
})
