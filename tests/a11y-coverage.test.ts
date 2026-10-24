import { readFileSync, readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import { a11yScenarios } from './e2e/a11y-scenarios'

it('assigns every Vue component to an executed axe scenario with no stale entries', () => {
  const components = readdirSync(new URL('../app/components', import.meta.url), { recursive: true })
    .filter((file): file is string => typeof file === 'string' && file.endsWith('.vue'))
    .map((file) => file.replaceAll('\\', '/'))
    .sort()
  const covered = [
    ...new Set(a11yScenarios.flatMap((scenario) => Object.keys(scenario.components))),
  ].sort()
  expect(covered).toEqual(components)
})

it('keeps the automatic hydration guard on every application browser spec', () => {
  const specs = readdirSync(new URL('./e2e', import.meta.url)).filter((file) =>
    file.endsWith('.spec.ts'),
  )
  for (const spec of specs) {
    if (spec === 'hydration-detector.spec.ts') continue // This one intentionally triggers a mismatch.
    const source = readFileSync(new URL(`./e2e/${spec}`, import.meta.url), 'utf8')
    expect(source, `${spec} must use the guarded test fixture`).toMatch(
      /import\s*\{[^}]*\btest\b[^}]*\}\s*from ['"]\.\/test-utils['"]/,
    )
  }
})
