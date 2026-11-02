import { describe, expect, it } from 'bun:test'
import {
  buildSitemap,
  injectPageMeta,
  normalizePath,
  resolvePageMeta,
} from '@backend/server/page-meta'

const SITE = 'https://le-xot.dev'

describe('page meta', () => {
  it('normalizes trailing slashes and queries', () => {
    expect(normalizePath('/db/games/')).toBe('/db/games')
    expect(normalizePath('/db/games?page=2')).toBe('/db/games')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('')).toBe('/')
  })

  it('takes the title, description and canonical from the page table', () => {
    const meta = resolvePageMeta('/db/games/')

    expect(meta.title).toContain('Игры Лешота')
    expect(meta.indexable).toBe(true)
    expect(meta.canonicalPath).toBe('/db/games')
  })

  it('keeps the /db canonical on the page it redirects to', () => {
    expect(resolvePageMeta('/db').canonicalPath).toBe('/db/suggestion')
  })

  it('closes private pages from the index', () => {
    for (const path of [
      '/db/admin',
      '/db/admin/records',
      '/db/ratings/my',
      '/db/users/58511e26-c706-44be-af4e-be39302f35a9/ratings',
      '/auth/callback/twitch',
    ]) {
      expect(resolvePageMeta(path).indexable).toBe(false)
    }
  })

  it('closes unknown pages from the index', () => {
    expect(resolvePageMeta('/nope').indexable).toBe(false)
  })

  it('renders the home head with structured data and keywords', () => {
    const html = injectPageMeta('<!--seo:start--><title>old</title><!--seo:end-->', '/', SITE)

    expect(html).toContain('<title>Лешот — сайт Лешота</title>')
    expect(html).toContain('<link rel="canonical" href="https://le-xot.dev/" />')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('Лехот')
    expect(html).toContain('<meta name="robots" content="index,follow" />')
  })

  it('marks private pages as noindex', () => {
    const html = injectPageMeta('<!--seo:start--><!--seo:end-->', '/db/ratings/my', SITE)

    expect(html).toContain('<meta name="robots" content="noindex,follow" />')
    expect(html).not.toContain('application/ld+json')
  })

  it('leaves a shell without markers untouched', () => {
    const shell = '<!doctype html><title>app</title>'

    expect(injectPageMeta(shell, '/db/games', SITE)).toBe(shell)
  })

  it('lists public pages in the sitemap without redirects', () => {
    const xml = buildSitemap(SITE)

    expect(xml).toContain('<loc>https://le-xot.dev/</loc>')
    expect(xml).toContain('<loc>https://le-xot.dev/db/games</loc>')
    expect(xml).toContain('<loc>https://le-xot.dev/db/suggestion</loc>')
    expect(xml).not.toContain('<loc>https://le-xot.dev/db</loc>')
    expect(xml).not.toContain('/db/admin')
  })
})
