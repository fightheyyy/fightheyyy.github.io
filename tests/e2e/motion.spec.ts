import { expect, test } from './test-utils'

test.use({ reducedMotion: 'no-preference' })

async function opacity(locator: import('@playwright/test').Locator) {
  return locator.evaluate((element) => Number(getComputedStyle(element).opacity))
}

test('first visit types the wordmark, settles, and does not replay on return', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('main')).toHaveClass(/home-intro/)
  await expect(page.locator('main')).not.toHaveClass(/home-intro/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Start reading', exact: true }).click()
  await page.getByRole('link', { name: 'Fightheyyy home' }).click()
  await expect(page.locator('main')).not.toHaveClass(/home-intro/)
  await page.reload()
  await expect(page.locator('main')).not.toHaveClass(/home-intro/)
  expect(errors).toEqual([])
})

test('normal motion releases post opacity after entrance, filtering, and load more', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('main')).not.toHaveClass(/home-intro/)
  const rows = page.locator('.home-feed .post-row')
  await rows.nth(1).hover()
  await expect.poll(() => opacity(rows.first())).toBe(0.9)
  await expect.poll(() => opacity(rows.nth(1))).toBe(1)
  await page.getByRole('heading', { level: 1 }).hover()
  await expect.poll(() => opacity(rows.first())).toBe(1)
  await page.getByRole('button', { name: 'Agents', exact: true }).click()
  await rows.first().hover()
  await expect.poll(() => opacity(rows.nth(1))).toBe(0.9)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(rows).toHaveCount(7)
  await rows.last().hover()
  await expect.poll(() => opacity(rows.nth(5))).toBe(0.9)
  await page.keyboard.press('Tab')
  await rows.first().focus()
  await expect.poll(() => opacity(rows.nth(1))).toBe(0.9)
})

test('footer and workbench hover highlight independently of selection', async ({ page }) => {
  await page.goto('/')
  const tabs = page.getByRole('tablist', { name: 'Visual notes' }).getByRole('tab')
  await tabs.nth(1).hover()
  await expect.poll(() => opacity(tabs.first())).toBe(0.9)
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await expect.poll(() => opacity(tabs.nth(1).locator('.workbench-arrow'))).toBe(1)
  await tabs.nth(1).click()
  await page.getByRole('heading', { name: 'From the workbench' }).hover()
  await expect.poll(() => opacity(tabs.first())).toBe(1)
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  const footer = page.locator('.footer-grid')
  await footer.getByRole('link', { name: 'GitHub ↗', exact: true }).hover()
  await expect
    .poll(() => opacity(footer.getByRole('link', { name: 'Journal', exact: true })))
    .toBe(0.9)
  await page.keyboard.press('Tab')
  await footer.getByRole('button', { name: 'Find a note' }).focus()
  await expect
    .poll(() => opacity(footer.getByRole('link', { name: 'GitHub ↗', exact: true })))
    .toBe(0.9)
})

test('article entrance plays on direct visits and article-to-article navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener('animationstart', (event) => {
      if (event.animationName !== 'article-enter') return
      const target = event.target
      if (target instanceof HTMLElement && target.tagName === 'H1')
        target.dataset.entranceObserved = 'true'
    })
  })
  await page.goto('/blog/voice-agent-embodied-harness')
  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toHaveAttribute('data-entrance-observed', 'true')
  await expect.poll(() => opacity(title)).toBe(1)
  await expect(title).toHaveCSS('transform', 'none')
  await page.getByRole('region', { name: 'Keep exploring' }).getByRole('link').first().click()
  await expect(title).toHaveText('Catena：我为什么把 Agent 进化拆成端和云')
  await expect(title).toHaveAttribute('data-entrance-observed', 'true')
  await expect.poll(() => opacity(title)).toBe(1)
  await page.getByRole('link', { name: 'Fightheyyy home' }).click()
  await page.getByRole('link', { name: 'Start reading', exact: true }).click()
  await expect(title).toHaveText('把 Voice Agent 接进机器人：一套 Harness 的真机演进记录')
  await expect(title).toHaveAttribute('data-entrance-observed', 'true')
  await expect.poll(() => opacity(title)).toBe(1)
})

test('reduced motion skips article entrance and deep links remain readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/blog/voice-agent-embodied-harness#先查麦克风为什么几乎全是静音')
  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toHaveCSS('animation-name', 'none')
  await expect(title).toHaveCSS('opacity', '1')
  await expect(
    page.getByRole('heading', { name: '先查麦克风为什么几乎全是静音', exact: true }),
  ).toBeInViewport()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
