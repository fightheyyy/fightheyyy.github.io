import { publicUrl } from '../../shared/editorial'
import { queryCollection } from '@nuxt/content/server'
import { site } from '../../shared/site'
import { escapeXml } from '../../shared/editorial'
export default defineEventHandler(async (event) => {
  const origin = useRuntimeConfig(event).public.siteUrl
  const posts = await queryCollection(event, 'posts')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .select('title', 'path', 'description', 'date')
    .all()
  const items = posts
    .map(
      (post) =>
        `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(publicUrl(post.path, origin))}</link><guid>${escapeXml(publicUrl(post.path, origin))}</guid><description>${escapeXml(post.description)}</description><pubDate>${new Date(post.date).toUTCString()}</pubDate></item>`,
    )
    .join('')
  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(site.name)}</title><link>${escapeXml(origin)}</link><description>${escapeXml(site.description)}</description><language>en</language>${items}</channel></rss>`
})
