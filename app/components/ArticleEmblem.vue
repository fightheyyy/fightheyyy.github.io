<script setup lang="ts">
defineProps<{ path: string; category: string }>()
const root = useTemplateRef<HTMLElement>('root')
const visible = ref(false)
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(entries => { visible.value = entries.some(entry => entry.isIntersecting) })
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <span ref="root" class="article-emblem" aria-hidden="true">
    <ArticleMark :path="path" :category="category" large :animated="visible" />
  </span>
</template>
