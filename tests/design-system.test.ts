import { ESLint } from 'eslint'
import stylelint from 'stylelint'
import { describe, expect, it } from 'vitest'

const eslint = new ESLint()
async function lintTemplate(template: string, filePath = 'app/DesignSystemProbe.vue') {
  const [result] = await eslint.lintText(
    `<script setup lang="ts">import BaseButton from '~/components/ui/BaseButton.vue'</script><template>${template}</template>`,
    { filePath },
  )
  return result!.messages.map((message) => message.ruleId)
}

describe('design system policy using the real project configuration', () => {
  it('rejects palette colors and appearance overrides on imported shared components', async () => {
    const rules = await lintTemplate('<BaseButton class="bg-red-500">Save</BaseButton>')
    expect(rules).toContain('shadcn/no-raw-colors')
    expect(rules).toContain('shadcn/no-restyle')
  })

  it('rejects semantic appearance overrides too, but permits caller layout', async () => {
    expect(await lintTemplate('<BaseButton class="bg-accent">Save</BaseButton>')).toContain(
      'shadcn/no-restyle',
    )
    expect(await lintTemplate('<BaseButton class="mt-4 w-full">Save</BaseButton>')).toEqual([])
  })

  it('checks bound classes, arbitrary values, and unknown classes on plain elements', async () => {
    expect(await lintTemplate('<p :class="{ \'text-red-500\': true }">Warning</p>')).toContain(
      'shadcn/no-raw-colors',
    )
    expect(await lintTemplate('<div class="rounded-[13px]" />')).toContain(
      'shadcn/no-arbitrary-values',
    )
    expect(await lintTemplate('<div class="definitely-not-a-utility" />')).toContain(
      'shadcn/no-unknown-classes',
    )
  })

  it('resolves the actual theme and custom CSS, including inside shared components', async () => {
    expect(await lintTemplate('<p class="bg-surface text-foreground eyebrow">Note</p>')).toEqual([])
    expect(
      await lintTemplate(
        '<button class="bg-action text-action-foreground" />',
        'app/components/ui/Probe.vue',
      ),
    ).toEqual([])
    expect(
      await lintTemplate('<button class="bg-red-500" />', 'app/components/ui/Probe.vue'),
    ).toContain('shadcn/no-raw-colors')
  })

  it('rejects unresolved shared-control classes but accepts complete conditional layouts', async () => {
    expect(await lintTemplate('<BaseButton :class="getAppearance()">Save</BaseButton>')).toContain(
      'shadcn/require-static-classes',
    )
    expect(
      await lintTemplate("<BaseButton :class=\"wide ? 'w-full' : 'w-auto'\">Save</BaseButton>"),
    ).toEqual([])
  })

  it('checks class helpers in TypeScript', async () => {
    const [result] = await eslint.lintText('const classes = cn("bg-red-500")', {
      filePath: 'app/design-system-probe.ts',
    })
    expect(result!.messages.map((message) => message.ruleId)).toContain('shadcn/no-raw-colors')
  })

  it('rejects literal CSS colors outside tokens, including Vue style blocks', async () => {
    for (const [code, codeFilename] of [
      ['.example { color: #ff0000; }', 'app/assets/css/probe.css'],
      [
        '<template><p>Example</p></template><style scoped>p { color: red; }</style>',
        'app/Probe.vue',
      ],
    ]) {
      const result = await stylelint.lint({ code: code!, codeFilename: codeFilename! })
      expect(result.errored).toBe(true)
    }
    const tokens = await stylelint.lint({
      code: ':root { --accent: #bf6648; }',
      codeFilename: 'app/assets/css/tokens.css',
    })
    expect(tokens.errored).toBe(false)
  })
})
