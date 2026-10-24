import { readFile, writeFile, readdir, mkdir, cp, rename } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'cheerio'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const source = path.resolve(process.argv[2] || '../fightheyyy.github.io')
const root = path.resolve(import.meta.dirname, '..')
const contentDir = path.join(root, 'content/blog')
const classic = path.join(root, 'public/classic')
await mkdir(classic, { recursive: true })
for (const name of ['index.html', 'styles.css', 'script.js', 'assets', 'posts']) {
  await cp(path.join(source, name), path.join(classic, name), { recursive: true })
}
// The archive remains the original presentation, independent of the new app.
for (const name of ['index.html', ...(await readdir(path.join(classic, 'posts'))).filter(n => n.endsWith('.html')).map(n => `posts/${n}`)]) {
  const file = path.join(classic, name)
  const html = await readFile(file, 'utf8')
  const home = name === 'index.html'
  const icon = `${home ? '../' : '../../'}mascot/xiaoba/logo.svg?v=solid-cobalt-white-v4`
  await writeFile(file, html
    .replace(/\s*<link[^>]+dev-theme\.css[^>]*>/g, '')
    .replace(/\s*<script[^>]+dev-theme\.js[^>]*><\/script>/g, '')
    .replace(/<title>([\s\S]*?)<\/title>/, (_match, title) => `<title>${home ? 'Home' : title.replace(/ — (?:Fightheyyy|fightheyyy\.dev)$/, '')} — fightheyyy.dev</title>`)
    .replace(/<link\b[^>]*\brel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="${icon}" />`))
}
const slugNames = (await readdir(path.join(source, 'posts'))).filter(n => n.endsWith('.html'))
// Keep upstream samples as editable references outside the published collection.
const samples = path.join(root, 'docs/upstream-samples')
await mkdir(samples, { recursive: true })
for (const name of await readdir(contentDir)) {
  if (name.endsWith('.md') && !slugNames.includes(name.replace(/\.md$/, '.html'))) {
    await rename(path.join(contentDir, name), path.join(samples, name))
  }
}
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
td.use(gfm)
td.addRule('code', {
  filter: 'pre',
  replacement: (_content, node) => `\n\n\`\`\`text\n${node.textContent.trim()}\n\`\`\`\n\n`,
})
td.addRule('figureCaption', { filter: 'figcaption', replacement: value => `\n\n*${value.trim()}*\n\n` })
td.addRule('callout', {
  filter: node => node.nodeName === 'ASIDE' && node.classList.contains('article-callout'),
  replacement: (value, node) => `\n\n::callout\n---\ntitle: ${JSON.stringify(node.getAttribute('aria-label') || '现场笔记')}\n---\n${value.trim()}\n::\n\n`,
})
td.addRule('figure', {
  filter: node => node.nodeName === 'FIGURE',
  replacement: (_value, node) => {
    const copy = node.cloneNode(true)
    const caption = copy.querySelector('figcaption')
    const label = caption?.textContent.replace(/\s+/g, ' ').trim() || '文章插图'
    caption?.remove()
    return `\n\n::note-figure\n---\ncaption: ${JSON.stringify(label)}\nlabel: FIG.\n---\n${td.turndown(copy.innerHTML)}\n::\n\n`
  },
})
const summary = []
for (const file of slugNames) {
  const slug = file.replace(/\.html$/, '')
  const $ = load(await readFile(path.join(source, 'posts', file), 'utf8'))
  const header = $('.article-header')
  const title = $('meta[property="og:title"]').attr('content') || $('title').text()
  const kicker = header.find('.article-kicker').text().trim()
  const category = /voice|robot/i.test(kicker) ? 'Hardware' : /\bevals?\b/i.test(kicker) ? 'Evals' : /supercoding/i.test(kicker) ? 'Skills' : 'Agents'
  const article = $('.article-content').clone()
  article.find('script,style,button').remove()
  article.find('img').each((_, img) => {
    const src = $(img).attr('src')
    if (src?.startsWith('../')) $(img).attr('src', `/classic/${src.slice(3)}`)
  })
  article.find('a').each((_, link) => {
    const href = $(link).attr('href')
    if (!href || /^(https?:|mailto:|#)/.test(href)) return
    if (href.startsWith('../assets/')) $(link).attr('href', `/classic/${href.slice(3)}`)
    else if (href.endsWith('.html') && !href.includes('index.html')) $(link).attr('href', `/blog/${path.basename(href, '.html')}`)
    else if (href.includes('index.html')) $(link).attr('href', '/')
  })
  // Preserve original SVG illustrations as standalone images.
  let count = 0
  for (const svg of article.find('svg').toArray()) {
    const asset = `${slug}-${++count}.svg`
    const dir = path.join(root, 'public/illustrations')
    await mkdir(dir, { recursive: true })
    $(svg).attr('xmlns', 'http://www.w3.org/2000/svg')
    await writeFile(path.join(dir, asset), $.html(svg))
    $(svg).replaceWith($('<img>').attr('src', `/illustrations/${asset}`).attr('alt', $(svg).attr('aria-label') || '文章示意图'))
  }
  const metadata = {
    title, description: header.find('.article-deck').text().replace(/\s+/g, ' ').trim() || $('meta[name="description"]').attr('content'),
    date: $('meta[property="article:published_time"]').attr('content'), author: 'Fightheyyy', category,
    tags: kicker.split(/[·/]/).map(s => s.trim()).filter(Boolean), featured: slug === 'voice-agent-embodied-harness', draft: false,
    readingMinutes: Number(header.find('.article-meta').text().match(/(\d+)\s*分钟/)?.[1] || 8),
  }
  const frontmatter = Object.entries(metadata).map(([key,value]) => `${key}: ${JSON.stringify(value)}`).join('\n')
  const body = td.turndown(article.html() || '')
  await writeFile(path.join(contentDir, `${slug}.md`), `---\n${frontmatter}\n---\n\n${body}\n\n---\n\n[查看原版文章及交互图表](/classic/posts/${file})\n`)
  summary.push({ slug, category, title, headings: article.find('h2,h3').length, images: article.find('img').length })
}
await writeFile(path.join(root, 'docs/import-report.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(`Imported ${summary.length} articles; original pages and assets preserved in public/classic.`)
