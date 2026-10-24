<script setup lang="ts">
import { publicUrl } from '~~/shared/editorial'
useSeoMeta({ title: 'Projects', description: 'Agent Runtime, evaluation, memory, and evolution infrastructure.' })
useHead({ link: [{ rel: 'canonical', href: publicUrl('/start', useRuntimeConfig().public.siteUrl) }] })
import { projects } from '~~/shared/projects'
</script>
<template>
  <main id="main" class="simple-page page-shell" tabindex="-1">
    <div class="simple-title"><h1>Projects.</h1><p>From models to real work.</p><XiaobaMascot :size="64" /></div>
    <div class="prose">
      <section v-for="(project, index) in projects" :key="project.title">
        <h2 class="project-index-name">{{ String(index + 1).padStart(2, '0') }} / {{ project.title }}</h2><p>{{ project.category }} · <time :datetime="project.createdAt">{{ project.createdAt.slice(0, 7) }}</time></p>
        <p><a :href="project.github">GitHub ↗</a> <template v-if="project.path"> · <NuxtLink :to="project.path">项目笔记 →</NuxtLink></template></p>
      </section>
    </div>
  </main>
</template>
