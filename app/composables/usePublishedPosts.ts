export function usePublishedPosts() {
  return useAsyncData('published-posts', async () => {
    const posts = await queryCollection('posts')
      .where('draft', '=', false)
      .select(
        'path',
        'title',
        'description',
        'date',
        'author',
        'category',
        'tags',
        'featured',
        'readingMinutes',
      )
      .order('date', 'DESC')
      .all()
    return posts.map((post) => ({ ...post, readingMinutes: post.readingMinutes ?? 1 }))
  })
}
