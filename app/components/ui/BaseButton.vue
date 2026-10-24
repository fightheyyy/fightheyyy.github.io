<script setup lang="ts">
defineProps<{ bold?: boolean }>()
</script>

<template>
  <button type="button" class="solid-button bg-action text-action-foreground" :class="{ 'font-bold': bold }"><slot /></button>
</template>
