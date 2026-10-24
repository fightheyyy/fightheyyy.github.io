import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: 'page',
      source: { include: 'blog/**/*.md', exclude: ['blog/_drafts/**'] },
      schema: z.object({
        date: z.string(),
        author: z.string(),
        category: z.enum(['Agents', 'Hardware', 'Evals', 'Skills']),
        tags: z.array(z.string()).default([]),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        readingMinutes: z.number().int().positive().optional(),
        raw: z.string().default(''),
      }),
    }),
  },
})
