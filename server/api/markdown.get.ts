import { queryCollection } from '@nuxt/content/server'
export default defineEventHandler(async (event) => {
  const path = getQuery(event).path
  if (typeof path !== 'string' || !path.startsWith('/blog/'))
    throw createError({ statusCode: 400, statusMessage: 'An article path is required.' })
  const post = await queryCollection(event, 'posts')
    .path(path)
    .where('draft', '=', false)
    .select('raw')
    .first()
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Note not found.' })
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return post.raw
})
