<script setup lang="ts">
const props = defineProps<{ path: string; category: string; large?: boolean; animated?: boolean }>()
const kind = computed(() => {
  if (props.path.includes('catena')) return 'network'
  if (props.path.includes('gauzmem')) return 'memory'
  if (props.path.includes('barena')) return 'eval'
  if (props.path.includes('supercoding')) return 'tools'
  if (props.path.includes('cli-agent-os')) return 'terminal'
  if (props.path.includes('cli-to-xiaoba')) return 'orbit'
  if (props.category === 'Hardware') return 'chip'
  return 'notebook'
})
</script>

<template>
  <svg class="article-mark" :class="{ 'is-large': large, 'is-animated': animated }" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">
    <!-- Each mark borrows an ear, a pair of eyes, or a curled tail from XiaoBa. -->
    <g v-if="kind === 'network'">
      <path d="M4 12V4l5 4h6l5-4v8H4Zm4 0v6m8-6v6M8 18h16v6M8 18v6M5 24h6v5H5Zm16 0h6v5h-6Z" />
      <path class="mark-detail" d="M8 10h1m5 0h1M24 9v6m-3-3h6" />
    </g>
    <g v-else-if="kind === 'memory'">
      <path d="m5 11 11-6 11 6v14l-11 5-11-5V11Zm0 0 11 6 11-6M16 17v13M9 9V3l6 4m5 0 4-4v7" />
      <path class="mark-detail" d="M9 17v3m4-1v3m7-3v3m4-5v3" />
    </g>
    <g v-else-if="kind === 'eval'">
      <path d="M5 13V4l6 5h10l6-5v9m-22 0v10l5 5h12l5-5V13H5Z" />
      <path class="mark-detail" d="m9 18 3 3 5-6m3 3h3M11 25h10M2 16h3m22 0h3" />
    </g>
    <g v-else-if="kind === 'tools'">
      <path d="M4 14V5l7 5h10l7-5v9H4Zm0 0v13h24V14M8 19l4 3-4 3m7 0h5" />
      <path class="mark-detail" d="M10 12h1m10 0h1M22 2v5m-2-3h4" />
    </g>
    <g v-else-if="kind === 'terminal'">
      <path d="M3 5h26v20H3ZM3 10h26M7 8h1m3 0h1m3 0h1M8 21v-7l4 3h5l4-3v7H8ZM12 25v4m8-4v4M9 29h14" />
      <path class="mark-detail" d="M22 21h3" />
    </g>
    <g v-else-if="kind === 'orbit'">
      <path d="M9 16V8l5 4h4l5-4v8l-3 6h-8l-3-6Zm4 0h1m4 0h1" />
      <path class="mark-detail" d="M5 11C0 20 4 28 15 28S31 20 27 12M7 6l-3 4 5 1m15 14 4-1-1-5" />
    </g>
    <g v-else-if="kind === 'chip'">
      <path d="M7 11V4l6 4h6l6-4v7M7 11h18v14H7ZM13 22h6M3 14h4m-4 7h4m18-7h4m-4 7h4M11 25v4m10-4v4" />
      <path class="mark-eyes" d="M12 15v4m8-4v4" />
    </g>
    <g v-else>
      <path d="M7 5h20v24H7ZM4 9h6m-6 6h6m-6 6h6M13 20v-9l4 3h3l4-3v9H13Zm3-3h1m3 0h1" />
    </g>
  </svg>
</template>
