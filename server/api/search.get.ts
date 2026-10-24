import { queryCollectionSearchSections } from '@nuxt/content/server'
export default defineEventHandler((event) =>
  queryCollectionSearchSections(event, 'posts', {
    extraFields: ['category'],
  }).where('draft', '=', false),
)
