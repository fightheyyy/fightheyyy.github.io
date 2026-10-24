<script setup lang="ts">
const selected = ref(0)
import { projects } from '~~/shared/projects'
const current = computed(() => projects[selected.value] ?? projects[0]!)
async function onTabKey(event: KeyboardEvent) {
  const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0
  if (!direction && !['Home', 'End'].includes(event.key)) return
  event.preventDefault()
  selected.value = event.key === 'Home' ? 0 : event.key === 'End' ? projects.length - 1 : (selected.value + direction + projects.length) % projects.length
  await nextTick()
  document.getElementById(`project-tab-${selected.value}`)?.focus({ preventScroll: true })
  if (matchMedia('(max-width: 760px)').matches) document.getElementById(`project-tab-${selected.value}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
</script>
<template>
  <section id="projects" class="workbench project-showcase" aria-labelledby="workbench-heading">
    <div class="section-heading">
      <h2 id="workbench-heading">Selected projects</h2>
      <span class="eyebrow muted">From models to real work</span>
    </div>
    <div class="workbench-grid">
      <div>
        <div class="workbench-list" role="tablist" aria-label="选择项目">
          <button v-for="(project, index) in projects" :id="`project-tab-${index}`" :key="project.title" role="tab" :aria-selected="selected === index" :tabindex="selected === index ? 0 : -1" aria-controls="workbench-panel" @keydown="onTabKey" @click="selected = index">
            <span class="project-name">{{ project.title }}</span><span class="workbench-arrow" aria-hidden="true">↗</span>
            <small>{{ project.category }}<span>{{ String(index + 1).padStart(2, '0') }} · <time :datetime="project.createdAt">{{ project.createdAt.slice(0, 7) }}</time></span></small>
          </button>
        </div>
        <NuxtLink to="/start" class="eyebrow workbench-more">Explore all projects ↗</NuxtLink>
      </div>
      <div id="workbench-panel" class="workbench-panel" role="tabpanel" :aria-labelledby="`project-tab-${selected}`">
        <div class="diagram-label">{{ current.label }}<span>FIGHTHEYYY</span></div>
        <h3 class="project-heading">{{ current.title }}</h3>
        <span class="project-positioning">{{ current.category }}</span>
        <div v-if="current.title === 'XIAOBA'" class="project-cat"><XiaobaMascot :size="220" /></div>
        <div v-else class="diagram">
          <div v-for="(node, index) in current.nodes" :key="`${selected}-${node}`" class="diagram-node">
            <span class="diagram-marker">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ node }}</span>
            <span v-if="index < 2" class="diagram-arrow" aria-hidden="true">→</span>
          </div>
        </div>
        <p>{{ current.text }}</p>
        <span class="project-stack">{{ current.stack }}</span>
        <div class="project-links">
          <a :href="current.github" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
          <NuxtLink v-if="current.path" :to="current.path">项目笔记 <span aria-hidden="true">→</span></NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
