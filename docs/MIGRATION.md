# Fightheyyy Dev theme

Based on [alexanderop/nuxt-editorial-starter](https://github.com/alexanderop/nuxt-editorial-starter), MIT. The upstream license is retained in `LICENSE`; the Git remote is named `upstream`.

The seven articles are in `content/blog/`. Site identity and categories are in `shared/site.ts`; project data is shared through `shared/projects.ts`, ordered by creation date. The original HTML blog and its assets are retained at `public/classic/` and exposed under `/classic/`, with a shared navigation header.

The header labels the two presentations **Editorial** and **Minimal**. `public/entry.js` chooses either presentation equally on every homepage load, including refreshes of the Minimal homepage. Explicit switches (`?view=editorial` and `/classic/index.html?view=minimal`) apply only to that navigation; the hint is immediately removed from the address bar. Redirects carry the same one-use hint to avoid drawing twice. No choice is saved, and preferences from the previous version are removed. Direct article and Terminal URLs bypass the random choice. Without JavaScript, the homepage remains a complete editorial page.

The XIAOBA mascot uses its original Canvas renderer and expression geometry, pinned to the upstream revision in `public/mascot/xiaoba/SOURCE.md`. It is a procedural animated cat, not a Cubism Live2D model. Runtime scripts, logo, manifest and required Apache/BSD notices are self-hosted in that directory. `XiaobaMascot.vue` loads the assets once, pauses animation off-screen and in background tabs, and honors reduced-motion preferences. No XIAOBA agent backend is contacted.

## Preview and publishable output

```powershell
pnpm install --frozen-lockfile
pnpm generate
node scripts/check-static.mjs
pnpm preview
```

Preview: `http://127.0.0.1:5240/`. Static hosting output: `.output/public/`. GitHub Actions generates this output and deploys it to GitHub Pages on pushes to `main`. The previous local blog and authoring studio remain in the sibling `fightheyyy.github.io` directory. Legacy `/posts/*.html` links redirect to the corresponding editorial articles; original asset URLs remain available.

## Importing from the existing editor

The previous editor can continue saving HTML in the original blog. To refresh this theme from those files:

```powershell
node scripts/import-blog.mjs ../fightheyyy.github.io
pnpm generate
```

Importing replaces the seven generated Markdown files and the `/classic/` copy. Edit either the original HTML via Studio and reimport, or maintain the Markdown directly; reimporting overwrites direct Markdown edits. The import report in `docs/import-report.json` lists migrated headings and images. Custom interactive diagrams remain accessible through each article's original-page link.

## Verification

The browser journeys now use the personal articles. Static preview and test servers work on Windows. The original screenshot baselines are macOS images of upstream demo content; intentional replacement baselines must be reviewed on macOS before enabling the upstream visual deployment gate for this publication.
