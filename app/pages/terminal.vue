<script setup lang="ts">
import { formatDate, orderPosts, publicUrl, type PostSummary } from '~~/shared/editorial'
import { site } from '~~/shared/site'
import { projects } from '~~/shared/projects'

const config = useRuntimeConfig()
const { data: posts, error } = await usePublishedPosts()
const ordered = computed(() => orderPosts(posts.value ?? []))
const category = ref('All')
const listing = computed(() => ordered.value.filter(post => category.value === 'All' || post.category === category.value))
const featured = computed(() => category.value === 'All' ? listing.value.slice(0, 3) : [])
const remaining = computed(() => category.value === 'All' ? listing.value.slice(3) : listing.value)
const lastListing = ref<PostSummary[]>([])
watch(listing, value => { lastListing.value = [...value] }, { immediate: true })
const input = ref('')
const prompt = useTemplateRef<HTMLInputElement>('prompt')
const bottom = useTemplateRef<HTMLElement>('bottom')
const history = ref<string[]>([])
const historyIndex = ref(0)
let historyDraft = ''
const menuDismissed = ref(false)
const selection = ref(0)
const commands = [
  { name: '/help', hint: '显示全部命令', example: '/help' },
  { name: '/posts', hint: '列出文章', example: '/posts' },
  { name: '/read', hint: '打开上次列表中的文章 /read 1', example: '/read ' },
  { name: '/projects', hint: '列出项目', example: '/projects' },
  { name: '/project', hint: '打开项目介绍 /project 1', example: '/project ' },
  { name: '/search', hint: '搜索文章 /search memory', example: '/search ' },
  { name: '/whoami', hint: '个人介绍与联系方式', example: '/whoami' },
  { name: '/home', hint: '返回首页', example: '/home' },
  { name: '/clear', hint: '清空命令记录', example: '/clear' },
]
const suggestions = computed(() => menuDismissed.value || !/^\/[a-z]*$/i.test(input.value) ? [] : commands.filter(command => command.name.startsWith(input.value.toLowerCase())))
watch(input, () => { menuDismissed.value = false; selection.value = 0 }, { flush: 'sync' })
type Row = { text: string; path?: string; hint?: string }
type Entry = { id: number; command: string; lines?: string[]; rows?: Row[]; help?: boolean }
const entries = ref<Entry[]>([])
let sequence = 0

const glyphs: Record<string, string[]> = {
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  G: ['01110','10001','10000','10111','10001','10001','01110'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  '.': ['00','00','00','00','00','11','11'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
}
// Draw the character grid directly: Unicode shading and block glyphs can
// fall back to fonts with different widths, breaking the letter shapes.
let wordmarkWidth = 0
const wordmarkLetters = [...'FIGHTHEYYY.DEV'].map(letter => {
  const rows = glyphs[letter] ?? glyphs.F!
  const x = wordmarkWidth
  wordmarkWidth += rows[0]!.length + 1.5
  return { rows, x }
})
wordmarkWidth -= 1.5
const wordmarkRows = Array.from({ length: 7 }, (_, row) => wordmarkLetters.flatMap(({ rows, x }) =>
  [...rows[row]!].flatMap((pixel, column) => pixel === '1' ? [`M${x + column},${row}h1v1h-1z`] : []),
).join(' '))

useSeoMeta({ title: 'Terminal', description: '以终端方式浏览 Fightheyyy 的文章、项目与笔记。' })
useHead({ link: [{ rel: 'canonical', href: publicUrl('/terminal', config.public.siteUrl) }] })

async function revealPrompt(focus = true) {
  await nextTick()
  bottom.value?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  if (focus) prompt.value?.focus({ preventScroll: true })
}
async function choose(example: string) {
  if (example.endsWith(' ')) { input.value = example; await revealPrompt(); return }
  await run(example)
}
async function run(value = input.value) {
  const raw = value.trim()
  if (!raw) return
  history.value.push(raw)
  historyIndex.value = history.value.length
  input.value = ''
  menuDismissed.value = true
  const [command = '', ...args] = raw.split(/\s+/)
  const argument = args.join(' ')
  const entry: Entry = { id: ++sequence, command: raw }
  switch (command.toLowerCase()) {
    case '/help': entry.help = true; break
    case '/posts':
      lastListing.value = [...listing.value]
      entry.rows = lastListing.value.map((post, i) => ({ text: `${String(i + 1).padStart(2, '0')}  ${post.title}`, path: post.path, hint: `${post.readingMinutes} min` }))
      entry.lines = [`${entry.rows.length} 篇文章 · 输入 /read <编号> 打开。`]
      break
    case '/search': {
      if (!argument) { entry.lines = ['用法：/search <关键词>，例如 /search memory']; break }
      const terms = argument.toLocaleLowerCase().split(/\s+/)
      lastListing.value = ordered.value.filter(post => terms.every(term => [post.title, post.description, post.category, ...post.tags].join(' ').toLocaleLowerCase().includes(term)))
      entry.rows = lastListing.value.map((post, i) => ({ text: `${String(i + 1).padStart(2, '0')}  ${post.title}`, path: post.path, hint: `${post.readingMinutes} min` }))
      entry.lines = [entry.rows.length ? `找到 ${entry.rows.length} 篇文章 · /read <编号> 打开。` : `没有找到“${argument}”，试试其他关键词。`]
      break
    }
    case '/read': {
      const index = /^\d+$/.test(argument) ? Number(argument) - 1 : -1
      const post = lastListing.value[index]
      if (post) { await navigateTo(post.path); return }
      entry.lines = [lastListing.value.length ? `请输入上次列表中的编号：/read 1 至 /read ${lastListing.value.length}` : '上次搜索没有结果，先输入 /posts 查看文章。']
      break
    }
    case '/projects':
      entry.rows = projects.map((project, i) => ({ text: `${String(i + 1).padStart(2, '0')}  ${project.title}`, path: project.path || '/start', hint: project.category }))
      entry.lines = [`${projects.length} 个项目 · XIAOBA 为主项目。输入 /project <编号或名称> 查看介绍。`]
      break
    case '/project': {
      const project = /^\d+$/.test(argument) ? projects[Number(argument) - 1] : projects.find(item => item.title.toLowerCase() === argument.toLowerCase())
      if (!project) { entry.lines = ['用法：/project 1 或 /project XIAOBA。输入 /projects 查看列表。']; break }
      entry.lines = [project.title, project.category, project.text, project.stack]
      entry.rows = [{ text: 'GitHub ↗', path: project.github }, ...(project.path ? [{ text: '阅读项目笔记 →', path: project.path }] : [])]
      break
    }
    case '/about':
    case '/whoami':
      entry.lines = ['Fightheyyy', site.description, 'Runtime, evaluation, memory, and hardware.']
      entry.rows = [{ text: '首页介绍 →', path: '/#intro' }, { text: 'GitHub ↗', path: 'https://github.com/fightheyyy' }, { text: '联系我 ↗', path: 'mailto:704159620@qq.com' }]
      break
    case '/home': await navigateTo('/'); return
    case '/clear': entries.value = []; await revealPrompt(); return
    default: entry.lines = [`未知命令：${command}。输入 /help 查看可用命令，或 /search <关键词> 搜索文章。`]
  }
  entries.value.push(entry)
  await revealPrompt()
}
function keydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape') { menuDismissed.value = true; return }
  if (event.key === 'Tab' && suggestions.value.length) {
    event.preventDefault(); input.value = suggestions.value[selection.value]?.example ?? ''; menuDismissed.value = true; return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    if (suggestions.value.length) {
      selection.value = (selection.value + direction + suggestions.value.length) % suggestions.value.length
      void nextTick(() => document.getElementById(`command-${selection.value}`)?.scrollIntoView({ block: 'nearest' }))
    }
    else {
      if (historyIndex.value === history.value.length) historyDraft = input.value
      historyIndex.value = Math.max(0, Math.min(history.value.length, historyIndex.value + direction))
      input.value = historyIndex.value === history.value.length ? historyDraft : history.value[historyIndex.value] ?? ''
      menuDismissed.value = true
    }
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const suggestion = suggestions.value[selection.value]
    if (suggestion && input.value !== suggestion.name) void choose(suggestion.example)
    else void run()
  }
}
function shortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable]'))) return
  const destinations: Record<string, string> = { h:'/', b:'/#blog', p:'/#projects' }
  if (destinations[event.key.toLowerCase()]) { event.preventDefault(); void navigateTo(destinations[event.key.toLowerCase()]!); return }
  if (event.key === '/' || event.key.toLowerCase() === 't') { event.preventDefault(); prompt.value?.focus(); if (event.key === '/') input.value = '/' }
}
onMounted(() => {
  window.addEventListener('keydown', shortcut)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) prompt.value?.focus({ preventScroll:true })
})
onBeforeUnmount(() => window.removeEventListener('keydown', shortcut))
</script>

<template>
  <div class="terminal-shell">
    <aside class="terminal-sidebar" aria-label="站点导航">
      <NuxtLink to="/" class="terminal-brand" :aria-label="`${site.name} home`"><XiaobaMascot :size="64" /></NuxtLink>
      <nav aria-label="Terminal navigation">
        <NuxtLink to="/">[H] HOME</NuxtLink>
        <NuxtLink to="/#blog">[B] BLOG</NuxtLink>
        <NuxtLink to="/#projects">[P] PROJECTS</NuxtLink>
        <NuxtLink to="/terminal" aria-current="page">[T] TERMINAL</NuxtLink>
      </nav>
      <ConnectMenu />
    </aside>
    <main id="main" class="terminal-main" tabindex="-1">
      <header class="terminal-intro">
        <h1 class="sr-only">{{ site.wordmark }} / Terminal</h1>
        <div class="terminal-wordmark" aria-hidden="true">
          <svg :viewBox="`0 0 ${wordmarkWidth} 7`" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" focusable="false">
            <defs>
              <pattern id="terminal-dither-light" width=".3" height=".3" patternUnits="userSpaceOnUse">
                <rect width=".3" height=".3" fill="currentColor" opacity=".18" />
                <rect width=".13" height=".13" fill="currentColor" />
              </pattern>
              <pattern id="terminal-dither-medium" width=".25" height=".25" patternUnits="userSpaceOnUse">
                <rect width=".25" height=".25" fill="currentColor" opacity=".45" />
                <rect width=".15" height=".15" fill="currentColor" />
              </pattern>
            </defs>
            <path v-for="(row, index) in wordmarkRows" :key="index" :d="row" :fill="index < 2 ? 'url(#terminal-dither-light)' : index < 4 ? 'url(#terminal-dither-medium)' : 'currentColor'" />
          </svg>
        </div>
        <p>{{ site.description }}<br />输入 <button type="button" @click="run('/help')">/help</button> 探索命令，或直接点击文章开始阅读。</p>
      </header>
      <p v-if="error" role="alert">文章暂时无法加载，请刷新页面重试。</p>
      <section class="terminal-feed" aria-label="文章列表">
        <div v-if="featured.length" class="terminal-featured terminal-post-list">
          <NuxtLink v-for="(post, index) in featured" :key="post.path" :to="post.path" class="terminal-post">
            <span class="terminal-post-meta">Featured <span>{{ String(index + 1).padStart(2, '0') }}</span></span>
            <span class="terminal-post-title">{{ post.title }}</span><span class="terminal-post-time">{{ post.readingMinutes }} min</span>
          </NuxtLink>
        </div>
        <div class="terminal-categories" role="group" aria-label="文章分类">
          <button v-for="item in ['All', ...site.categories]" :key="item" type="button" :aria-pressed="category === item" @click="category = item">{{ item }}</button>
        </div>
        <div class="terminal-post-list">
          <NuxtLink v-for="(post, index) in remaining" :key="post.path" :to="post.path" class="terminal-post">
            <time class="terminal-post-meta" :datetime="post.date">{{ formatDate(post.date) }}</time><span class="terminal-post-title"><span class="terminal-row-number">{{ String(index + 1 + featured.length).padStart(2, '0') }} </span>{{ post.title }}</span><span class="terminal-post-time">{{ post.readingMinutes }} min</span>
          </NuxtLink>
        </div>
        <p class="terminal-feed-end"><button type="button" @click="run('/posts')">LIST ALL POSTS ↳</button><span>/read &lt;n&gt; to open</span></p>
      </section>
      <section class="terminal-scrollback" role="log" aria-label="命令输出" aria-live="polite" aria-relevant="additions">
        <article v-for="entry in entries" :key="entry.id" class="terminal-entry">
          <p class="terminal-command-echo"><span aria-hidden="true">&gt;</span> {{ entry.command }}</p>
          <div v-if="entry.help" class="terminal-help">
            <button v-for="command in commands" :key="command.name" type="button" @click="choose(command.example)"><span>{{ command.example.trim() }}</span><span>{{ command.hint }}</span></button>
          </div>
          <div v-if="entry.rows" class="terminal-results">
            <NuxtLink v-for="(row, index) in entry.rows" :key="index" :to="row.path || '/'" :external="/^(https?:|mailto:)/.test(row.path || '')"><span>{{ row.text }}</span><span v-if="row.hint">{{ row.hint }}</span></NuxtLink>
          </div>
          <p v-for="(line, index) in entry.lines" :key="index" class="terminal-response">{{ line }}</p>
        </article>
      </section>
      <div ref="bottom" class="terminal-input-area">
        <div v-if="suggestions.length" id="terminal-suggestions" class="terminal-suggestions" role="listbox" aria-label="命令建议">
          <button v-for="(command, index) in suggestions" :id="`command-${index}`" :key="command.name" type="button" role="option" :aria-selected="selection === index" tabindex="-1" @mousedown.prevent @mouseenter="selection = index" @click="choose(command.example)"><span>{{ command.name }}</span><span>{{ command.hint }}</span></button>
        </div>
        <form class="terminal-prompt" @submit.prevent="run()">
          <label for="terminal-input"><span class="terminal-user">guest@fightheyyy.dev</span> <span class="terminal-chevron">&gt;</span></label>
          <input id="terminal-input" ref="prompt" v-model="input" type="text" role="combobox" :aria-expanded="suggestions.length > 0" aria-controls="terminal-suggestions" :aria-activedescendant="suggestions.length ? `command-${selection}` : undefined" aria-autocomplete="list" aria-label="终端命令输入" placeholder="/help" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" @keydown="keydown" @blur="menuDismissed = true" @focus="menuDismissed = false" />
          <button type="submit" class="terminal-enter" aria-label="执行命令">↵</button>
        </form>
        <div class="terminal-hints"><span>↑↓ history / choose · Tab complete · Esc dismiss</span></div>
      </div>
    </main>
  </div>
</template>
