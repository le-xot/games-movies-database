import { describe, expect, it } from 'bun:test'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSecurityHeaders } from '../security-headers'

const INDEX_HTML_PATH = join(import.meta.dir, '..', '..', '..', '..', 'frontend', 'index.html')

/** Хеш считается от точного текста тега <script> без атрибутов — так же, как это делает браузер. */
function inlineScriptHash(): string {
  const html = readFileSync(INDEX_HTML_PATH, 'utf8')
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
  return `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`
}

describe('buildSecurityHeaders', () => {
  it('sets hardening headers on every response', () => {
    const headers = buildSecurityHeaders(false)

    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin')
  })

  it('omits CSP outside production', () => {
    expect(buildSecurityHeaders(false)['Content-Security-Policy']).toBeUndefined()
  })

  it('adds a CSP in production allowing fonts and same-origin connections', () => {
    const csp = buildSecurityHeaders(true)['Content-Security-Policy']

    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('https://fonts.googleapis.com')
    expect(csp).toContain('https://fonts.gstatic.com')
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it.skipIf(!existsSync(INDEX_HTML_PATH))('allows the inline boot script from index.html', () => {
    const csp = buildSecurityHeaders(true)['Content-Security-Policy']

    expect(csp).toContain(inlineScriptHash())
  })
})
