<script setup lang="ts">
import { site } from '~~/shared/site'
</script>
<template>
  <footer class="site-footer">
    <div class="footer-grid">
      <div class="footer-identity">
        <NuxtLink to="/" class="footer-wordmark">{{ site.wordmark }}</NuxtLink>
        <p class="footer-colophon">做过的项目，和做项目时留下的笔记。<br />Runtime, evaluation, memory, and hardware.</p>
        <span class="micro muted">© {{ new Date().getFullYear() }} {{ site.name }}</span>
      </div>
      <nav aria-label="Explore">
        <h2 class="eyebrow">Explore</h2>
        <NuxtLink to="/">Home</NuxtLink><NuxtLink to="/#blog">Blog</NuxtLink
        ><NuxtLink to="/#projects">Projects</NuxtLink
        ><NuxtLink to="/terminal">Terminal <span aria-hidden="true">↗</span></NuxtLink>
      </nav>
      <nav aria-label="Elsewhere">
        <h2 class="eyebrow">Connect</h2>
        <a href="https://github.com/fightheyyy">GitHub ↗</a>
        <a href="https://www.xiaohongshu.com/user/profile/602417410000000001000ed4">小红书 ↗</a>
        <a href="mailto:704159620@qq.com">QQ 邮箱 ↗</a>
        <a :href="`${useRuntimeConfig().app.baseURL}classic/index.html`">原版博客 ↗</a>
      </nav>
      <div class="footer-subscribe">
        <h2 class="eyebrow">Keep a little room for curiosity</h2>
        <p>No algorithm. No noise. New notes, delivered to your favorite feed reader.</p>
        <a :href="`${useRuntimeConfig().app.baseURL}rss.xml`" class="rss-link"
          >Subscribe via RSS <span aria-hidden="true">↗</span></a
        >
        <p class="micro muted">An open feed. Yours to read however you like.</p>
      </div>
    </div>
    <CatPlayground v-if="site.showSpaceFooter" />
  </footer>
</template>
