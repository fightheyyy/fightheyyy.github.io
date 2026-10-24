<script setup lang="ts">
defineProps<{ to: string }>()
</script>
<template>
  <NuxtLink :to="to" class="solid-button bg-action text-action-foreground"><slot /></NuxtLink>
</template>
