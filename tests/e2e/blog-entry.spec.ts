import { expect, test } from './test-utils'

test('homepage stays Editorial until the reader manually switches to Minimal', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.home-feed')).toBeVisible()
  await page.reload()
  await expect(page.locator('.home-feed')).toBeVisible()
  await page.getByRole('link', { name: 'Switch to the minimal blog' }).press('Enter')
  await expect(page).toHaveURL(/\/classic\/index.html$/)
  await expect(page.locator('.personal-home')).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/classic\/index.html$/)
  await page.getByRole('link', { name: 'Switch to the editorial blog' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5241/')
  await expect(page.locator('.home-feed')).toBeVisible()
})
