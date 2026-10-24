<script setup lang="ts">
import BaseButton from '~/components/ui/BaseButton.vue'
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
let closeTimer: ReturnType<typeof setTimeout> | undefined
const contacts = [
  { label: 'GitHub', href: 'https://github.com/fightheyyy', external: true },
  { label: 'Email', href: 'mailto:704159620@qq.com', external: false },
  { label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/602417410000000001000ed4', external: true },
]
function show() { clearTimeout(closeTimer); open.value = true }
function closeSoon() { clearTimeout(closeTimer); closeTimer = setTimeout(() => { open.value = false }, 140) }
function toggle(event: MouseEvent) {
  clearTimeout(closeTimer)
  open.value = event.detail === 0 || !matchMedia('(hover: hover)').matches ? !open.value : true
}
function focusOut(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !root.value?.contains(event.relatedTarget)) open.value = false
}
function outside(event: PointerEvent) {
  if (event.target instanceof Node && !root.value?.contains(event.target)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', outside))
onBeforeUnmount(() => { clearTimeout(closeTimer); document.removeEventListener('pointerdown', outside) })
</script>
<template>
  <div ref="root" class="connect-menu" @mouseenter="show" @mouseleave="closeSoon" @focusout="focusOut" @keydown.esc="open = false">
    <BaseButton bold :aria-expanded="open" aria-controls="connect-links" @click="toggle">Contact <svg class="connect-chevron" :class="{ 'is-open': open }" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.2" /></svg></BaseButton>
    <div v-if="open" class="connect-panel" @mouseenter="show">
      <nav id="connect-links" class="connect-links" aria-label="联系我">
        <a v-for="contact in contacts" :key="contact.label" :href="contact.href" :target="contact.external ? '_blank' : undefined" :rel="contact.external ? 'noreferrer' : undefined" @click="open = false"><span>{{ contact.label }}</span><span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </div>
</template>
