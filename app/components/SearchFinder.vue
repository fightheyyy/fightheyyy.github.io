<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { site } from '~~/shared/site'
const open = useState('finder-open', () => false)
const query = ref('')
const category = ref('All')
const selected = ref(0)
const input = useTemplateRef('input')
const lastFocus = shallowRef<HTMLElement | null>(null)
const {
  data: sections,
  status,
  error,
  execute,
} = await useFetch('/search.json', { baseURL: useRuntimeConfig().app.baseURL, immediate: false })
const results = computed(() => {
  const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const pages = site.navigation.map((link) => ({
    id: link.to,
    title: link.label,
    titles: [] as string[],
    content: '',
    category: 'Pages',
    level: 1,
  }))
  return [...pages, ...(sections.value ?? [])]
    .filter(
      (item) =>
        (category.value === 'All' || category.value === item.category) &&
        terms.every((term) =>
          `${item.title} ${item.titles.join(' ')} ${item.content}`.toLowerCase().includes(term),
        ),
    )
    .filter((item) => query.value || item.level === 1)
    .slice(0, 30)
})
watch([query, category], () => {
  selected.value = 0
})
watch(open, async (value) => {
  if (value) {
    lastFocus.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    query.value = ''
    category.value = 'All'
    selected.value = 0
    if (!sections.value) await execute()
  }
})
function shortcut(event: KeyboardEvent) {
  const editing =
    event.target instanceof HTMLElement &&
    event.target.closest('input, textarea, select, [contenteditable]')
  if (
    ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') ||
    (event.key === '/' && !editing)
  ) {
    event.preventDefault()
    open.value = !open.value
  }
}
async function navigate(index: number) {
  const result = results.value[index]
  if (!result) return
  open.value = false
  await navigateTo(result.id)
}
function keyboard(event: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault()
    selected.value = Math.max(
      0,
      Math.min(results.value.length - 1, selected.value + (event.key === 'ArrowDown' ? 1 : -1)),
    )
    document.getElementById(`finder-result-${selected.value}`)?.scrollIntoView({ block: 'nearest' })
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    void navigate(selected.value)
  }
}
function restoreFocus(event: Event) {
  event.preventDefault()
  lastFocus.value?.focus()
}
onMounted(() => window.addEventListener('keydown', shortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', shortcut))
</script>
<template>
  <DialogRoot v-model:open="open"
    ><DialogPortal
      ><DialogOverlay class="finder-overlay" /><DialogContent
        class="finder-panel"
        @open-auto-focus.prevent="input?.focus()"
        @close-auto-focus="restoreFocus"
      >
        <div class="finder-top">
          <DialogTitle>Finder</DialogTitle><DialogClose>Close <span>(Esc)</span></DialogClose>
        </div>
        <DialogDescription class="sr-only"
          >Search journal entries, sections, and pages. Use arrow keys and Enter to open a
          result.</DialogDescription
        >
        <div class="finder-input">
          <span aria-hidden="true">reader@fieldnotes <span class="muted">~/</span> &gt;</span
          ><input
            ref="input"
            v-model="query"
            role="combobox"
            aria-label="Search the journal"
            aria-autocomplete="list"
            aria-controls="finder-results"
            :aria-expanded="true"
            :aria-activedescendant="results.length ? `finder-result-${selected}` : undefined"
            placeholder="Find something worth reading…"
            @keydown="keyboard"
          />
        </div>
        <div class="finder-categories" role="group" aria-label="Search categories">
          <button
            v-for="item in ['All', 'Pages', ...site.categories]"
            :key="item"
            :aria-pressed="category === item"
            @click="category = item"
          >
            {{ item }}
          </button>
        </div>
        <p v-if="status === 'pending'" class="finder-empty" role="status">
          Looking through the index…
        </p>
        <p v-else-if="error" class="finder-empty" role="alert">
          The index is unavailable.
          <button class="underlined" @click="execute()">Try again</button>
        </p>
        <p v-else-if="!results.length" class="finder-empty" role="status">
          Nothing here yet. Try a different word.
        </p>
        <div id="finder-results" class="finder-results" role="listbox" aria-label="Search results">
          <div
            v-for="(result, index) in results"
            :id="`finder-result-${index}`"
            :key="result.id"
            role="option"
            :aria-selected="selected === index"
            class="finder-result"
            @mousemove="selected = index"
            @click="navigate(index)"
          >
            <span class="muted">{{ String(index + 1).padStart(2, '0') }}</span
            ><span
              ><span class="result-title">{{ result.title }}</span
              ><small v-if="result.level > 1">{{ result.titles.join(' / ') }}</small></span
            ><span class="result-type">{{
              result.category === 'Pages' ? 'Page' : result.level > 1 ? 'Section' : 'Article'
            }}</span>
          </div>
        </div>
        <div class="finder-bottom">
          <span>↑↓ navigate <span class="key-gap">↵ open</span></span
          ><span>{{ results.length }} results</span>
        </div>
      </DialogContent></DialogPortal
    ></DialogRoot
  >
</template>
