# Design system

The editorial design uses semantic CSS tokens and Tailwind 4 utilities. The existing spatial grid, prose styles, native scrolling, and motion remain custom CSS.

## Sources of truth

- `app/assets/css/tokens.css`: reviewed light/dark values, fonts, shadows, mask constants, and `@theme inline` mappings. Color utilities include `bg-surface`, `bg-raised`, `text-foreground`, `text-body`, `text-muted`, `border-border`, and `text-accent`. Pair `bg-action` with `text-action-foreground`.
- `app/assets/css/main.css`: Tailwind entry point, class-based dark variant, base defaults, and layered component styles. Use `var(--font-sans)` and `var(--font-mono)` for custom typography.
- `components.json`: explicit lint theme and UI-directory discovery; this does not install shadcn/ui.
- `app/components/ui/`: shared controls own appearance. `BaseButton` begins this rollout with the existing solid appearance. Add variants or sizes only when a real design calls for them.

The default Tailwind color palette is disabled. Add semantic roles deliberately rather than making a token per lint failure. Selection, overlays, and shadows have named values. SVG luminance-mask white/black values are theme-independent reveal/cutout constants, not foreground colors.

## Component contracts

Explicit imports are required for shared controls because the linter analyzes source imports, not Nuxt's generated auto-import registry:

```vue
<script setup lang="ts">
import BaseButton from '~/components/ui/BaseButton.vue'
</script>

<template>
  <BaseButton class="mt-4 w-full">Save</BaseButton>
</template>
```

Callers may change layout, including margin and width. Background, text appearance, padding, and radius belong to the component. `bg-accent` remains an illegal caller override even though it is a valid semantic color. Inside the UI directory `no-restyle` and `require-static-classes` are disabled; token and unknown-class rules remain enabled. Reka primitives are unstyled and are not treated as owned design-system controls.

## Checks

`pnpm lint:design-system` runs ESLint with `vue-eslint-parser` and `@shadcn/lint` for `app/**/*.vue`, plus TypeScript class helpers in `app` and `shared`. It enables `no-restyle`, `require-static-classes`, `no-raw-colors`, `no-arbitrary-values`, and `no-unknown-classes` as errors. Oxlint retains its existing script checks.

Stylelint separately rejects hex colors, named colors, and literal color functions in application CSS and Vue style blocks. Only the dedicated token file permits those definitions. `transparent`, `currentColor`, CSS variables, and gradients composed from tokens remain usable.

`pnpm test:design-system` runs positive and deliberately invalid source strings through the real configuration. It checks bound Vue classes, TypeScript helpers, shared-control overrides, theme utility resolution, unknown classes, and CSS literals. These probes are not production Vue files and cannot enter Nuxt's component registry.

Both lint stages run through `pnpm lint`, which is already required by CI and `pnpm verify`. After style or behavior changes, also run `pnpm verify` and inspect desktop and narrow views.

## Limits and review

These checks do not establish contrast, visual quality, or a finite spacing scale. Numeric Tailwind spacing utilities remain dynamic. Existing custom CSS dimensions are not converted into tokens merely to satisfy a check. Review recurring typography and spacing decisions when extending the design.

Imported/runtime class expressions and implicit Nuxt component imports can escape source analysis. Keep conditional utility strings complete. Review new tokens, exceptions, and disabled rules as design decisions. Theme-resolution warnings mean the unknown-class check may have fallen back to weaker checks; resolve them before trusting the run.

References: [Vue setup](https://github.com/shadcn-ui/lint/blob/main/docs/vue.md), [component contracts](https://github.com/shadcn-ui/lint/blob/main/docs/rules/no-restyle.md), and [Tailwind theme variables](https://tailwindcss.com/docs/theme).

## Readable states and shared controls

Normal text uses `foreground`, `body`, or `muted`; `faint` is reserved for decorative borders and patterns. Contrast tests cover text on both surface backgrounds in both themes, including the 90% opacity used for sibling de-emphasis. Text-bearing syntax highlighting uses Shiki's high-contrast GitHub themes. New hover/focus treatments must retain readable text.

`IconButton` requires a `label` and exposes a `tone` and compact sizing option. `ActionLink` renders a real Nuxt link with the same solid appearance as `BaseButton`. Use these controls for header actions and icon-only controls instead of reproducing their styling at call sites.

`require-static-classes` is enabled for shared controls and forwarding wrappers. Complete conditional layout strings remain valid; unresolved function results are rejected. The rule is disabled only inside `app/components/ui`, where components own their appearance. Token rules remain active there.
