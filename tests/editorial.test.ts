import { describe, expect, it } from 'vitest'
import {
  filterPosts,
  orderPosts,
  readingProgress,
  escapeXml,
  type PostSummary,
} from '../shared/editorial'
const make = (path: string, extra: Partial<PostSummary> = {}): PostSummary => ({
  path,
  title: 'A useful page',
  description: 'Something to keep',
  category: 'Engineering',
  tags: ['offline'],
  date: '2026-09-01',
  author: 'Rowan',
  featured: false,
  readingMinutes: 2,
  ...extra,
})

describe('finding notes', () => {
  const posts = [
    make('/a'),
    make('/b', { category: 'Design', title: 'The space between things', tags: ['type'] }),
  ]
  it('combines category and all search terms without case sensitivity', () => {
    expect(filterPosts(posts, 'Engineering', ' USEFUL offline ').map((p) => p.path)).toEqual(['/a'])
    expect(filterPosts(posts, 'Design', 'offline')).toEqual([])
    expect(filterPosts(posts, 'All', 'useful missing')).toEqual([])
  })
  it('restores every item for an empty query', () =>
    expect(filterPosts(posts, 'All', '  ')).toEqual(posts))
  it('keeps featured notes first, then newest first with stable ties', () => {
    const input = [
      make('/z'),
      make('/a'),
      make('/new', { date: '2026-10-01' }),
      make('/featured', { featured: true, date: '2020-01-01' }),
    ]
    expect(orderPosts(input).map((p) => p.path)).toEqual(['/featured', '/new', '/a', '/z'])
    expect(input[0]?.path).toBe('/z')
  })
})

describe('article progress', () => {
  it('measures only the reading region and clamps outside its bounds', () => {
    expect(readingProgress(100, 2000, 800)).toBe(0)
    expect(readingProgress(-600, 2000, 800)).toBe(50)
    expect(readingProgress(-5000, 2000, 800)).toBe(100)
  })
  it('handles articles shorter than a viewport without dividing by zero', () => {
    expect(readingProgress(100, 300, 800)).toBe(0)
    expect(readingProgress(0, 800, 800)).toBe(100)
  })
})
it('escapes authored text safely for XML feeds', () =>
  expect(escapeXml('A < B & "C"')).toBe('A &lt; B &amp; &quot;C&quot;'))
