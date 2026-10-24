<script setup lang="ts">
import type { NuxtError } from '#app'
import { site } from '~~/shared/site'
import BaseButton from '~/components/ui/BaseButton.vue'
defineProps<{ error: NuxtError }>()
useHead({ title: `Page unavailable — ${site.name}` })
</script>
<template>
  <main id="main" tabindex="-1" class="page-shell" style="padding-block: 100px; min-height: 100vh">
    <XiaobaMascot :size="60" />
    <p class="eyebrow" style="margin-top: 30px">{{ error.statusCode }} / A blank page</p>
    <h1 style="font-size: 32px; margin: 20px 0">This note isn't here.</h1>
    <p class="muted" style="margin-bottom: 30px">
      The address may have changed. There's more to discover in the journal.
    </p>
    <BaseButton @click="clearError({ redirect: '/' })"> Back to the journal ↗ </BaseButton>
  </main>
</template>
