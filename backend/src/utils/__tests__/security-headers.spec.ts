import { describe, expect, it, mock } from 'bun:test'
import { securityHeaders } from '../security-headers'

const makeRes = () => ({ setHeader: mock((_name: string, _value: string) => {}) })

describe('securityHeaders', () => {
  it('sets hardening headers on every response', () => {
    const res = makeRes()
    const next = mock(() => {})

    securityHeaders({} as any, res as any, next, false)

    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin')
    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    )
    expect(res.setHeader).toHaveBeenCalledWith('Cross-Origin-Opener-Policy', 'same-origin')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('omits CSP outside production', () => {
    const res = makeRes()

    securityHeaders(
      {} as any,
      res as any,
      mock(() => {}),
      false,
    )

    const names = res.setHeader.mock.calls.map(([name]) => name)
    expect(names).not.toContain('Content-Security-Policy')
  })

  it('adds a CSP in production allowing fonts and same-origin connections', () => {
    const res = makeRes()

    securityHeaders(
      {} as any,
      res as any,
      mock(() => {}),
      true,
    )

    const cspCall = res.setHeader.mock.calls.find(([name]) => name === 'Content-Security-Policy')

    expect(cspCall).toBeDefined()
    expect(cspCall![1]).toContain("default-src 'self'")
    expect(cspCall![1]).toContain('https://fonts.googleapis.com')
    expect(cspCall![1]).toContain('https://fonts.gstatic.com')
    expect(cspCall![1]).toContain("connect-src 'self'")
    expect(cspCall![1]).toContain("frame-ancestors 'none'")
  })
})
