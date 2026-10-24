// Deliberate negative control: use raw Playwright because this page MUST emit a mismatch.
import { test, expect } from '@playwright/test'
import { isHydrationMismatch, waitForHydration } from './test-utils'

test('the detector catches a real server/client node mismatch', async ({ page }) => {
  const mismatches: string[] = []
  page.on('console', (message) => {
    if (isHydrationMismatch(message.text())) mismatches.push(message.text())
  })
  await page.route('**/about', async (route) => {
    const response = await route.fetch()
    const html = await response.text()
    expect(html).toContain('<main id="main"')
    await route.fulfill({
      response,
      body: html.replace('<main id="main"', '<section id="main"').replace('</main>', '</section>'),
    })
  })
  await page.goto('/about')
  await waitForHydration(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fightheyyy.')
  expect(mismatches.length).toBeGreaterThan(0)
})
