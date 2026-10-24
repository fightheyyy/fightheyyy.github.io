<script setup lang="ts">
import { publicUrl } from '~~/shared/editorial'
import type { Heading } from '~~/shared/editorial'
const props = defineProps<{
  title: string
  headings: Heading[]
  activeId: string
  progress: number
  titleVisible: boolean
  path: string
}>()
const { copy, message } = useCopy()
const runtimeConfig = useRuntimeConfig()
const absoluteUrl = computed(() => publicUrl(props.path, runtimeConfig.public.siteUrl))
function copyUrl() {
  void copy(window.location.href)
}
function containsActive(heading: Heading): boolean {
  return heading.id === props.activeId || !!heading.children?.some(containsActive)
}
async function copyMarkdown() {
  try {
    const raw = await $fetch<string>(`/markdown${props.path}.md`, {
      baseURL: runtimeConfig.app.baseURL,
      responseType: 'text',
    })
    await copy(raw)
  } catch {
    message.value = 'Markdown unavailable. Please try again.'
  }
}
function jump(event: MouseEvent, id: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  history.pushState(null, '', `#${id}`)
  target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  target.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  })
}
</script>
<template>
  <aside class="article-rail" aria-label="Reading guide">
    <div class="rail-title" :class="{ visible: titleVisible }">{{ title }}</div>
    <nav class="contents-tree" aria-label="Table of contents">
      <h2 class="eyebrow">On this page</h2>
      <ul>
        <li v-for="heading in headings" :key="heading.id">
          <a
            :href="`#${heading.id}`"
            :aria-current="activeId === heading.id ? 'location' : undefined"
            :class="{ active: containsActive(heading) }"
            @click="jump($event, heading.id)"
            ><span aria-hidden="true">└</span>{{ heading.text }}</a
          >
          <div
            v-if="heading.children?.length"
            class="toc-children"
            :class="{ expanded: containsActive(heading) }"
          >
            <ul>
              <li v-for="child in heading.children" :key="child.id">
                <a
                  :href="`#${child.id}`"
                  :aria-current="activeId === child.id ? 'location' : undefined"
                  @click="jump($event, child.id)"
                  ><span aria-hidden="true">└</span>{{ child.text }}</a
                >
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
    <div
      class="rail-progress"
      role="progressbar"
      aria-label="Reading progress"
      :aria-valuenow="progress"
      :aria-valuemin="0"
      :aria-valuemax="100"
    >
      <span class="pixel-progress" aria-hidden="true"
        ><span :style="{ width: `${progress}%` }" /></span
      ><span>{{ String(progress).padStart(2, '0') }}%</span>
    </div>
    <span class="eyebrow rail-hint">A little further down ↓</span>
    <div class="share-actions">
      <h2 class="eyebrow">Take it with you</h2>
      <button @click="copyUrl">└ Copy URL</button
      ><button @click="copyMarkdown">└ Copy markdown</button
      ><a
        :href="`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(absoluteUrl)}`"
        >└ Email a friend</a
      >
      <p role="status" class="copy-status">{{ message }}</p>
    </div>
  </aside>
</template>
