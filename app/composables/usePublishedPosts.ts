export function usePublishedPosts(collection: 'posts' | 'resume' = 'posts') {
  return useAsyncData(`published-${collection}`, async () => {
    const posts = await queryCollection(collection)
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
