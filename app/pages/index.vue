<script setup lang="ts">
import { publicUrl } from '~~/shared/editorial'
import { site } from '~~/shared/site'
const { data: posts, error } = await usePublishedPosts()
prerenderRoutes((posts.value ?? []).flatMap((post) => [post.path, `/markdown${post.path}.md`]))
const config = useRuntimeConfig()
const introSeen = useCookie<boolean>('fieldnotes-intro-seen', { sameSite: 'lax', path: '/' })
const intro = ref(!introSeen.value)
let introTimer: ReturnType<typeof setTimeout> | undefined
function finishIntro() {
  intro.value = false
  clearTimeout(introTimer)
}
onMounted(() => {
  if (introSeen.value) finishIntro()
  introSeen.value = true
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) finishIntro()
  else if (intro.value) introTimer = setTimeout(finishIntro, 2500)
})
onBeforeUnmount(() => clearTimeout(introTimer))
useSeoMeta({
  title: 'Home',
  description: site.description,
  ogTitle: site.name,
  ogDescription: site.description,
  ogType: 'website',
})
useHead({ link: [{ rel: 'canonical', href: publicUrl('/', config.public.siteUrl) }] })
</script>
<template>
  <main
    id="main"
    class="page-shell"
    :class="{ 'home-intro': intro }"
    tabindex="-1"
    @pointerdown="finishIntro"
    @keydown="finishIntro"
  >
    <div class="home-grid">
      <div id="intro" class="intro-rail">
        <h1>
          <span class="intro-wordmark">{{ site.wordmark }}</span>
        </h1>
        <p>{{ site.description }}</p>
        <span class="intro-footnote">Runtime, evaluation, memory, and hardware.</span>
      </div>
      <div id="blog" class="home-feed" aria-label="Blog">
        <p v-if="error" role="alert">The blog could not load. Please refresh to try again.</p>
        <PostFeed v-else :posts="posts ?? []" />
      </div>
    </div>
    <Workbench v-if="site.showWorkbench" />
  </main>
</template>
