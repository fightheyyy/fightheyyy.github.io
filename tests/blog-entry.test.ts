import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'

const script = readFileSync(new URL('../public/entry.js', import.meta.url), 'utf8')
function visit(path: string, base = '/') {
  const replace = vi.fn()
  const replaceState = vi.fn()
  runInNewContext(script, {
    URL,
    document: { currentScript: { src: `https://example.com${base}entry.js` } },
    location: { href: `https://example.com${path}`, replace },
    history: { state: null, replaceState },
    localStorage: { removeItem() {} },
    sessionStorage: { removeItem() {} },
    window: {},
    Math: { random() { throw new Error('Homepage must not choose randomly') } },
  })
  return { replace, replaceState }
}

it.each(['/', '/index.html', '/?view=unknown', '/classic/', '/classic/index.html'])('keeps %s on its requested page', (path) => {
  expect(visit(path).replace).not.toHaveBeenCalled()
})

it('switches to Minimal while preserving query and hash', () => {
  const result = visit('/?view=minimal&source=link#blog')
  expect(result.replace).toHaveBeenCalledWith('https://example.com/classic/index.html?source=link&view=minimal#blog')
  expect(result.replaceState).toHaveBeenCalledWith(null, '', 'https://example.com/?source=link#blog')
})

it('switches back to Editorial under a repository base path', () => {
  expect(visit('/blog/classic/index.html?view=editorial#projects', '/blog/').replace)
    .toHaveBeenCalledWith('https://example.com/blog/?view=editorial#projects')
  const destination = visit('/blog/?view=editorial#projects', '/blog/')
  expect(destination.replace).not.toHaveBeenCalled()
  expect(destination.replaceState).toHaveBeenCalledWith(null, '', 'https://example.com/blog/#projects')
})

it.each(['/blog/an-article?view=minimal', '/terminal?view=minimal'])('leaves %s untouched', (path) => {
  const result = visit(path)
  expect(result.replace).not.toHaveBeenCalled()
  expect(result.replaceState).not.toHaveBeenCalled()
})
