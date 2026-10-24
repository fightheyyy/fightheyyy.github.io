# Project instructions

This is a working Nuxt and Nuxt Content editorial starter. Read README.md. Support both Node hosting and static hosting under a repository base path.

- Use Nuxt, Nuxt Content, strict TypeScript, Vue Composition API, and pnpm.
- Preserve references/claude-dev as evidence; never use it as production assets.
- Use original branding, articles, and artwork. Keep self-hosted fonts and their installed license files.
- Keep native scrolling, the spatial grid, sticky reading sidebar, and reduced-motion support.
- Keep private drafts excluded from the collection and from every publication endpoint.
- Run pnpm verify for behavior changes. Check desktop and narrow browser views for layout changes.
- Browser journeys must cover keyboard search, long titles/code, theme persistence, and table-of-contents navigation.
- Avoid running development and production builds concurrently because they share generated .nuxt files.
- The term “comarok” is unconfirmed. Do not invent a package or silently substitute one.

- Keep static search, Markdown downloads, feeds, canonical URLs, and assets base-path aware. Test pnpm generate when changing deployment behavior.

## Design system

- Read `docs/design-system.md` before changing styles. Semantic tokens live in `app/assets/css/tokens.css`; do not invent one-off tokens to silence lint.
- Run `pnpm lint:design-system` for Vue/TypeScript class policy and CSS color policy. Keep this in `pnpm lint` and CI. Run `pnpm test:design-system` when changing enforcement.
- Shared controls live in `app/components/ui/`. Explicitly import them from `~/components/ui/...` or `@/components/ui/...` so lint can recognize their contracts; do not rely on Nuxt auto-imports for these controls.
- Shared controls own appearance. Callers may use layout utilities; add a reviewed component API when a new appearance is needed. Token rules still apply inside shared controls.
- Keep custom base/component styles in cascade layers. Use semantic color utilities and the canonical font variables. No raw palette colors or arbitrary utility values.
- Treat theme-resolution warnings as a failed verification, even if a tool exits successfully. CSS spacing scales, runtime expressions, contrast, and rendered layout still require review.

## Browser regression coverage

- Read `docs/testing.md`. Browser specs import `test` and `expect` from `tests/e2e/test-utils.ts` so the automatic hydration guard runs. Only deliberate detector tests may bypass it.
- New components need an exercised entry in `tests/e2e/a11y-scenarios.ts`; the coverage gate checks the inventory and browser audits check that the selected elements render. Do not disable axe rules to hide failures.
- Maintain readable text in both themes and hover/focus states. `faint` is decorative; normal text uses tested foreground/body/muted roles.
- Review visual baselines on macOS Chromium. Use `pnpm test:visual:update` only for intentional changes, inspect the PNGs, then run comparisons again. CI gates deployment on Linux journeys and macOS visuals.
