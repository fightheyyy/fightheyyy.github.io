<script setup lang="ts">
defineProps<{
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  meta?: string
  class?: string
}>()
const { copy, message } = useCopy()
</script>
<template>
  <div class="code-block">
    <div class="code-toolbar">
      <span
        >Code <span class="muted">{{ filename || language || 'text' }}</span></span
      ><button :aria-label="`Copy ${language || ''} code`" @click="copy(code ?? '')">
        {{ message === 'Copied' ? 'Copied ✓' : 'Copy' }}
      </button>
    </div>
    <pre
      :class="$props.class"
      tabindex="0"
      role="group"
      :aria-label="`${filename || language || 'Plain text'} code`"
    ><slot /></pre>
    <span class="sr-only" role="status">{{ message }}</span>
  </div>
</template>
