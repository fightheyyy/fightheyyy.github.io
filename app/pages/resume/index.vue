<script setup lang="ts">
import { site } from '~~/shared/site'
const { data: posts, error } = await usePublishedPosts('resume')
const { data: publicPosts } = await usePublishedPosts()
prerenderRoutes((posts.value ?? []).flatMap((post) => [post.path, `/markdown${post.path}.md`]))
useSeoMeta({
  title: 'resume · 面试深挖与复盘',
  description: '两段实习，三个项目。从简历上的一句话，追到实现、失败边界和证据。',
  robots: 'noindex, nofollow',
})
</script>
<template>
  <main id="main" class="page-shell" tabindex="-1">
    <div class="home-grid">
      <div class="intro-rail">
        <h1><span class="intro-wordmark">resume</span></h1>
        <p>两段实习，三个项目。<br />把简历上的每一句话，讲到经得起追问。</p>
        <p class="mt-6 text-base">
          先闭卷回答，再看拆解。每篇都有追问、八股、指标核对和 30 分钟自测。
        </p>
        <p class="mt-4 text-base">简历事实与设计推演分开标注，缺失证据留待核对。</p>
        <span class="intro-footnote">{{ site.wordmark }} / Interview fieldnotes</span>
      </div>
      <div class="home-feed" aria-label="Resume interview notes">
        <p v-if="error" role="alert">复盘文章加载失败，请刷新重试。</p>
        <PostFeed
          v-else
          :posts="[...(publicPosts ?? []), ...(posts ?? [])]"
          resume
          initial-category="resume"
          :highlight-first="false"
        />
      </div>
    </div>
  </main>
</template>
