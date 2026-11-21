import { expect, test, waitForHydration } from './test-utils'

const slugs = ['01-lexmount', '02-gauss', '03-xiaoba', '04-vibe-writing', '05-catena']

test('resume is absent from the public index and discovery endpoints', async ({
  page,
  request,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  await expect(page.getByRole('button', { name: 'resume', exact: true })).toHaveCount(0)
  await expect(page.locator('a[href^="/resume"]')).toHaveCount(0)
  for (const endpoint of ['/search.json', '/rss.xml', '/sitemap.xml']) {
    const response = await request.get(endpoint)
    expect(response.ok()).toBe(true)
    expect(await response.text()).not.toContain('/resume/')
  }
})

test('direct resume entry shows five notes, filters and returns home without revealing the category', async ({
  page,
}) => {
  await page.goto('/resume')
  await waitForHydration(page)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  const feed = page.locator('.home-feed')
  const category = feed.getByRole('button', { name: 'resume', exact: true })
  await expect(category).toHaveAttribute('aria-pressed', 'true')
  await expect(feed.locator('.post-row')).toHaveCount(5)
  await expect(feed.locator('.post-row').first()).toContainText('揽岳智能')
  await feed.getByRole('button', { name: 'All', exact: true }).click()
  await expect(feed.locator('.post-row')).toHaveCount(10)
  await feed.getByRole('button', { name: 'Load more' }).click()
  await expect(feed.locator('.post-row')).toHaveCount(11)
  await category.click()
  await feed.getByRole('button', { name: 'Agents', exact: true }).click()
  await expect(feed.locator('.post-row')).toHaveCount(3)
  await category.click()
  await feed.getByRole('button', { name: 'Search posts' }).click()
  await feed.getByRole('searchbox').fill('CATENA')
  await expect(feed.locator('.post-row')).toHaveCount(1)
  await feed.locator('.post-row').click()
  await expect(page).toHaveURL(/\/resume\/05-catena$/)
  await page.getByRole('link', { name: '返回 resume 复盘专栏' }).click()
  await expect(feed.locator('.post-row')).toHaveCount(5)
  await page.getByRole('link', { name: 'fightheyyy.dev home' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'resume', exact: true })).toHaveCount(0)
  await expect(page.locator('.home-feed .post-row')).toHaveCount(6)
})

for (const slug of slugs) {
  test(`resume ${slug} supports direct refresh, reading and Markdown`, async ({
    page,
    request,
  }) => {
    const response = await page.goto(`/resume/${slug}`)
    expect(response?.status()).toBe(200)
    await waitForHydration(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
    const link = page
      .getByRole('navigation', { name: 'Table of contents' })
      .getByRole('link')
      .nth(1)
    await link.click()
    await expect(link).toHaveAttribute('aria-current', 'location')
    const markdown = await request.get(`/markdown/resume/${slug}.md`)
    expect(markdown.ok()).toBe(true)
    expect(await markdown.text()).toContain('30 分钟闭卷拷打')
    for (const image of await page.locator('.prose img').all()) {
      await image.scrollIntoViewIfNeeded()
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0)
    }
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('narrow category menu can enter resume and unknown notes stay 404', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/resume')
  await page.getByRole('button', { name: 'More categories' }).click()
  await page.getByRole('menuitem', { name: 'resume', exact: false }).click()
  await expect(page.locator('.home-feed .post-row')).toHaveCount(5)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect((await request.get('/resume/missing-note')).status()).toBe(404)
  expect((await request.get('/blog/01-lexmount')).status()).toBe(404)
})

for (const preference of ['fresh', 'light', 'dark'] as const) {
  for (const path of ['/resume', ...slugs.map((slug) => `/resume/${slug}`)]) {
    test(`hydrates ${path} with ${preference} preferences`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: preference === 'light' ? 'dark' : 'light' })
      if (preference !== 'fresh')
        await page.addInitScript(
          (theme) => localStorage.setItem('nuxt-color-mode', theme),
          preference,
        )
      await page.goto('/')
      await waitForHydration(page)
      const publicTheme = await page.locator('html').getAttribute('class')
      expect((await page.goto(path))?.status()).toBe(200)
      await waitForHydration(page)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('class', publicTheme ?? '')
      // A real interaction verifies that the server-rendered route has mounted.
      if (path === '/resume') {
        await page
          .locator('.home-feed')
          .getByRole('button', { name: 'Agents', exact: true })
          .click()
        await expect(page.locator('.home-feed .post-row')).toHaveCount(3)
      } else {
        await page.getByRole('link', { name: '返回 resume 复盘专栏' }).click()
        await expect(page.locator('.home-feed .post-row')).toHaveCount(5)
      }
    })
  }
}

for (const slug of ['', ...slugs]) {
  test(`GitHub Pages trailing slash hydrates resume ${slug || 'index'}`, async ({ page }) => {
    expect((await page.goto(`/resume/${slug ? `${slug}/` : ''}`))?.status()).toBe(200)
    await waitForHydration(page)
    if (slug) await expect(page.locator('main.article-page')).toBeVisible()
    else await expect(page.locator('.home-feed .post-row')).toHaveCount(5)
    await page.reload()
    await waitForHydration(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
}
