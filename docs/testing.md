# Browser verification

Run `pnpm verify` after behavior or layout changes. It runs code/design-system lint, strict type checking, unit tests, the production build, Playwright journeys, and visual comparisons. Do not run a dev server and a build concurrently: Nuxt generation is shared.

## Hydration

Adapted from the local `npmx-dev/npmx.dev` checkout's `test/e2e/hydration.spec.ts` and `test-utils.ts`: visit every published article plus the journal, about, and handbook with fresh storage and explicit light/dark preferences. Explicit preferences are tested against the opposite OS color scheme.

The automatic Playwright fixture in `tests/e2e/test-utils.ts` subscribes before navigation, catches Vue's production mismatch summary and detailed hydration messages, attaches diagnostics, and fails at teardown. Existing behavior, accessibility, and visual tests use this fixture too. `waitForHydration` checks the mounted Nuxt application's `isHydrating` flag rather than sleeping. Each matrix case also opens Finder from the keyboard to prove client handlers work.

`hydration-detector.spec.ts` is a deliberate negative control. It modifies the server response's main element before Vue hydrates, confirms the detector sees a real mismatch, and checks that the recovered page renders. It uses raw Playwright so the expected mismatch does not trip the automatic guard. There is no broken route or test-only plugin in production.

Run `pnpm test:hydration` against a fresh production build.

## Accessibility

The reference project's component axe audits and component-coverage gate are adapted to this starter's rendered production pages. Here, axe runs on the real styled page, including portals and document landmarks; it does not clone isolated components or disable page-level rules.

`tests/e2e/a11y.spec.ts` audits light/dark themes at desktop and narrow widths. It covers the journal, articles, handbook, about, error recovery, Finder, the mobile navigation and category menu, empty search states, workbench focus, and both media-tab panels. Full axe results are attached to the Playwright report. A deliberately unlabeled button verifies the detector actually reports violations.

`a11y-scenarios.ts` maps every Vue component to an executed audit and a DOM selector. The browser test asserts that those elements render, and the unit coverage check rejects missing or obsolete entries. The reading rail is intentionally hidden at narrow widths and is audited visibly on desktop. Add new components to a meaningful audit scenario; do not add a name merely to satisfy the inventory.

`tests/contrast.test.ts` separately checks semantic text/background pairs and dimmed states numerically. Axe checks rendered colors, code highlighting, document semantics, and keyboard-scrollable regions. Existing journeys continue to check keyboard navigation, focus restoration, theme persistence, table-of-contents navigation, and long content.

Run `pnpm test:a11y` against a fresh production build. Automated audits cannot prove complete accessibility; keyboard and visual review remain necessary.

## Visual regressions

`pnpm test:visual` compares 12 reviewed screenshots: journal, article, and open Finder at desktop/narrow widths in light/dark mode. Fonts must finish loading, motion is reduced, the locale/time zone are fixed, and the tests use a dedicated Playwright project. Screenshots are stored beside the spec in `tests/e2e/visual.spec.ts-snapshots`.

The initial baselines are macOS Chromium images. CI runs the visual project on `macos-15`; the Linux job runs the functional, hydration, and accessibility journeys. Deployment depends on both jobs. This avoids comparing Linux font rasterization against macOS baselines. Local Linux users can run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`; run visual comparisons on the baseline platform. Cross-platform baselines require a separately reviewed set, not a large pixel tolerance.

To deliberately update the macOS baseline after a design change:

```sh
pnpm build
pnpm test:visual:update
pnpm test:visual
```

Inspect every changed PNG and commit the reviewed images with the change. Never update baselines as a generic fix for a failed comparison. CI retains reports, traces, actual images, and diffs when checks fail. `pnpm test:e2e` and `pnpm test:visual` each own port 5241; run them sequentially.
