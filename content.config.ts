import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

const postSchema = z.object({
  date: z.string(),
  author: z.string(),
  category: z.enum(['Agents', 'Hardware', 'Evals', 'Skills']),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  readingMinutes: z.number().int().positive().optional(),
  raw: z.string().default(''),
})

export default defineContentConfig({
  collections: {
    resume: defineCollection({
      type: 'page',
      source: { include: 'resume/**/*.md', exclude: ['resume/_drafts/**'] },
      schema: postSchema.extend({ category: z.literal('resume') }),
    }),
    posts: defineCollection({
      type: 'page',
      source: { include: 'blog/**/*.md', exclude: ['blog/_drafts/**'] },
      schema: postSchema,
    }),
  },
})
