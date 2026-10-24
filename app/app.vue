<script setup lang="ts">
import { site } from '~~/shared/site'
const route = useRoute()
const isTerminal = computed(() => route.path.replace(/\/$/, '') === '/terminal')
const isFooterDocument = computed(() => route.path.replace(/\/$/, '') === '/shared-footer')
useHead({
  titleTemplate: (title) =>
    title ? `${title} — ${site.name}` : `${site.name} — Notes from the workbench`,
})
</script>
<template>
  <a v-if="!isFooterDocument" class="skip-link" href="#main">Skip to content</a>
  <SiteHeader v-if="!isTerminal && !isFooterDocument" />
  <NuxtPage />
  <SiteFooter v-if="!isTerminal && !isFooterDocument" />
</template>
