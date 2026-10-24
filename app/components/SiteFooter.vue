<script setup lang="ts">
import { site } from '~~/shared/site'
const props = withDefaults(defineProps<{ embedded?: boolean; presentation?: 'editorial' | 'minimal' }>(), { embedded: false, presentation: 'editorial' })
const base = useRuntimeConfig().app.baseURL
const minimal = computed(() => props.presentation === 'minimal')
const homeLink = computed(() => minimal.value ? `${base}classic/index.html?view=minimal` : '/')
const linkTarget = computed(() => props.embedded ? '_top' : undefined)
</script>
<template>
  <footer class="site-footer">
    <div class="footer-grid">
      <div class="footer-identity">
        <NuxtLink :to="homeLink" :external="minimal" :target="linkTarget" class="footer-wordmark">{{ site.wordmark }}</NuxtLink>
        <p class="footer-colophon">做过的项目，和做项目时留下的笔记。<br />Runtime, evaluation, memory, and hardware.</p>
        <span class="micro muted">© {{ new Date().getFullYear() }} {{ site.name }}</span>
      </div>
      <nav aria-label="Explore">
        <h2 class="eyebrow">Explore</h2>
        <NuxtLink :to="homeLink" :external="minimal" :target="linkTarget">Home</NuxtLink><NuxtLink :to="`${homeLink}#blog`" :external="minimal" :target="linkTarget">Blog</NuxtLink
        ><NuxtLink :to="`${homeLink}#projects`" :external="minimal" :target="linkTarget">Projects</NuxtLink
        ><NuxtLink to="/terminal" :target="linkTarget">Terminal</NuxtLink>
      </nav>
      <nav aria-label="Contact">
        <h2 class="eyebrow">Contact</h2>
        <a href="https://github.com/fightheyyy" :target="linkTarget">GitHub ↗</a>
        <a href="https://www.xiaohongshu.com/user/profile/602417410000000001000ed4" :target="linkTarget">小红书 ↗</a>
        <a href="mailto:704159620@qq.com" :target="linkTarget">QQ 邮箱 ↗</a>
      </nav>
      <div class="footer-subscribe">
        <h2 class="eyebrow">Keep a little room for curiosity</h2>
        <p>No algorithm. No noise. New notes, delivered to your favorite feed reader.</p>
        <a :href="`${base}rss.xml`" :target="linkTarget" class="rss-link"
          >Subscribe via RSS <span aria-hidden="true">↗</span></a
        >
        <p class="micro muted">An open feed. Yours to read however you like.</p>
      </div>
    </div>
    <CatPlayground v-if="site.showSpaceFooter" />
  </footer>
</template>
