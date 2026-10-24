import { plugin as shadcn } from '@shadcn/lint'
import tsParser from '@typescript-eslint/parser'
import { defineConfig } from 'eslint/config'
import vueParser from 'vue-eslint-parser'

const rules = {
  'shadcn/no-restyle': [
    'error',
    {
      allow: ['layout'],
      componentImports: ['^(?:@|~)/components/ui(?:/|$)'],
    },
  ],
  'shadcn/require-static-classes': [
    'error',
    { componentImports: ['^(?:@|~)/components/ui(?:/|$)'] },
  ],
  'shadcn/no-raw-colors': 'error',
  'shadcn/no-arbitrary-values': 'error',
  'shadcn/no-unknown-classes': 'error',
}

export default defineConfig([
  { ignores: ['node_modules/**', '.nuxt/**', '.output/**', 'references/**', 'artifacts/**'] },
  {
    files: ['app/**/*.vue'],
    languageOptions: { parser: vueParser, parserOptions: { parser: tsParser } },
    plugins: { shadcn },
    rules,
  },
  {
    files: ['app/**/*.ts', 'shared/**/*.ts'],
    languageOptions: { parser: tsParser },
    plugins: { shadcn },
    rules,
  },
  {
    files: ['app/components/ui/**/*.vue'],
    rules: { 'shadcn/no-restyle': 'off', 'shadcn/require-static-classes': 'off' },
  },
])
