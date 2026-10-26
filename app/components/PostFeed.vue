<script setup lang="ts">
import IconButton from '~/components/ui/IconButton.vue'
import { Search, X } from '@lucide/vue'
import { filterPosts, formatDate, orderPosts, type PostSummary } from '~~/shared/editorial'
const props = withDefaults(
  defineProps<{ posts: PostSummary[]; initialCount?: number; searchable?: boolean; highlightFirst?: boolean }>(),
  { initialCount: 10, searchable: true, highlightFirst: true },
)
const category = ref('All')
const search = ref('')
const searchOpen = ref(false)
const input = useTemplateRef('searchInput')
const count = ref(props.initialCount)
const showFeatured = computed(() => props.highlightFirst && !search.value.trim())
const ordered = computed(() => orderPosts(props.posts))
const filtered = computed(() => filterPosts(ordered.value, category.value, search.value))
const visible = computed(() => filtered.value.slice(0, count.value))
watch([category, search], () => {
  count.value = props.initialCount
})
async function openSearch() {
  searchOpen.value = true
  await nextTick()
  input.value?.focus()
}
function closeSearch() {
  search.value = ''
  searchOpen.value = false
}
function shortcut(event: KeyboardEvent) {
  if (
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    (event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, select, [contenteditable], [role="dialog"]'))
  )
    return
  if (event.key.toLowerCase() === 's' && props.searchable) {
    event.preventDefault()
    void openSearch()
  }
  if (event.key.toLowerCase() === 'r' && count.value < filtered.value.length) count.value += 5
}
onMounted(() => {
  window.addEventListener('keydown', shortcut)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', shortcut)
})
</script>
<template>
  <div>
    <div class="feed-toolbar" :class="{ 'search-is-open': searchOpen }">
      <CategoryFilter v-model="category" />
      <div v-if="searchable" class="inline-search">
        <button v-if="!searchOpen" aria-label="Search posts" @click="openSearch">
          <span>[S]</span> Search
          <Search :size="13" class="small-search-icon" />
        </button>
        <template v-else
          ><input
            ref="searchInput"
            v-model="search"
            type="search"
            placeholder="Find a note…"
            aria-label="Search posts"
            @keydown.esc="closeSearch" /><IconButton
            label="Clear and close search"
            @click="closeSearch"
          >
            <X :size="15" /></IconButton
        ></template>
      </div>
    </div>
    <div class="post-rows">
      <NuxtLink
        v-for="(post, index) in visible"
        :key="post.path"
        :to="post.path"
        class="post-row"
        :class="{ featured: index === 0 && showFeatured }"
      >
        <div class="post-leading">
          <span class="article-cat">
            <ArticleEmblem v-if="index === 0 && showFeatured" :path="post.path" :category="post.category" />
            <ArticleMark :path="post.path" :category="post.category" />
          </span>
          <time class="post-date" :datetime="post.date">{{ formatDate(post.date) }}</time>
        </div>
        <div class="post-title">
          <span v-if="index === 0 && showFeatured" class="badge">{{ post.featured ? "Editor's note" : post.category }}</span>
          <h2>{{ post.title }}</h2>
          <div v-if="index === 0 && showFeatured" class="post-byline">
            {{ post.author }} <span>{{ post.category }}</span>
          </div>
        </div>
        <span class="post-duration"
          >{{ post.readingMinutes }}
          <span class="minutes-long">{{ post.readingMinutes === 1 ? 'minute' : 'minutes' }}</span
          ><span class="minutes-short">min</span></span
        >
      </NuxtLink>
    </div>
    <p v-if="!visible.length" class="empty-state" role="status">
      No notes here yet. Try another category or search.
    </p>
    <div class="feed-end">
      <button v-if="count < filtered.length" class="feed-action" @click="count += 5">
        Load more <span aria-hidden="true">↓</span></button
      ><span v-else class="muted"
        >{{ filtered.length }} {{ filtered.length === 1 ? 'note' : 'notes' }} in the
        collection</span
      >
      <span v-if="count < filtered.length" class="keyboard-hint">Press R to load more</span
      ><span v-else class="end-mark" aria-hidden="true">↳ End of the index</span>
    </div>
  </div>
</template>
