<script setup lang="ts">
import { site } from '~~/shared/site'
const route = useRoute()
const isTerminal = computed(() => route.path.replace(/\/$/, '') === '/terminal')
useHead({
  titleTemplate: (title) =>
    title ? `${title} — ${site.name}` : `${site.name} — Notes from the workbench`,
})
</script>
<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <SiteHeader v-if="!isTerminal" />
  <NuxtPage />
  <SiteFooter v-if="!isTerminal" />
</template>
