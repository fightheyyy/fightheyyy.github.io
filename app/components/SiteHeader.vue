<script setup lang="ts">
import { Menu, X } from '@lucide/vue'
import IconButton from '~/components/ui/IconButton.vue'
import { site } from '~~/shared/site'
const route = useRoute()
const minimalHref = `${useRuntimeConfig().app.baseURL}classic/index.html?view=minimal`
const menuOpen = ref(false)
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
async function navigateByKey(event: KeyboardEvent) {
  const editing = event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]')
  if (!event.defaultPrevented && !event.isComposing && (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !editing))) {
    event.preventDefault()
    await navigateTo('/terminal')
    return
  }
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.repeat ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    (event.target instanceof HTMLElement &&
      (event.target.isContentEditable ||
        event.target.closest(
          'input, textarea, select, [role="textbox"], [role="combobox"], [role="dialog"], [role="menu"], [role="listbox"]',
        )))
  )
    return
  if (event.key.toLowerCase() === 'm') {
    event.preventDefault()
    window.location.assign(minimalHref)
    return
  }
  const destination = site.navigation.find(
    (link) => link.key.toLowerCase() === event.key.toLowerCase(),
  )
  if (!destination) return
  event.preventDefault()
  menuOpen.value = false
  await navigateTo(destination.to)
  await nextTick()
  document.getElementById('main')?.focus({ preventScroll: true })
}
onMounted(() => window.addEventListener('keydown', navigateByKey))
onBeforeUnmount(() => window.removeEventListener('keydown', navigateByKey))
function closeMenu(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}
function isCurrent(to: string) {
  if (to === '/#blog') return route.path.startsWith('/blog/') || (route.path === '/' && route.hash === '#blog')
  if (to === '/#projects') return route.path === '/start' || (route.path === '/' && route.hash === '#projects')
  if (to === '/') return route.path === '/' && !['#blog', '#projects'].includes(route.hash)
  return route.path === to
}
</script>
<template>
  <header class="site-header" @keydown="closeMenu">
    <NuxtLink to="/" class="brand" :aria-label="`${site.name} home`"
      ><XiaobaMascot :size="72"
    /></NuxtLink>
    <nav class="desktop-nav" aria-label="Main navigation">
      <NuxtLink
        v-for="link in site.navigation"
        :key="link.to"
        :to="link.to"
        :aria-keyshortcuts="link.key.toLowerCase()"
        :aria-current="isCurrent(link.to) ? 'page' : undefined"
        ><span>[{{ link.key }}]</span> {{ link.label }}</NuxtLink
      >
      <a :href="minimalHref" class="minimal-switch" aria-keyshortcuts="m" aria-label="Switch to the minimal blog"><span>[M]</span> Minimal</a>
    </nav>
    <div class="header-actions">
      <ConnectMenu />
      <IconButton
        class="hidden max-navigation:inline-flex"
        label="Navigation menu"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="22" /><Menu v-else :size="22" />
      </IconButton>
    </div>
    <nav v-if="menuOpen" id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation">
      <NuxtLink
        v-for="link in site.navigation"
        :key="link.to"
        :to="link.to"
        :aria-keyshortcuts="link.key.toLowerCase()"
        >[{{ link.key }}] {{ link.label }}</NuxtLink
      >
      <a :href="minimalHref" class="minimal-switch" aria-keyshortcuts="m" @click="menuOpen = false">[M] Minimal</a>
    </nav>
  </header>
</template>
