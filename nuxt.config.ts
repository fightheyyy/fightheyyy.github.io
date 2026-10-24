import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

const baseURL = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-02',
  modules: ['@nuxt/content'],
  css: ['@fontsource-variable/nunito-sans', 'cn-fontsource-975-maru-sc-regular/font.css', '~/assets/css/maru-bold.css', '@fontsource-variable/geist-mono', '~/assets/css/main.css', '~/assets/css/projects.css', '~/assets/css/terminal.css', '~/assets/css/connect.css', '~/assets/css/typography.css', '~/assets/css/mascot.css', '~/assets/css/playground.css'],
  devtools: { enabled: false },
  nitro: { prerender: { routes: ['/search.json', '/rss.xml', '/sitemap.xml', '/robots.txt', '/shared-footer'] } },
  typescript: { strict: true },
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: { public: { siteUrl: 'https://fightheyyy.github.io' } },
  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: { default: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
        },
      },
    },
  },
  hooks: {
    'content:file:afterParse'({ file, content }) {
      if (file.path.endsWith('.md')) {
        content.raw = file.body
        if (!content.readingMinutes)
          content.readingMinutes = Math.max(
            1,
            Math.ceil(file.body.replace(/^---[\s\S]*?---/, '').split(/\s+/).length / 200),
          )
      }
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN', class: 'light' },
      script: [{ src: `${baseURL}entry.js?v=dual-view-v2`, tagPriority: 'critical' }],
      link: [
        { rel: 'stylesheet', href: `${baseURL}fonts/noto-sans-sc/index.css` },
        { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}mascot/xiaoba/logo.svg?v=solid-cobalt-white-v4` },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'Fightheyyy RSS',
          href: `${baseURL}rss.xml`,
        },
      ],
    },
  },
})
