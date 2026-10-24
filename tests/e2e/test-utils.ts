import { expect, test as base, type ConsoleMessage, type Page } from '@playwright/test'

// Match both Vue's production summary and detailed development/debug messages.
export const isHydrationMismatch = (message: string) => /hydration[\s\S]*mismatch/i.test(message)

export async function waitForHydration(page: Page) {
  // Inspect Nuxt's mounted Vue application, without shipping a test-only app plugin.
  await page.waitForFunction(() => {
    const root = document.querySelector('#__nuxt') as
      | (Element & {
          __vue_app__?: { $nuxt?: { isHydrating: boolean } }
        })
      | null
    return root?.__vue_app__?.$nuxt?.isHydrating === false
  })
}

export const test = base.extend<{ hydrationGuard: void }>({
  hydrationGuard: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = []
      const onConsole = (message: ConsoleMessage) => {
        if (isHydrationMismatch(message.text())) errors.push(message.text())
      }
      page.on('console', onConsole)
      await use()
      page.off('console', onConsole)
      if (errors.length)
        await testInfo.attach('hydration-errors', {
          body: errors.join('\n'),
          contentType: 'text/plain',
        })
      expect(errors, 'Vue hydration mismatches occurred during this journey').toEqual([])
    },
    { auto: true },
  ],
})
export { expect }
