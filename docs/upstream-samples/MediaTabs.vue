<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
withDefaults(defineProps<{ first?: string; second?: string }>(), {
  first: 'Before',
  second: 'After',
})
</script>
<template>
  <TabsRoot default-value="first" class="media-tabs"
    ><TabsList aria-label="Example versions"
      ><TabsTrigger value="first">{{ first }}</TabsTrigger
      ><TabsTrigger value="second">{{ second }}</TabsTrigger></TabsList
    ><TabsContent value="first"><slot name="first" /></TabsContent
    ><TabsContent value="second"><slot name="second" /></TabsContent
  ></TabsRoot>
</template>
