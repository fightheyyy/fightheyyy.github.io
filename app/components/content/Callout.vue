<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), { title: 'A note in the margin' })
</script>
<template>
  <aside class="callout" :aria-label="title">
    <div class="eyebrow">↳ {{ title }}</div>
    <slot />
  </aside>
</template>
