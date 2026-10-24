<script setup lang="ts">
withDefaults(defineProps<{ label: string; tone?: 'default' | 'muted'; compact?: boolean }>(), {
  tone: 'default',
  compact: false,
})
</script>
<template>
  <button
    type="button"
    class="icon-button"
    :class="{ 'text-muted': tone === 'muted', 'icon-button-compact': compact }"
    :aria-label="label"
  >
    <slot />
  </button>
</template>
