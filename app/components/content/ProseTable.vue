<script setup lang="ts">
const tableId = useId()
</script>
<template>
  <div class="table-scroll" tabindex="0" role="region" :aria-label="`Data table ${tableId}`">
    <table>
      <slot />
    </table>
  </div>
</template>
