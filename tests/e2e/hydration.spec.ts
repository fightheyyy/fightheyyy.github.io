import { readdirSync } from 'node:fs'
import { test, expect, waitForHydration } from './test-utils'

const articles = readdirSync(new URL('../../content/blog/', import.meta.url))
  .filter((name) => name.endsWith('.md'))
  .map((name) => `/blog/${name.slice(0, -3)}`)
const routes = ['/', '/about', '/start', ...articles]

for (const preference of ['fresh', 'light', 'dark'] as const) {
  for (const route of routes) {
    test(`hydrates ${route} with ${preference} preferences`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: preference === 'light' ? 'dark' : 'light' })
      if (preference !== 'fresh')
        await page.addInitScript((theme) => {
          localStorage.setItem('nuxt-color-mode', theme)
        }, preference)
      const response = await page.goto(route)
      expect(response?.status()).toBe(200)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (preference !== 'fresh')
        await expect(page.locator('html')).toHaveClass(new RegExp(preference))
      // Prove events are attached after SSR, not merely that server HTML is visible.
      await page.keyboard.press('/')
      await expect(page.getByRole('combobox', { name: 'Search the journal' })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
    })
  }
}
