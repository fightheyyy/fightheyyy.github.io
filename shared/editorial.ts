export interface PostSummary {
  path: string
  title: string
  description: string
  date: string
  author: string
  category: string
  tags: string[]
  featured: boolean
  readingMinutes: number
}
export interface Heading {
  id: string
  text: string
  children?: Heading[]
}
export function filterPosts<T extends PostSummary>(
  posts: readonly T[],
  category: string,
  search: string,
): T[] {
  const words = search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  return posts.filter(
    (post) =>
      (category === 'All' || post.category === category) &&
      words.every((word) =>
        [post.title, post.description, post.category, ...post.tags]
          .join(' ')
          .toLocaleLowerCase()
          .includes(word),
      ),
  )
}
export function orderPosts<T extends PostSummary>(posts: readonly T[]): T[] {
  return [...posts].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      b.date.localeCompare(a.date) ||
      a.path.localeCompare(b.path),
  )
}
export function readingProgress(top: number, height: number, viewport: number): number {
  if (height <= viewport) return top <= 0 ? 100 : 0
  return Math.max(0, Math.min(100, Math.round((-top / (height - viewport)) * 100)))
}
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}
export function escapeXml(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] ?? char,
  )
}

export function publicUrl(path: string, origin: string): string {
  return new URL(path.replace(/^\/+/, ''), `${origin.replace(/\/+$/, '')}/`).href
}
