<script setup lang="ts">
const root = useTemplateRef<HTMLElement>('root')
let observer: ResizeObserver | undefined
let pending = 0
let lastHeight = 0
let disposed = false

useSeoMeta({ title: 'Footer', robots: 'noindex, nofollow' })
useHead({ bodyAttrs: { class: 'shared-footer-document' } })

function reportHeight() {
  if (disposed || !root.value || window.parent === window) return
  cancelAnimationFrame(pending)
  pending = requestAnimationFrame(() => {
    const height = Math.ceil(root.value?.getBoundingClientRect().height ?? 0)
    if (height > 0 && height !== lastHeight) {
      lastHeight = height
      window.parent.postMessage({ type: 'blog-footer:height', height }, window.location.origin)
    }
  })
}
function measureRequest(event: MessageEvent) {
  if (event.origin === window.location.origin && event.source === window.parent && event.data?.type === 'blog-footer:measure') {
    lastHeight = 0
    reportHeight()
  }
}
onMounted(() => {
  observer = new ResizeObserver(reportHeight)
  if (root.value) observer.observe(root.value)
  window.addEventListener('message', measureRequest)
  document.fonts.ready.then(reportHeight)
  reportHeight()
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  cancelAnimationFrame(pending)
  window.removeEventListener('message', measureRequest)
})
</script>

<template>
  <main ref="root" class="shared-footer-page"><SiteFooter embedded presentation="minimal" /></main>
</template>
