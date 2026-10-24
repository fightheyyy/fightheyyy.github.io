<script setup lang="ts">
withDefaults(defineProps<{ size?: number; star?: boolean }>(), { size: 48, star: false })
</script>
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="currentColor"
    class="pixel-lantern"
    aria-hidden="true"
    shape-rendering="crispEdges"
  >
    <template v-if="star">
      <path d="M14 2h4v8h4v4h8v4h-8v4h-4v8h-4v-8h-4v-4H2v-4h8v-4h4z" />
      <path d="M14 12h4v8h-4z" fill="var(--bg)" />
    </template>
    <template v-else>
      <path
        d="M12 2h8v2h-8zM10 4h2v4h-2zm10 0h2v4h-2zM6 8h20v4H6zM8 12h3v14H8zm13 0h3v14h-3zM6 26h20v4H6z"
      />
      <path d="M14 14h4v3h2v6h-8v-6h2z" opacity=".8" />
      <path d="M15 18h2v5h-2z" fill="var(--bg)" />
    </template>
  </svg>
</template>
