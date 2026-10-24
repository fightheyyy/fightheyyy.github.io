import { publicUrl } from '../../shared/editorial'
import { queryCollection } from '@nuxt/content/server'
import { escapeXml } from '../../shared/editorial'
export default defineEventHandler(async (event) => {
  const origin = useRuntimeConfig(event).public.siteUrl
  const posts = await queryCollection(event, 'posts')
    .where('draft', '=', false)
    .select('path', 'date')
    .all()
  const pages = ['/', '/start', '/terminal'].map(
    (path) => `<url><loc>${escapeXml(publicUrl(path, origin))}</loc></url>`,
  )
  const articles = posts.map(
    (post) =>
      `<url><loc>${escapeXml(publicUrl(post.path, origin))}</loc><lastmod>${escapeXml(post.date)}</lastmod></url>`,
  )
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages, ...articles].join('')}</urlset>`
})
