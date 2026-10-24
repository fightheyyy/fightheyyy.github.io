<script setup lang="ts">
withDefaults(defineProps<{ label?: string; caption: string }>(), { label: 'Fig. A' })
</script>
<template>
  <figure class="note-figure">
    <div class="figure-content"><slot /></div>
    <figcaption>
      <span>{{ label }}</span
      ><span>{{ caption }}</span>
    </figcaption>
  </figure>
</template>
