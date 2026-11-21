<script setup lang="ts">
import { publicUrl } from '~~/shared/editorial'
import { formatDate } from '~~/shared/editorial'
import { site } from '~~/shared/site'
definePageMeta({ alias: ['/resume/:slug(.*)+'] })
const route = useRoute()
const isResume = route.path.startsWith('/resume/')
const collection = isResume ? 'resume' : 'posts'
const config = useRuntimeConfig()
const { data: post } = await useAsyncData(`post:${route.path}`, () =>
  queryCollection(collection).path(route.path).where('draft', '=', false).first(),
)
if (!post.value)
  throw createError({ statusCode: 404, statusMessage: 'This note has not been written yet.' })
const { data: posts } = await usePublishedPosts(collection)
const body = useTemplateRef<HTMLElement>('body')
const { progress, activeId, titleVisible } = useReadingPosition(body)
const related = computed(() =>
  (posts.value ?? [])
    .filter((item) => item.path !== post.value?.path)
    .map((item) => ({ ...item, featured: false }))
    .slice(0, 5),
)
const canonical = publicUrl(route.path, config.public.siteUrl)
useSeoMeta({
  robots: isResume ? 'noindex, nofollow' : undefined,
  title: post.value.title,
  description: post.value.description,
  ogTitle: post.value.title,
  ogDescription: post.value.description,
  ogType: 'article',
  articlePublishedTime: post.value.date,
  articleAuthor: [post.value.author],
  twitterCard: 'summary',
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.value.title,
        description: post.value.description,
        datePublished: post.value.date,
        author: { '@type': 'Person', name: post.value.author },
        publisher: { '@type': 'Organization', name: site.name },
        url: canonical,
      }).replace(/</g, '\\u003c'),
    },
  ],
})
</script>
<template>
  <main v-if="post" id="main" class="article-page" tabindex="-1">
    <div class="mobile-reading-progress" :style="{ width: `${progress}%` }" aria-hidden="true" />
    <header class="article-hero page-shell">
      <div class="article-hero-content">
        <p v-if="isResume"><NuxtLink to="/resume">返回 resume 复盘专栏</NuxtLink></p>
        <div class="article-brandline"><ArticleEmblem :key="post.path" :path="post.path" :category="post.category" /><span class="badge">{{
          post.category
        }}</span></div>
        <h1>{{ post.title }}</h1>
        <p class="standfirst">{{ post.description }}</p>
        <dl class="article-meta">
          <div>
            <dt>Author</dt>
            <dd>{{ post.author }}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>
              <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            </dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>{{ post.readingMinutes }} min</dd>
          </div>
        </dl>
      </div>
    </header>
    <div class="article-body-grid page-shell">
      <ArticleRail
        :title="post.title"
        :headings="post.body.toc?.links ?? []"
        :active-id="activeId"
        :progress="progress"
        :title-visible="titleVisible"
        :path="post.path"
      />
      <div ref="body" class="prose"><ContentRenderer :value="post" /></div>
    </div>
    <section class="related-section page-shell" aria-labelledby="related-heading">
      <h2 id="related-heading" class="section-title">{{ isResume ? '继续拷打' : 'Keep exploring' }}</h2>
      <PostFeed :posts="related" :resume="isResume" :searchable="false" :highlight-first="false" :initial-count="5" />
    </section>
  </main>
</template>
