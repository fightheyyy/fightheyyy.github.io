import { queryCollection } from '@nuxt/content/server'
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!slug.endsWith('.md')) throw createError({ statusCode: 404 })
  const post = await queryCollection(event, 'posts')
    .path(`/${slug.slice(0, -3)}`)
    .where('draft', '=', false)
    .select('raw')
    .first()
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Note not found.' })
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return post.raw
})
