# Fightheyyy

Personal blog with two presentations: **Editorial** and **Minimal**.

- Editorial: spacious article index, project showcase, Terminal, and animated XIAOBA mascots.
- Minimal: the original blog, with matching navigation and a switch back to Editorial.
- Every homepage visit or refresh randomly selects either presentation with equal probability. Manual switches apply once; no choice is saved.

## Develop

Use Node.js 24 and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Local preview: `http://127.0.0.1:5240/`. Open `/?view=editorial` or `/classic/index.html?view=minimal` to choose explicitly.

## Content and design

Articles: `content/blog/`. Project data: `shared/projects.ts`. Site identity: `shared/site.ts`. Original HTML pages: `public/classic/`. Homepage entry selection: `public/entry.js`.

See [migration notes](docs/MIGRATION.md) for the original-blog import workflow. Legacy article URLs remain available and redirect to the current articles.

Pageview collection and its Cloudflare deployment are described in [analytics setup](docs/analytics.md). Both presentations share one counter; no demo counts are shown.

## Publish

Pushes to `main` run the GitHub Pages workflow, which installs dependencies, generates `.output/public/`, and publishes that directory. GitHub Pages must use **GitHub Actions** as its source.

## Credits

The Editorial presentation is based on [alexanderop/nuxt-editorial-starter](https://github.com/alexanderop/nuxt-editorial-starter), under the retained MIT [license](LICENSE). The animated cat comes from [XIAOBA](https://github.com/fightheyyy/XIAOBA); its provenance and third-party notices are in `public/mascot/xiaoba/`. Self-hosted font licenses are retained with their assets.
