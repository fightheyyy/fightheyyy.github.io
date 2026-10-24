import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const output = '.output/public'
const search = JSON.parse(readFileSync(join(output, 'search.json'), 'utf8'))
const paths = [
  ...new Set(
    search
      .filter((section) => section.level === 1 && section.id.startsWith('/blog/'))
      .map((section) => section.id),
  ),
]
assert(paths.length > 0, 'Search must contain published articles')
const home = readFileSync(join(output, 'index.html'), 'utf8')
assert(home.includes('class="post-row'), 'Home must render the post feed in static HTML')
for (const path of paths) {
  const relative = path.replace(/^\//, '')
  assert(existsSync(join(output, relative, 'index.html')), `Missing article HTML: ${path}`)
  const markdown = readFileSync(join(output, 'markdown', `${relative}.md`), 'utf8')
  assert(markdown.includes('---'), `Missing Markdown: ${path}`)
}
for (const file of ['search.json', 'rss.xml', 'sitemap.xml']) {
  assert(
    !readFileSync(join(output, file), 'utf8').includes('Unpublished workshop'),
    `Draft leaked into ${file}`,
  )
}
const base = process.env.NUXT_APP_BASE_URL || '/'
assert(home.includes(`href="${base}favicon.svg"`), 'Favicon must respect the base path')
console.log(
  `Static output verified: ${paths.length} articles, Markdown, search, feeds, and base-path assets`,
)
