<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'reka-ui'
import { site } from '~~/shared/site'
const model = defineModel<string>({ default: 'All' })
const categories = ['All', ...site.categories]
</script>
<template>
  <div class="categories" role="group" aria-label="Filter by category">
    <button
      v-for="(category, index) in categories"
      :key="category"
      :class="['category-button', { 'category-overflow': index > 1 }]"
      :aria-pressed="model === category"
      @click="model = category"
    >
      {{ category }}
    </button>
    <DropdownMenuRoot :modal="false">
      <DropdownMenuTrigger class="category-more" aria-label="More categories"
        >···<span v-if="!['All', site.categories[0]].includes(model)" class="filter-dot"
      /></DropdownMenuTrigger>
      <DropdownMenuPortal
        ><section aria-label="Article category filter">
          <DropdownMenuContent class="dropdown" :side-offset="10" align="start"
            ><DropdownMenuItem
              v-for="category in categories.slice(2)"
              :key="category"
              class="dropdown-item"
              @select="model = category"
              >{{ category }} <span v-if="model === category">✓</span></DropdownMenuItem
            ></DropdownMenuContent
          >
        </section></DropdownMenuPortal
      >
    </DropdownMenuRoot>
  </div>
</template>
